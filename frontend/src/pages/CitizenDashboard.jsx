import React, { useState, useEffect } from 'react';
import { Mic, Camera, FileText, MapPin, RefreshCw, Send, CheckCircle, Clock, AlertCircle, ChevronRight, ThumbsUp, Layers } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useComplaintStore, mpDistricts } from '../store/complaintStore';

// Pre-defined sample photos representing civic issues for quick testing/demo
const samplePhotos = [
  {
    id: 's1',
    name: 'Pothole',
    category: 'Roads',
    text: 'A dangerous pothole is causing minor accidents near the main crossing.',
    url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 's2',
    name: 'Broken Water Pipe',
    category: 'Water Supply',
    text: 'Huge water leak near the main pipeline. Road is flooded.',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 's3',
    name: 'Garbage Pile',
    category: 'Waste Management',
    text: 'Overflowing municipal garbage bin near the apartments. Strong odor.',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=300&q=80'
  }
];

export default function CitizenDashboard() {
  const { user } = useAuthStore();
  const { complaints, clusters, addComplaint, upvoteCluster } = useComplaintStore();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'my-issues' | 'community'
  const [reportMethod, setReportMethod] = useState('text'); // 'text' | 'voice' | 'photo'
  
  // Form State
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Roads');
  const [district, setDistrict] = useState('Indore');
  const [photoUrl, setPhotoUrl] = useState(null);
  
  // Simulated Interactive States
  const [isLocating, setIsLocating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Success / Confirmation Screen State
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [confetti, setConfetti] = useState([]);

  // Voice recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Confetti generator
  useEffect(() => {
    if (showConfirmation) {
      const arr = Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * -20 - 10,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 4,
        delay: Math.random() * 2,
        duration: Math.random() * 2 + 2
      }));
      setConfetti(arr);
    } else {
      setConfetti([]);
    }
  }, [showConfirmation]);

  // Simulate Fetching GPS Coordinates
  const handleGPSLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      setIsLocating(false);
      setDistrict('Indore');
    }, 1200);
  };

  // Simulate Speak Button click
  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording and simulate AI translation
      setIsRecording(false);
      setIsTranslating(true);
      setTimeout(() => {
        setIsTranslating(false);
        setDescription('Hamare area me road bilkul kharab ho chuki hai, bade gadde hain. (Voice Input translated: The road in our area is completely damaged, there are large potholes.)');
        setCategory('Roads');
      }, 2000);
    } else {
      setDescription('');
      setIsRecording(true);
    }
  };

  // Simulate Photo selection / scanning
  const handleSelectPhoto = (sample) => {
    setPhotoUrl(sample.url);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setDescription(sample.text);
      setCategory(sample.category);
    }, 2200);
  };

  const handleCustomPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        setDescription('Reported civic issue at current district coordinate.');
        setCategory('Roads');
      }, 2200);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    
    setTimeout(() => {
      const complaintData = {
        text: description,
        category,
        district,
        type: reportMethod,
        media_url: photoUrl,
        user: user?.email || 'guest@demo.com',
        latitude: 23.2599 + (Math.random() - 0.5) * 0.02,
        longitude: 77.4126 + (Math.random() - 0.5) * 0.02
      };

      const result = addComplaint(complaintData);
      setSubmittedComplaint(result);
      setIsSubmitting(false);
      setShowConfirmation(true);
      
      // Clear form
      setDescription('');
      setPhotoUrl(null);
    }, 1800);
  };

  // Get user specific complaints
  const userComplaints = complaints.filter(
    (c) => c.user === (user?.email || 'guest@demo.com')
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-[90vh] relative">
      
      {/* Dynamic Confetti for success */}
      {showConfirmation && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute rounded-full"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: `${c.size}px`,
                height: `${c.size}px`,
                backgroundColor: c.color,
                animation: `fall ${c.duration}s linear infinite`,
                animationDelay: `${c.delay}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-100 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Citizen Dashboard</h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-sm text-slate-500">
              Welcome back, <span className="font-bold text-slate-700">{user?.first_name || 'Guest Citizen'}</span> 
              {user?.email && ` (${user.email})`}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('report'); setShowConfirmation(false); }}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${activeTab === 'report' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Report Issue
          </button>
          <button
            onClick={() => { setActiveTab('my-issues'); setShowConfirmation(false); }}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all relative ${activeTab === 'my-issues' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            My Submissions
            {userComplaints.length > 0 && (
              <span className="ml-1.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {userComplaints.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('community'); setShowConfirmation(false); }}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${activeTab === 'community' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Nearby Feed ("Me Too")
          </button>
        </div>
      </div>

      {/* CONFIRMATION SCREEN OVERLAY (INLINE) */}
      {showConfirmation ? (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto text-center py-12 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 text-emerald-600">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Aapki baat receive ho gayi! ✅</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm">
            AI processed your issue successfully and routed it to the constituency priority map.
          </p>

          {/* AI Metrics Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 text-left mb-8 max-w-md mx-auto">
            <div className="flex items-center space-x-2 text-blue-800 font-bold mb-3 text-sm">
              <Layers className="w-4 h-4" />
              <span>AI Severity & Priority Details</span>
            </div>
            <div className="space-y-2 text-slate-700 text-sm">
              <div className="flex justify-between">
                <span>Priority Index:</span>
                <span className="font-bold text-red-600">🔥 High (Severity 8.9/10)</span>
              </div>
              <div className="flex justify-between">
                <span>Cluster Assignment:</span>
                <span className="font-bold text-slate-800">{submittedComplaint?.category} Problems</span>
              </div>
              <div className="flex justify-between">
                <span>Constituency District:</span>
                <span className="font-bold text-slate-800">{submittedComplaint?.district}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200/50 pt-2 mt-2">
                <span>Community Upvotes:</span>
                <span className="font-bold text-indigo-700">1 (You) + 340 active mentions</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs sm:max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('my-issues')}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
            >
              Track Issue Status
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-sm"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: REPORT COMPLAINT */}
          {activeTab === 'report' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Form Settings */}
              <div className="space-y-6 lg:col-span-1">
                {/* District/Location Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-blue-500" /> Location Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Detected District</label>
                      <div className="relative">
                        <select 
                          value={district} 
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          {mpDistricts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGPSLocation}
                      disabled={isLocating}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all border border-blue-100"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Acquiring GPS...' : 'Auto-Detect via GPS'}</span>
                    </button>
                  </div>
                </div>

                {/* AI Classification Info */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg text-white">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
                    <Layers className="w-4 h-4 mr-1.5 text-indigo-400" /> AI Classification
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Upload voice or photos. Gemini AI scans submissions to identify category & matches duplicate complaints to prioritize them.
                  </p>
                  <div className="flex items-center space-x-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 text-indigo-300">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-[11px] font-medium leading-tight">Photos/Voice inputs will auto-fill your descriptions!</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Report Form Input */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
                
                {/* Method selector buttons */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Choose Reporting Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => { setReportMethod('voice'); setDescription(''); setPhotoUrl(null); }}
                      className={`flex flex-col items-center justify-center py-4 px-2 border rounded-2xl transition-all ${reportMethod === 'voice' ? 'border-blue-500 bg-blue-50/50 text-blue-600 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Mic className="w-6 h-6 mb-2" />
                      <span className="text-xs">🎙️ Speak (Voice)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReportMethod('photo'); setDescription(''); setPhotoUrl(null); }}
                      className={`flex flex-col items-center justify-center py-4 px-2 border rounded-2xl transition-all ${reportMethod === 'photo' ? 'border-blue-500 bg-blue-50/50 text-blue-600 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Camera className="w-6 h-6 mb-2" />
                      <span className="text-xs">📸 Snap (Photo)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReportMethod('text'); setDescription(''); setPhotoUrl(null); }}
                      className={`flex flex-col items-center justify-center py-4 px-2 border rounded-2xl transition-all ${reportMethod === 'text' ? 'border-blue-500 bg-blue-50/50 text-blue-600 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <FileText className="w-6 h-6 mb-2" />
                      <span className="text-xs">⌨️ Type (Text)</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* DYNAMIC VIEW FOR VOICE TAB */}
                  {reportMethod === 'voice' && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 text-center space-y-4">
                      <h4 className="text-sm font-bold text-slate-700">"Boliye, aapki kya samasya hai?"</h4>
                      
                      <div className="flex justify-center items-center h-16">
                        {isRecording ? (
                          <div className="flex space-x-1.5 items-center justify-center h-full">
                            {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                              <div
                                key={i}
                                className="w-1 bg-red-500 rounded-full animate-wave"
                                style={{
                                  height: `${h * 10}%`,
                                  animationDelay: `${i * 0.1}s`
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Speech API Ready. Click below to start speaking.</span>
                        )}
                      </div>

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={handleVoiceRecord}
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-md hover:scale-105 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          <Mic className="w-6 h-6" />
                        </button>
                      </div>

                      {isRecording && (
                        <div className="text-sm font-bold text-red-500">
                          Recording: {recordingSeconds}s
                        </div>
                      )}

                      {isTranslating && (
                        <div className="flex items-center justify-center space-x-2 text-slate-500 text-xs">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                          <span>AI Vernacular translating (Hindi ➡️ English)...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DYNAMIC VIEW FOR PHOTO TAB */}
                  {reportMethod === 'photo' && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 text-center space-y-4 relative overflow-hidden">
                        
                        {/* AI Scanning overlay visual */}
                        {isScanning && (
                          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none">
                            <div className="w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-scan absolute left-0" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center space-x-1.5">
                                <RefreshCw className="w-3 animate-spin text-blue-400" />
                                <span>AI analyzing civic issue severity...</span>
                              </span>
                            </div>
                          </div>
                        )}

                        {photoUrl ? (
                          <div className="flex flex-col items-center">
                            <img src={photoUrl} alt="Uploaded Issue" className="h-44 object-cover rounded-xl shadow-md border border-slate-200 max-w-full" />
                            <button
                              type="button"
                              onClick={() => { setPhotoUrl(null); setDescription(''); }}
                              className="mt-3 text-xs text-red-500 font-bold hover:underline"
                            >
                              Remove Photo
                            </button>
                          </div>
                        ) : (
                          <div className="py-6 flex flex-col items-center justify-center">
                            <Camera className="w-10 h-10 text-slate-400 mb-2" />
                            <span className="text-xs text-slate-500 font-medium mb-2">Upload photo of the issue</span>
                            <input
                              type="file"
                              accept="image/*"
                              id="photo-file"
                              onChange={handleCustomPhotoUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="photo-file"
                              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer shadow-sm"
                            >
                              Choose File
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Demo Quick-Selection Photos */}
                      {!photoUrl && !isScanning && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Or click sample photo to test AI Vision:</label>
                          <div className="grid grid-cols-3 gap-3">
                            {samplePhotos.map((photo) => (
                              <div
                                key={photo.id}
                                onClick={() => handleSelectPhoto(photo)}
                                className="cursor-pointer group relative rounded-xl overflow-hidden shadow-sm border border-slate-200/80 hover:border-blue-500 hover:scale-[1.02] transition-all"
                              >
                                <img src={photo.url} alt={photo.name} className="h-20 w-full object-cover group-hover:brightness-95 transition-all" />
                                <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 p-1 text-center">
                                  <span className="text-[10px] text-white font-bold">{photo.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Standard Text Box */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                      placeholder="Write description here. Be specific. AI will automatically evaluate severity score..."
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="Roads">🚗 Roads (Potholes, Repair)</option>
                        <option value="Water Supply">💧 Water Supply (Leak, Sewage)</option>
                        <option value="Waste Management">🗑️ Waste Management (Trash heap)</option>
                        <option value="Electricity">💡 Electricity (Streetlights)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Department (AI)</label>
                      <div className="w-full px-4 py-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-sm font-semibold">
                        {category === 'Roads' && 'PWD'}
                        {category === 'Water Supply' && 'Jal Board'}
                        {category === 'Waste Management' && 'Waste Department'}
                        {category === 'Electricity' && 'Electricity Board'}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isScanning || isRecording || isTranslating}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                        <span>AI evaluating & routing complaint...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Priority Complaint</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: MY ISSUES / TRACK STATUS */}
          {activeTab === 'my-issues' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Track My Submissions</h2>
              
              {userComplaints.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">You haven't reported any issues yet.</p>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="mt-4 inline-flex items-center text-sm font-bold text-blue-600 hover:underline"
                  >
                    Report your first issue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {userComplaints.map((comp) => {
                    // Match to corresponding cluster if it exists
                    const matchingCluster = clusters.find((c) => c.complaint_ids.includes(comp.id));
                    
                    return (
                      <div key={comp.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 relative overflow-hidden">
                        
                        {/* Color accent status line */}
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${comp.status === 'Resolved' ? 'bg-emerald-500' : comp.status === 'In Progress' ? 'bg-orange-500' : 'bg-red-500'}`} />

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pl-3">
                          <div>
                            <div className="flex items-center space-x-2.5">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${comp.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : comp.status === 'In Progress' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                {comp.status}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(comp.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mt-2">{comp.category} Issue in {comp.ward}</h3>
                            <p className="text-sm text-slate-500 mt-1">{comp.text}</p>
                          </div>

                          {/* Thumbnail if photo uploaded */}
                          {comp.media_url && (
                            <img src={comp.media_url} alt="complaint proof" className="h-16 w-16 object-cover rounded-xl border border-slate-100 self-start" />
                          )}
                        </div>

                        {/* Visual Progress Timeline */}
                        <div className="pl-3 border-t border-slate-100 pt-5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Complaint Lifecycle Status</h4>
                          
                          <div className="grid grid-cols-4 gap-2 relative">
                            {/* Connector line */}
                            <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-slate-200 z-0" />
                            <div 
                              className="absolute top-4 left-[12.5%] h-0.5 bg-emerald-500 transition-all duration-1000 z-0"
                              style={{
                                width: comp.status === 'Resolved' ? '75%' : comp.status === 'In Progress' ? '50%' : '25%'
                              }}
                            />

                            {/* Stepper Node 1: Received */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white shadow-md">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 mt-2">Received</span>
                              <span className="text-[9px] text-slate-400">AI Registered</span>
                            </div>

                            {/* Stepper Node 2: AI Cluster Match */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md ${matchingCluster ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {matchingCluster ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 mt-2">Clustered</span>
                              <span className="text-[9px] text-slate-400">{matchingCluster ? `Score: ${matchingCluster.severity_score}/10` : 'Searching...'}</span>
                            </div>

                            {/* Stepper Node 3: In Progress */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md ${comp.status === 'In Progress' || comp.status === 'Resolved' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {comp.status === 'In Progress' || comp.status === 'Resolved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 mt-2">Action</span>
                              <span className="text-[9px] text-slate-400">{comp.status === 'In Progress' || comp.status === 'Resolved' ? `Dept: ${matchingCluster?.department}` : 'Awaiting Dept'}</span>
                            </div>

                            {/* Stepper Node 4: Resolved */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md ${comp.status === 'Resolved' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {comp.status === 'Resolved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 mt-2">Resolved</span>
                              <span className="text-[9px] text-slate-400">{comp.status === 'Resolved' ? 'Verified Done' : 'Pending Work'}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NEIGHBORHOOD FEED / ME TOO */}
          {activeTab === 'community' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Nearby Constituency Issues</h2>
                  <p className="text-xs text-slate-500">Problems reported in your 2km radius. Upvote instead of writing duplicates.</p>
                </div>
                <div className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100 self-start">
                  📌 Ward: Andheri East constituency
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clusters.filter(c => c.status !== 'Resolved').map((cluster) => (
                  <div key={cluster.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${cluster.severity_score >= 8.0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                          Severity: {cluster.severity_score}/10
                        </span>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{cluster.category}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 mt-3">{cluster.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Location: {cluster.ward}</p>
                      
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">AI Summary Insight:</span>
                        <p className="text-xs text-slate-500 mt-1 italic">"{cluster.ai_summary}"</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                      <span className="text-xs text-slate-400 font-medium">👥 {cluster.mentions} citizens affected</span>
                      
                      <button
                        type="button"
                        onClick={() => upvoteCluster(cluster.id)}
                        className="flex items-center space-x-1.5 py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow hover:shadow-md transition-all active:scale-95"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Me Too (Upvote)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
