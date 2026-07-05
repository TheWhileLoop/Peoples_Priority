import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
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
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="font-bold text-xl text-blue-600">
              People's Priorities
            </Link>
            <nav className="flex space-x-4 items-center">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium">
                    Login
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
