import React from 'react';
import { Mic, Camera, FileText } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function CitizenDashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
          <p className="text-sm text-gray-500">Welcome, {user?.email || 'Citizen'}</p>
        </div>
        <button 
          onClick={logout}
          className="text-sm text-red-600 font-medium hover:text-red-800"
        >
          Logout
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Location</h2>
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span className="text-blue-800 font-medium">Fetching Ward/Village name automatically...</span>
          </div>
          <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Update GPS</button>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Choose how you want to report</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:border-blue-400 transition-colors">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mic className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Speak</h3>
          <p className="mt-2 text-sm text-gray-500">Record an audio message in your local language.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:border-green-400 transition-colors">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Camera className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Snap</h3>
          <p className="mt-2 text-sm text-gray-500">Upload a photo. AI will automatically verify it.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:border-purple-400 transition-colors">
          <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Type</h3>
          <p className="mt-2 text-sm text-gray-500">Write a quick description of the issue.</p>
        </div>
      </div>
    </div>
  );
}
