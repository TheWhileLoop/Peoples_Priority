import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ThumbsUp, MessageSquare, MoreHorizontal, MapPin } from 'lucide-react';

const MOCK_POSTS = [
  {
    id: 'demo-1',
    citizen_name: 'Rahul Sharma',
    ward_name: 'Andheri East, Mumbai',
    title: 'Deep potholes causing accidents near Metro Station',
    description: 'There are several deep potholes on the main road right under the Metro station. Two bikers slipped yesterday night. Please fix this urgently before someone gets seriously hurt.',
    category: 'Roads',
    status: 'pending',
    image_file: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
    upvotes_count: 142,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'demo-2',
    citizen_name: 'Priya Desai',
    ward_name: 'Borivali West, Mumbai',
    title: 'No water supply for 3 days',
    description: 'Our society and neighboring lanes have not received municipal water supply for the last 3 days. We are forced to buy private tankers at exorbitant rates. No prior notice was given.',
    category: 'Water',
    status: 'investigating',
    image_file: 'https://images.unsplash.com/photo-1542159187-5ceb2923ffc8?auto=format&fit=crop&q=80&w=800',
    upvotes_count: 89,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'demo-3',
    citizen_name: 'Amit Patel',
    ward_name: 'Dharavi, Mumbai',
    title: 'Street lights completely broken in Sector 4',
    description: 'The entire stretch of Sector 4 is pitch dark at night. This is causing severe safety concerns for women returning from work. Multiple complaints to the local office have been ignored.',
    category: 'Electricity',
    status: 'pending',
    image_file: 'EMPTY',
    upvotes_count: 215,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'demo-4',
    citizen_name: 'Sneha K',
    ward_name: 'Kurla East, Mumbai',
    title: 'Garbage dump overflowing onto the street',
    description: 'The community garbage bins have not been cleared for over a week. The waste is now spilling onto the road, creating an unbearable stench and breeding ground for mosquitoes.',
    category: 'Garbage',
    status: 'resolved',
    image_file: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800',
    upvotes_count: 56,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'demo-5',
    citizen_name: 'Vikram Singh',
    ward_name: 'Bandra West, Mumbai',
    title: 'Broken footpath near St. Mary High School',
    description: 'The paver blocks on the footpath are completely uprooted. School children are forced to walk on the busy road, which is very dangerous during peak traffic hours.',
    category: 'Infrastructure',
    status: 'pending',
    image_file: 'EMPTY',
    upvotes_count: 112,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  }
];

export default function FacebookStyleFeed({ hideHeader = false }) {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [upvotedIds, setUpvotedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/collect/posts/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      let realPosts = [];
      if (res.data?.results) {
        realPosts = res.data.results;
      } else if (Array.isArray(res.data)) {
        realPosts = res.data;
      }
      
      // Combine API posts with Hardcoded posts so the feed always looks active
      const combined = [...realPosts, ...MOCK_POSTS];
      
      // Filter out any duplicates if IDs accidentally clash
      const uniquePosts = combined.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
      
      setComplaints(uniquePosts);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      // Fallback to only mock posts if API completely fails
      setComplaints(MOCK_POSTS);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (complaint) => {
    if (!token) {
      alert("Please register or login first to like this post!");
      navigate('/login');
      return;
    }
    
    if (upvotedIds.has(complaint.id)) return;

    // Optimistic UI update
    setUpvotedIds(prev => new Set([...prev, complaint.id]));
    setComplaints(prev => prev.map(c => 
      c.id === complaint.id ? { ...c, upvotes_count: (c.upvotes_count || 0) + 1 } : c
    ));

    try {
      await axios.post(`http://localhost:8000/api/collect/posts/${complaint.id}/upvote/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to upvote:", err);
      // Revert optimistic update on failure
      setUpvotedIds(prev => {
        const next = new Set([...prev]);
        next.delete(complaint.id);
        return next;
      });
      setComplaints(prev => prev.map(c => 
        c.id === complaint.id ? { ...c, upvotes_count: Math.max(0, (c.upvotes_count || 1) - 1) } : c
      ));
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-6">
      
      {!hideHeader && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <h1 className="text-xl font-bold text-slate-800">Community Feed</h1>
          <p className="text-sm text-slate-500">See what your neighbors are reporting.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500">
          No posts available right now. Be the first to report an issue!
        </div>
      ) : (
        complaints.map((complaint) => (
          <div key={complaint.id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-100 overflow-hidden transform hover:-translate-y-1">
            
            {/* Post Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {(complaint.citizen_name || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                    {complaint.citizen_name || 'Concerned Citizen'}
                  </h3>
                  <div className="flex items-center text-xs text-slate-500 space-x-1 mt-0.5">
                    <span>{formatDate(complaint.created_at)}</span>
                    <span>·</span>
                    <MapPin className="w-3 h-3" />
                    <span>{complaint.ward_name || complaint.ward || 'Local Area'}</span>
                  </div>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post Body */}
            <div className="px-4 pb-3">
              <h2 className="text-base font-bold text-slate-800 mb-1">{complaint.title || 'Civic Issue Reported'}</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {complaint.description || complaint.snippet}
              </p>
            </div>

            {/* Post Tags */}
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                {complaint.category || 'General'}
              </span>
              {complaint.status && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                  complaint.status === 'resolved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {complaint.status.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>

            {/* Post Image (if any) */}
            {complaint.image_file && complaint.image_file !== 'EMPTY' && (
              <div className="w-full bg-slate-100 max-h-[400px] overflow-hidden flex items-center justify-center">
                <img 
                  src={complaint.image_file} 
                  alt="Complaint Evidence" 
                  className="w-full object-cover max-h-[400px]"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Post Stats */}
            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <div className="bg-blue-600 rounded-full p-1">
                  <ThumbsUp className="w-3 h-3 text-white fill-white" />
                </div>
                <span>{(complaint.upvotes_count || 0) + (upvotedIds.has(complaint.id) ? 1 : 0)} Likes</span>
              </div>
              <div>
                <span>0 Comments</span>
              </div>
            </div>

            {/* Post Actions */}
            <div className="px-2 py-2 flex items-center justify-between gap-2">
              <button 
                onClick={() => handleUpvote(complaint)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  upvotedIds.has(complaint.id) || complaint.is_upvoted
                    ? 'text-blue-700 bg-blue-50 shadow-sm border border-blue-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${upvotedIds.has(complaint.id) || complaint.is_upvoted ? 'fill-blue-600' : ''}`} />
                <span>Like</span>
              </button>
              
              <button className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all duration-200">
                <MessageSquare className="w-5 h-5" />
                <span>Comment</span>
              </button>
            </div>
            
          </div>
        ))
      )}
    </div>
  );
}
