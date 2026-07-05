import { create } from 'zustand';

// Pre-filled mock complaints to make the dashboard look populated and real
const initialComplaints = [
  {
    id: 'c1',
    text: 'Huge potholes near the main junction in Andheri East. Extremely dangerous at night.',
    category: 'Roads',
    ward: 'Ward 4 - Andheri East',
    latitude: 19.1155,
    longitude: 72.8755,
    status: 'Pending',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
    user: 'citizen@demo.com',
    type: 'text'
  },
  {
    id: 'c2',
    text: 'Continuous clean water leaking from the pipe near Sector 5 market. Wasting thousands of liters daily.',
    category: 'Water Supply',
    ward: 'Ward 12 - Sector 5',
    latitude: 19.1200,
    longitude: 72.8850,
    status: 'Pending',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    user: 'citizen@demo.com',
    type: 'text'
  },
  {
    id: 'c3',
    text: 'Garbage dump pile has not been cleared for over a week near the park. Smells horrible.',
    category: 'Waste Management',
    ward: 'Ward 2 - Vile Parle',
    latitude: 19.1000,
    longitude: 72.8450,
    status: 'In Progress',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    user: 'citizen@demo.com',
    type: 'photo',
    media_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'c4',
    text: 'Streetlights are not functioning on the main highway stretch. High risk of accidents.',
    category: 'Electricity',
    ward: 'Ward 8 - Sector 3',
    latitude: 19.1300,
    longitude: 72.8600,
    status: 'Resolved',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), // 5 days ago
    user: 'citizen@demo.com',
    type: 'text'
  }
];

const initialClusters = [
  {
    id: 'cl1',
    title: 'Road Condition in Andheri East',
    category: 'Roads',
    severity_score: 9.8,
    sentiment: 'Highly Negative',
    status: 'Pending',
    department: 'PWD',
    ward: 'Ward 4 - Andheri East',
    center_latitude: 19.1155,
    center_longitude: 72.8755,
    mentions: 450,
    ai_summary: 'Severe potholes reported on main arterial roads near Andheri East junction causing high traffic delays and nighttime accidents. Rapid action required.',
    complaint_ids: ['c1']
  },
  {
    id: 'cl2',
    title: 'Water Pipeline Leakage at Sector 5',
    category: 'Water Supply',
    severity_score: 8.5,
    sentiment: 'Negative',
    status: 'Pending',
    department: 'Jal Board',
    ward: 'Ward 12 - Sector 5',
    center_latitude: 19.1200,
    center_longitude: 72.8850,
    mentions: 210,
    ai_summary: 'Major clean water pipeline burst in Sector 5 commercial sector resulting in loss of drinking water supply to 200+ households. Residents are highly concerned.',
    complaint_ids: ['c2']
  },
  {
    id: 'cl3',
    title: 'Garbage Dump near Central Park',
    category: 'Waste Management',
    severity_score: 6.4,
    sentiment: 'Negative',
    status: 'In Progress',
    department: 'Waste Management',
    ward: 'Ward 2 - Vile Parle',
    center_latitude: 19.1000,
    center_longitude: 72.8450,
    mentions: 95,
    ai_summary: 'Solid waste accumulation reported outside the municipal park area. Residents smell foul odor. Routed to sanitation team for pickup.',
    complaint_ids: ['c3']
  },
  {
    id: 'cl4',
    title: 'Streetlights Failures in Sector 3',
    category: 'Electricity',
    severity_score: 7.2,
    sentiment: 'Neutral',
    status: 'Resolved',
    department: 'Electricity Board',
    ward: 'Ward 8 - Sector 3',
    center_latitude: 19.1300,
    center_longitude: 72.8600,
    mentions: 120,
    ai_summary: 'Dark spots created on major sub-lanes in Sector 3 due to bulb failure. Local corporation has replaced the wiring and standard LED lights.',
    complaint_ids: ['c4']
  }
];

export const useComplaintStore = create((set, get) => ({
  complaints: initialComplaints,
  clusters: initialClusters,

  addComplaint: (newComplaint) => {
    const id = 'c_' + Math.random().toString(36).substr(2, 9);
    const complaint = {
      id,
      status: 'Pending',
      created_at: new Date().toISOString(),
      ...newComplaint
    };

    set((state) => {
      // Find matching cluster by category and ward, or create a new one
      const updatedComplaints = [complaint, ...state.complaints];
      let updatedClusters = [...state.clusters];
      
      const existingClusterIndex = updatedClusters.findIndex(
        (c) => c.category === complaint.category
      );

      if (existingClusterIndex > -1) {
        // Update existing cluster
        const target = updatedClusters[existingClusterIndex];
        const newMentions = target.mentions + 1;
        // Increase severity slightly based on new complaint reports
        const newSeverity = Math.min(10.0, parseFloat((target.severity_score + 0.1).toFixed(1)));
        
        updatedClusters[existingClusterIndex] = {
          ...target,
          mentions: newMentions,
          severity_score: newSeverity,
          complaint_ids: [...target.complaint_ids, id]
        };
      } else {
        // Create a new cluster
        const newClusterId = 'cl_' + Math.random().toString(36).substr(2, 9);
        const newCluster = {
          id: newClusterId,
          title: `Reported ${complaint.category} Issue`,
          category: complaint.category,
          severity_score: parseFloat((4.0 + Math.random() * 3.0).toFixed(1)),
          sentiment: 'Negative',
          status: 'Pending',
          department: getDepartmentByCategory(complaint.category),
          center_latitude: complaint.latitude || 19.1155,
          center_longitude: complaint.longitude || 72.8755,
          mentions: 1,
          ai_summary: `Initial report of ${complaint.category} issues received. AI summary will compile as more citizens report.`,
          complaint_ids: [id]
        };
        updatedClusters.unshift(newCluster);
      }

      return {
        complaints: updatedComplaints,
        clusters: updatedClusters
      };
    });

    return complaint;
  },

  updateClusterStatus: (clusterId, newStatus) => {
    set((state) => {
      const updatedClusters = state.clusters.map((cluster) => {
        if (cluster.id === clusterId) {
          return { ...cluster, status: newStatus };
        }
        return cluster;
      });

      // Cascade status change to complaints in that cluster
      const targetCluster = state.clusters.find((c) => c.id === clusterId);
      const updatedComplaints = state.complaints.map((comp) => {
        if (targetCluster && targetCluster.complaint_ids.includes(comp.id)) {
          return { ...comp, status: newStatus };
        }
        return comp;
      });

      return {
        clusters: updatedClusters,
        complaints: updatedComplaints
      };
    });
  },

  upvoteCluster: (clusterId) => {
    set((state) => {
      const updatedClusters = state.clusters.map((cluster) => {
        if (cluster.id === clusterId) {
          const newMentions = cluster.mentions + 1;
          const newSeverity = Math.min(10.0, parseFloat((cluster.severity_score + 0.15).toFixed(2)));
          return {
            ...cluster,
            mentions: newMentions,
            severity_score: newSeverity
          };
        }
        return cluster;
      });
      return { clusters: updatedClusters };
    });
  },

  routeClusterDepartment: (clusterId, newDepartment) => {
    set((state) => {
      const updatedClusters = state.clusters.map((cluster) => {
        if (cluster.id === clusterId) {
          return { ...cluster, department: newDepartment };
        }
        return cluster;
      });
      return { clusters: updatedClusters };
    });
  }
}));

// Helper function to auto-assign department by category
function getDepartmentByCategory(category) {
  switch (category) {
    case 'Roads':
      return 'PWD';
    case 'Water Supply':
      return 'Jal Board';
    case 'Waste Management':
      return 'Waste Management';
    case 'Electricity':
      return 'Electricity Board';
    default:
      return 'General Admin';
  }
}
