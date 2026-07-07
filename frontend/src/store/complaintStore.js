import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Global interceptor to handle expired or invalid tokens (401 errors)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
      // Redirect to login if token is invalid
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const mpDistricts = [
  "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal",
  "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior",
  "Harda", "Narmadapuram", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur",
  "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar",
  "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh",
  "Ujjain", "Umaria", "Vidisha", "Mauganj", "Pandhurna", "Maihar"
].sort();

export const useComplaintStore = create((set, get) => ({
  complaints: [],
  clusters: [],
  adminStats: { total_ingested_reports: 0, active_clusters: 0, resolved_issues: 0, public_sentiment: 'Loading...' },
  adminFiltersData: { districts: [], wards: [], categories: [] },
  weeklySummary: null,
  loading: false,
  error: null,

  fetchAdminStats: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.district && filters.district !== 'All') params.append('district', filters.district);
      if (filters.ward && filters.ward !== 'All') params.append('ward', filters.ward);
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      
      const res = await axios.get(`${BASE_URL}/admin/stats/?${params.toString()}`, { headers: getHeaders() });
      set({ adminStats: res.data });
    } catch (err) {
      console.error("Error fetching admin stats", err);
    }
  },

  fetchAdminFiltersData: async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/filters/`, { headers: getHeaders() });
      set({ adminFiltersData: res.data });
    } catch (err) {
      console.error("Error fetching admin filters", err);
    }
  },

  fetchWeeklySummary: async (filters = {}) => {
    set({ weeklySummary: null }); // Set to null to show loading state
    try {
      const params = new URLSearchParams();
      if (filters.district && filters.district !== 'All') params.append('district', filters.district);
      
      const res = await axios.get(`${BASE_URL}/weekly-summary/?${params.toString()}`, { headers: getHeaders() });
      set({ weeklySummary: res.data });
    } catch (err) {
      console.error("Error fetching weekly summary", err);
      set({ weeklySummary: { error: "Error fetching AI summary." } });
    }
  },

  // Fetch all complaints from DB
  fetchComplaints: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get(`${BASE_URL}/collect/complaints/`, { headers: getHeaders() });
      set({ complaints: res.data, loading: false });
    } catch (err) {
      console.warn("Backend unreachable, keeping fallback or empty complaints list.");
      set({ loading: false });
    }
  },

  // Fetch all clustered issues from DB
  fetchClusters: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.district && filters.district !== 'All') params.append('district', filters.district);
      if (filters.ward && filters.ward !== 'All') params.append('ward', filters.ward);
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);

      const res = await axios.get(`${BASE_URL}/clusters/?${params.toString()}`, { headers: getHeaders() });
      set({ clusters: res.data, loading: false });
    } catch (err) {
      console.warn("Backend unreachable, keeping fallback or empty clusters list.");
      set({ loading: false });
    }
  },

  // Citizen files a new complaint
  addComplaint: async (complaintData) => {
    set({ loading: true, error: null });
    try {
      // Create FormData if uploading files
      const formData = new FormData();
      Object.keys(complaintData).forEach(key => {
        if (complaintData[key] !== null && complaintData[key] !== undefined) {
          formData.append(key, complaintData[key]);
        }
      });

      const res = await axios.post(`${BASE_URL}/collect/complaints/`, formData, {
        headers: {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refetch to get updated list and newly created/updated clusters
      await get().fetchComplaints();
      await get().fetchClusters();
      
      set({ loading: false });
      return res.data;
    } catch (err) {
      console.error("Error creating complaint:", err);
      // Local offline fallback
      const mockComplaint = {
        id: 'c_' + Math.random().toString(36).substr(2, 9),
        title: complaintData.title || 'Civic Complaint',
        description: complaintData.description,
        category: complaintData.category || 'other',
        ward: complaintData.ward || 'Ward 4 - Andheri East',
        status: 'pending_ai',
        upvotes_count: 0,
        created_at: new Date().toISOString(),
      };
      
      set(state => ({
        complaints: [mockComplaint, ...state.complaints],
        loading: false
      }));
      return mockComplaint;
    }
  },

  // Citizen upvotes a complaint
  upvoteComplaint: async (complaintId) => {
    try {
      const res = await axios.post(`${BASE_URL}/collect/complaints/${complaintId}/upvote/`, {}, {
        headers: getHeaders()
      });

      // Update complaints locally
      set(state => {
        const updatedComplaints = state.complaints.map(c => {
          if (c.id === complaintId) {
            return {
              ...c,
              upvotes_count: res.data.upvotes_count,
              is_upvoted: res.data.upvoted
            };
          }
          return c;
        });

        // Update cluster locally if available
        const updatedClusters = state.clusters.map(cluster => {
          const hasComplaint = cluster.complaints?.some(c => c.id === complaintId);
          if (hasComplaint) {
            return {
              ...cluster,
              mentions_count: res.data.mentions_count,
              severity_score: res.data.new_severity_score
            };
          }
          return cluster;
        });

        return {
          complaints: updatedComplaints,
          clusters: updatedClusters
        };
      });
      return res.data;
    } catch (err) {
      console.error("Error upvoting complaint:", err);
      // Local fallback
      set(state => {
        const updated = state.complaints.map(c => {
          if (c.id === complaintId) {
            const added = !c.is_upvoted;
            return {
              ...c,
              upvotes_count: c.upvotes_count + (added ? 1 : -1),
              is_upvoted: added
            };
          }
          return c;
        });
        return { complaints: updated };
      });
    }
  },

  // Admin routes a cluster to a new department
  routeClusterDepartment: async (clusterId, newDepartment) => {
    try {
      const res = await axios.patch(`${BASE_URL}/clusters/${clusterId}/`, {
        department: newDepartment
      }, { headers: getHeaders() });

      set(state => ({
        clusters: state.clusters.map(c => c.id === clusterId ? { ...c, department: res.data.department } : c)
      }));
      return res.data;
    } catch (err) {
      console.error("Error routing department:", err);
      // Offline fallback
      set(state => ({
        clusters: state.clusters.map(c => c.id === clusterId ? { ...c, department: newDepartment } : c)
      }));
    }
  },

  // Admin changes status of an entire cluster (resolves or sets in progress)
  updateClusterStatus: async (clusterId, newStatus) => {
    try {
      const res = await axios.patch(`${BASE_URL}/clusters/${clusterId}/`, {
        status: newStatus
      }, { headers: getHeaders() });

      // Update both clusters and child complaints locally
      set(state => {
        const updatedClusters = state.clusters.map(c => c.id === clusterId ? { ...c, status: res.data.status } : c);
        const targetCluster = state.clusters.find(c => c.id === clusterId);
        const childIds = targetCluster?.complaints?.map(c => c.id) || [];
        
        const updatedComplaints = state.complaints.map(comp => {
          if (childIds.includes(comp.id)) {
            return { ...comp, status: newStatus };
          }
          return comp;
        });

        return {
          clusters: updatedClusters,
          complaints: updatedComplaints
        };
      });
    } catch (err) {
      console.error("Error updating status:", err);
      // Offline fallback
      set(state => ({
        clusters: state.clusters.map(c => c.id === clusterId ? { ...c, status: newStatus } : c)
      }));
    }
  }
}));
