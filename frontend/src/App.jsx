import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FacebookStyleFeed from './pages/FacebookStyleFeed';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && role !== allowedRole) {
    // If citizen tries to go to admin, redirect to citizen dashboard, and vice versa
    return <Navigate to={role === 'admin' ? "/admin/dashboard" : "/citizen/dashboard"} replace />;
  }
  
  return children;
}

function App() {
  const { isAuthenticated, role, logout } = useAuthStore();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/50 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link to="/" className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              People's Priorities
            </Link>
            <nav className="flex space-x-2 items-center">
              <Link to="/feeds" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200">
                Feeds
              </Link>
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg shadow-blue-500/30 px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200 transform hover:-translate-y-0.5">
                    Citizen Login
                  </Link>
                  <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700">
                    Report Issue
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to={role === 'admin' ? "/admin/dashboard" : "/citizen/dashboard"} 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={logout}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-100"
                  >
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/feeds" element={<FacebookStyleFeed />} />
            <Route 
              path="/citizen/dashboard" 
              element={
                <ProtectedRoute allowedRole="citizen">
                  <CitizenDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
