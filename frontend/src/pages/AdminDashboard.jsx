import React from 'react';
import { useAuthStore } from '../store/authStore';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-gray-400 mt-1">Welcome back, Admin</p>
        </div>
        <button 
          onClick={logout}
          className="text-sm bg-red-600/20 text-red-400 px-4 py-2 rounded-lg font-medium hover:bg-red-600/30 transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Widgets */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg col-span-1 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 text-gray-200">AI Priority Report (Clustered)</h2>
          <div className="space-y-4">
            
            <div className="bg-gray-750 border border-red-500/30 p-4 rounded-lg bg-gray-900/50">
              <div className="flex justify-between items-start">
                <div>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Rank #1</span>
                  <h3 className="text-lg font-semibold mt-2 text-red-400">Road Condition in Andheri East</h3>
                  <p className="text-sm text-gray-400 mt-1">AI Summary: Severe potholes causing accidents at night. Multiple visual verifications.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-red-500">9.8/10</div>
                  <div className="text-xs text-gray-500">Severity Score</div>
                </div>
              </div>
              <div className="mt-4 flex space-x-4 text-sm text-gray-400 border-t border-gray-700 pt-3">
                <span>👥 450 Mentions</span>
                <span>😠 Sentiment: Highly Negative</span>
                <span className="text-yellow-500">⏳ Pending PWD</span>
              </div>
            </div>

            <div className="bg-gray-750 border border-orange-500/30 p-4 rounded-lg bg-gray-900/50">
              <div className="flex justify-between items-start">
                <div>
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">Rank #2</span>
                  <h3 className="text-lg font-semibold mt-2 text-orange-400">Water Pipeline Leakage</h3>
                  <p className="text-sm text-gray-400 mt-1">AI Summary: Continuous leakage reported in Sector 4 over the last 3 days.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-orange-500">8.5/10</div>
                  <div className="text-xs text-gray-500">Severity Score</div>
                </div>
              </div>
              <div className="mt-4 flex space-x-4 text-sm text-gray-400 border-t border-gray-700 pt-3">
                <span>👥 210 Mentions</span>
                <span>😠 Sentiment: Negative</span>
                <span className="text-yellow-500">⏳ Pending Water Board</span>
              </div>
            </div>

          </div>
        </div>

        {/* Side Panel Widgets */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-gray-200">System Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="text-3xl font-black text-blue-400">1,245</div>
                <div className="text-xs text-gray-400 mt-1">Active Issues</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="text-3xl font-black text-green-400">890</div>
                <div className="text-xs text-gray-400 mt-1">Resolved</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-lg font-bold mb-2 text-gray-200">Gemini AI Weekly Insight</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              "Honorable MP, this week your constituency saw a 20% drop in water complaints, but a sudden spike in street-light issues in Sector 5. Recommend immediate action on lighting to improve nighttime safety."
            </p>
            <button className="mt-4 w-full bg-blue-600/20 text-blue-400 border border-blue-500/30 py-2 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors">
              Generate Full PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
