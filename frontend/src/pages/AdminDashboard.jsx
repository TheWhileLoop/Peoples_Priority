import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useComplaintStore } from '../store/complaintStore';
import { LayoutDashboard, AlertOctagon, Kanban, Newspaper, LogOut, CheckCircle2, AlertCircle, ThumbsUp, ArrowRight, User, Trash2, Mail, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const { complaints, clusters, updateClusterStatus, routeClusterDepartment } = useComplaintStore();
  
  // Tab/Navigation state
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard' | 'clusters' | 'kanban' | 'weekly'
  const [hoveredWard, setHoveredWard] = useState(null);
  const [selectedWardFilter, setSelectedWardFilter] = useState('All');
  const [expandedClusterId, setExpandedClusterId] = useState(null);
  
  // Simulated Weekly Alert states
  const [showPdfAlert, setShowPdfAlert] = useState(false);
  const [showWhatsAppAlert, setShowWhatsAppAlert] = useState(false);

  // Statistics calculation based on store data
  const totalIssuesCount = complaints.length;
  const activeIssuesCount = complaints.filter(c => c.status !== 'Resolved').length;
  const resolvedIssuesCount = complaints.filter(c => c.status === 'Resolved').length;
  
  // Calculate average sentiment based on severity
  const highSeverityCount = clusters.filter(c => c.severity_score >= 8.0 && c.status !== 'Resolved').length;
  const publicSentiment = highSeverityCount > 1 ? '🔴 Highly Frustrated' : highSeverityCount === 1 ? '🟡 Concerned' : '🟢 Satisfied';

  // SVG Heatmap Coordinates/Data
  const wardsConfig = [
    { id: 'w4', name: 'Ward 4 - Andheri East', pathName: 'Andheri East', x: 20, y: 20, w: 200, h: 100 },
    { id: 'w12', name: 'Ward 12 - Sector 5', pathName: 'Sector 5', x: 240, y: 20, w: 200, h: 100 },
    { id: 'w2', name: 'Ward 2 - Vile Parle', pathName: 'Vile Parle', x: 20, y: 140, w: 200, h: 100 },
    { id: 'w8', name: 'Ward 8 - Sector 3', pathName: 'Sector 3', x: 240, y: 140, w: 200, h: 100 }
  ];

  // Helper to determine ward color based on severity score (10% bg + 30% border for clean pastel style)
  const getWardColorClass = (wardName) => {
    const wardClusters = clusters.filter(c => c.ward === wardName && c.status !== 'Resolved');
    if (wardClusters.length === 0) return 'fill-emerald-50 bg-emerald-50/10 stroke-emerald-500/40 hover:fill-emerald-100/50';
    
    const maxSeverity = Math.max(...wardClusters.map(c => c.severity_score));
    if (maxSeverity >= 8.5) return 'fill-red-50 bg-red-50/10 stroke-red-500/40 hover:fill-red-100/50';
    if (maxSeverity >= 6.5) return 'fill-orange-55 bg-orange-50/10 stroke-orange-500/40 hover:fill-orange-100/50';
    return 'fill-amber-50 bg-amber-50/10 stroke-amber-500/40 hover:fill-amber-100/50';
  };

  const getWardSeverity = (wardName) => {
    const wardClusters = clusters.filter(c => c.ward === wardName && c.status !== 'Resolved');
    if (wardClusters.length === 0) return '0.0 (Clear)';
    const maxSeverity = Math.max(...wardClusters.map(c => c.severity_score));
    return `${maxSeverity.toFixed(1)}/10`;
  };

  const triggerPdfDownload = () => {
    setShowPdfAlert(true);
    setTimeout(() => setShowPdfAlert(false), 3000);
  };

  const triggerWhatsAppDispatch = () => {
    setShowWhatsAppAlert(true);
    setTimeout(() => setShowWhatsAppAlert(false), 3000);
  };

  return (
    <div className="min-h-screen bg-bg-base text-slate-700 flex flex-col md:flex-row relative overflow-hidden">
      
      {/* Ambient background glow orbs - Light mode 3% opacity */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-signal-500/3 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/3 blur-[120px] pointer-events-none" />

      {/* Dynamic Alerts */}
      {showPdfAlert && (
        <div className="fixed top-20 right-6 bg-signal-500 text-white font-bold p-4 rounded-xl shadow-lg border border-signal-400 z-50 animate-fade-in flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Generating Weekly PDF Report via Gemini AI... File downloaded!</span>
        </div>
      )}
      {showWhatsAppAlert && (
        <div className="fixed top-20 right-6 bg-emerald-600 text-white font-bold p-4 rounded-xl shadow-lg border border-emerald-500 z-50 animate-fade-in flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Report dispatched to constituency WhatsApp alert groups!</span>
        </div>
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-bg-sidebar border-b md:border-b-0 md:border-r border-border-1 flex flex-col justify-between shrink-0 z-10 shadow-sm">
        <div className="p-6">
          <div className="flex items-center space-x-2.5 mb-8">
            <div className="h-8 w-8 bg-signal-500 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-signal-500/20">
              P
            </div>
            <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-signal-500 to-cyan-500 bg-clip-text text-transparent">
              MP OFFICE PORTAL
            </span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setAdminTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${adminTab === 'dashboard' ? 'bg-signal-505 bg-signal-500 text-white shadow-md shadow-signal-500/20' : 'text-slate-500 hover:bg-bg-elevated hover:text-slate-800'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Command Center</span>
            </button>
            <button
              onClick={() => setAdminTab('clusters')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${adminTab === 'clusters' ? 'bg-signal-505 bg-signal-500 text-white shadow-md shadow-signal-500/20' : 'text-slate-500 hover:bg-bg-elevated hover:text-slate-800'}`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Priority Clusters</span>
              {clusters.filter(c => c.status !== 'Resolved').length > 0 && (
                <span className="ml-auto bg-red-100 text-red-650 text-xs px-2 py-0.5 rounded-full font-bold border border-red-200">
                  {clusters.filter(c => c.status !== 'Resolved').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setAdminTab('kanban')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${adminTab === 'kanban' ? 'bg-signal-505 bg-signal-500 text-white shadow-md shadow-signal-500/20' : 'text-slate-500 hover:bg-bg-elevated hover:text-slate-800'}`}
            >
              <Kanban className="w-4 h-4" />
              <span>Department Routing</span>
            </button>
            <button
              onClick={() => setAdminTab('weekly')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${adminTab === 'weekly' ? 'bg-signal-505 bg-signal-500 text-white shadow-md shadow-signal-500/20' : 'text-slate-500 hover:bg-bg-elevated hover:text-slate-800'}`}
            >
              <Newspaper className="w-4 h-4" />
              <span>AI Weekly Brief</span>
            </button>
          </nav>
        </div>

        {/* User Card Logout */}
        <div className="p-6 border-t border-border-1 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 bg-bg-elevated rounded-full flex items-center justify-center font-bold text-slate-600 border border-border-1">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block text-slate-800">Abhishek Tayde</span>
              <span className="text-[10px] text-slate-500 font-medium">MP Administrator</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 bg-bg-elevated hover:bg-red-50 hover:text-red-650 hover:border-red-200 rounded-lg text-slate-500 border border-border-1 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto w-full z-10">
        
        {/* TAB 1: COMMAND CENTER (DASHBOARD & HEATMAP) */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border-1 pb-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Constituency Command Center</h1>
                <p className="text-xs text-slate-500 mt-1">Real-time geographical tracking & public sentiment pulse</p>
              </div>
              <div className="bg-bg-card border border-border-1 rounded-xl px-4 py-2 text-right shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">AI Pulse Sentiment</span>
                <span className="text-sm font-bold text-red-600">{publicSentiment}</span>
              </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-bg-card p-6 rounded-2xl border border-border-1 hover:border-border-2 transition-all flex flex-col justify-between shadow-sm hover:shadow">
                <span className="text-xs text-slate-400 font-bold uppercase">Total Ingested Reports</span>
                <span className="text-4xl font-black text-signal-500 mt-3">{totalIssuesCount}</span>
                <span className="text-[10px] text-slate-550 mt-2">Received from Web/SMS portals</span>
              </div>
              <div className="bg-bg-card p-6 rounded-2xl border border-border-1 hover:border-border-2 transition-all flex flex-col justify-between shadow-sm hover:shadow">
                <span className="text-xs text-slate-400 font-bold uppercase">Active AI Clusters</span>
                <span className="text-4xl font-black text-red-600 mt-3">
                  {clusters.filter(c => c.status !== 'Resolved').length}
                </span>
                <span className="text-[10px] text-slate-550 mt-2">Grouped by spatial similarity</span>
              </div>
              <div className="bg-bg-card p-6 rounded-2xl border border-border-1 hover:border-border-2 transition-all flex flex-col justify-between shadow-sm hover:shadow">
                <span className="text-xs text-slate-400 font-bold uppercase">Resolved Issues</span>
                <span className="text-4xl font-black text-emerald-600 mt-3">{resolvedIssuesCount}</span>
                <span className="text-[10px] text-slate-550 mt-2">Verified completed by department</span>
              </div>
            </div>

            {/* Heatmap & Map Legend Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Interactive SVG Heatmap */}
              <div className="bg-bg-card p-6 rounded-2xl border border-border-1 lg:col-span-2 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Constituency Severity Heatmap</h3>
                  <span className="text-[10px] bg-bg-elevated px-2.5 py-1 border border-border-1 rounded text-slate-600 font-semibold">
                    📍 Mumbai Suburbs Division
                  </span>
                </div>
                
                {/* SVG Rendered Map */}
                <div className="relative">
                  <svg viewBox="0 0 460 260" className="w-full h-auto max-h-72 border border-border-1 rounded-xl bg-slate-50/70 p-2 shadow-inner">
                    {wardsConfig.map((wardItem) => {
                      const isActive = hoveredWard === wardItem.name;
                      const colorClass = getWardColorClass(wardItem.name);
                      
                      return (
                        <g 
                          key={wardItem.id}
                          onMouseEnter={() => setHoveredWard(wardItem.name)}
                          onMouseLeave={() => setHoveredWard(null)}
                          onClick={() => {
                            setSelectedWardFilter(wardItem.name);
                            setAdminTab('clusters');
                          }}
                          className="cursor-pointer transition-all duration-300 group"
                        >
                          <rect
                            x={wardItem.x}
                            y={wardItem.y}
                            width={wardItem.w}
                            height={wardItem.h}
                            rx={12}
                            className={`stroke-2 transition-all duration-300 ${colorClass}`}
                          />
                          <text
                            x={wardItem.x + wardItem.w / 2}
                            y={wardItem.y + wardItem.h / 2}
                            textAnchor="middle"
                            className="fill-slate-700 font-extrabold text-[11px] select-none group-hover:fill-slate-900"
                          >
                            {wardItem.pathName}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Ward Map Tooltip Overlay */}
                  {hoveredWard && (
                    <div className="absolute top-4 left-4 bg-white border border-border-2 p-4 rounded-xl shadow-xl w-60 z-10 animate-fade-in text-slate-700">
                      <h4 className="text-xs font-bold text-slate-900">{hoveredWard}</h4>
                      <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                        <div className="flex justify-between">
                          <span>Max Severity:</span>
                          <span className="font-bold text-red-650 text-red-600">{getWardSeverity(hoveredWard)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Clusters:</span>
                          <span className="font-bold text-slate-800">
                            {clusters.filter(c => c.ward === hoveredWard && c.status !== 'Resolved').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Complaints:</span>
                          <span className="font-bold text-slate-800">
                            {complaints.filter(c => c.ward === hoveredWard).length}
                          </span>
                        </div>
                      </div>
                      <span className="block text-[9px] text-signal-500 font-bold mt-2 uppercase tracking-wide">Click to view complaints list ➡️</span>
                    </div>
                  )}
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center space-x-6 text-[10px] text-slate-400 font-bold uppercase pt-2 justify-center border-t border-border-1">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 bg-red-50 border border-red-400 rounded" />
                    <span className="text-slate-500">Extreme Risk (&gt;=8.5)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 bg-orange-50 border border-orange-400 rounded" />
                    <span className="text-slate-500">Medium Risk (6.5-8.4)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 bg-emerald-50 border border-emerald-400 rounded" />
                    <span className="text-slate-500">Low/No Issues</span>
                  </div>
                </div>
              </div>

              {/* Side Panel: Urgent Issues */}
              <div className="bg-bg-card p-6 rounded-2xl border border-border-1 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Immediate Action Alerts</h3>
                
                <div className="space-y-3">
                  {clusters.filter(c => c.status !== 'Resolved').slice(0, 2).map((alert) => (
                    <div key={alert.id} className="bg-bg-base p-4 rounded-xl border border-red-200 relative text-slate-700 shadow-sm">
                      <span className="absolute top-2.5 right-2.5 text-red-600 font-black text-xs">
                        ⚠️ {alert.severity_score}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 pr-8">{alert.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 italic">"{alert.ai_summary.slice(0, 95)}..."</p>
                      
                      <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500 border-t border-border-1 pt-2">
                        <span>👥 {alert.mentions} affected</span>
                        <button
                          onClick={() => {
                            setExpandedClusterId(alert.id);
                            setAdminTab('clusters');
                          }}
                          className="text-signal-500 font-bold hover:underline"
                        >
                          Details &gt;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: AI PRIORITY CLUSTERS */}
        {adminTab === 'clusters' && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-border-1 pb-5 gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">AI Cluster Priorities</h1>
                <p className="text-xs text-slate-500 mt-1">Clustered by spatial geometry and issue context severity</p>
              </div>

              {/* Ward filter selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500">Ward:</span>
                <select
                  value={selectedWardFilter}
                  onChange={(e) => setSelectedWardFilter(e.target.value)}
                  className="bg-bg-card border border-border-1 text-xs px-3 py-1.5 rounded-lg text-slate-700 focus:outline-none shadow-sm"
                >
                  <option value="All">All Wards</option>
                  <option value="Ward 4 - Andheri East">Ward 4 - Andheri East</option>
                  <option value="Ward 12 - Sector 5">Ward 12 - Sector 5</option>
                  <option value="Ward 8 - Sector 3">Ward 8 - Sector 3</option>
                  <option value="Ward 2 - Vile Parle">Ward 2 - Vile Parle</option>
                </select>
              </div>
            </div>

            {/* Filtered Clusters List */}
            <div className="space-y-4">
              {clusters
                .filter((c) => selectedWardFilter === 'All' || c.ward === selectedWardFilter)
                .map((cluster, index) => {
                  const isExpanded = expandedClusterId === cluster.id;
                  const clusterComplaints = complaints.filter((comp) => cluster.complaint_ids.includes(comp.id));
                  
                  return (
                    <div key={cluster.id} className="bg-bg-card rounded-2xl border border-border-1 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      
                      {/* Cluster Summary Row */}
                      <div
                        onClick={() => setExpandedClusterId(isExpanded ? null : cluster.id)}
                        className={`p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer hover:bg-bg-elevated transition-colors ${isExpanded ? 'bg-bg-elevated/40' : ''}`}
                      >
                        <div className="flex items-start space-x-4">
                          <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${cluster.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-650 border border-red-200'}`}>
                            #{index + 1}
                          </span>
                          <div>
                            <div className="flex items-center space-x-2.5">
                              <h3 className="text-md font-bold text-slate-800">{cluster.title}</h3>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${cluster.status === 'Resolved' ? 'bg-emerald-50 text-emerald-605 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200 animate-pulse'}`}>
                                {cluster.status}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 block mt-1">Ward: {cluster.ward} | Dept: {cluster.department}</span>
                          </div>
                        </div>

                        {/* Severity Score Indicator */}
                        <div className="flex items-center space-x-6 sm:self-center">
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Citizen Mentions</span>
                            <span className="text-sm font-bold text-slate-700">👥 {cluster.mentions} Reports</span>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase text-right">Severity Score</span>
                            <span className={`text-xl font-black ${cluster.severity_score >= 8.5 ? 'text-red-650 text-red-600' : 'text-orange-600'}`}>
                              {cluster.severity_score}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cluster Nested Details (Expanded View) */}
                      {isExpanded && (
                        <div className="bg-slate-50/70 p-6 border-t border-border-1 space-y-6 animate-fade-in shadow-inner">
                          
                          {/* AI Summary Block */}
                          <div className="bg-signal-50 border border-signal-200 p-4 rounded-xl text-slate-700">
                            <div className="flex items-center space-x-2 text-signal-500 font-bold text-xs uppercase tracking-wide mb-1.5">
                              <AlertCircle className="w-4 h-4" />
                              <span>Gemini 2.5 AI Diagnostic Synthesis</span>
                            </div>
                            <p className="text-xs text-slate-650 leading-relaxed italic">
                              "{cluster.ai_summary}"
                            </p>
                          </div>

                          {/* Control actions for Admin */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-border-1 pb-5">
                            <div>
                              <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">Set Live Status</label>
                              <div className="flex space-x-2">
                                {['Pending', 'In Progress', 'Resolved'].map((stat) => (
                                  <button
                                    key={stat}
                                    onClick={() => updateClusterStatus(cluster.id, stat)}
                                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${cluster.status === stat ? 'bg-signal-500 text-white shadow-sm' : 'bg-white text-slate-600 hover:text-slate-800 border border-slate-200'}`}
                                  >
                                    {stat}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">Assign Department Router</label>
                              <select
                                value={cluster.department}
                                onChange={(e) => routeClusterDepartment(cluster.id, e.target.value)}
                                className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-700 focus:outline-none shadow-sm"
                              >
                                <option value="PWD">PWD (Public Works Department)</option>
                                <option value="Jal Board">Jal Board (Water & Sewage)</option>
                                <option value="Waste Management">Waste & Sanitation Department</option>
                                <option value="Electricity Board">Electricity & Lighting Board</option>
                              </select>
                            </div>
                          </div>

                          {/* Raw Citizen Submissions lists */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Raw Submissions ({clusterComplaints.length})</h4>
                            
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                              {clusterComplaints.map((comp) => (
                                <div key={comp.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center gap-4 text-xs text-slate-700 shadow-sm">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-slate-600 font-bold">{comp.user}</span>
                                      <span className="text-[10px] text-slate-400">
                                        {new Date(comp.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-slate-500">{comp.text}</p>
                                  </div>
                                  
                                  {comp.media_url && (
                                    <a href={comp.media_url} target="_blank" rel="noreferrer" className="shrink-0 group relative block">
                                      <img src={comp.media_url} alt="proof" className="h-10 w-10 object-cover rounded border border-slate-200 group-hover:brightness-90 transition-all" />
                                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                        <ExternalLink className="w-3 h-3 text-white" />
                                      </div>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
            </div>

          </div>
        )}

        {/* TAB 3: DEPARTMENT KANBAN ROUTING */}
        {adminTab === 'kanban' && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="border-b border-border-1 pb-5">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Department Kanban Boards</h1>
              <p className="text-xs text-slate-500 mt-1">Route and allocate priority issues across governance departments</p>
            </div>

            {/* Board Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* PWD Column */}
              <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-black text-slate-700 tracking-wider">CIVIL (PWD)</span>
                  <span className="bg-white border border-cyan-150 px-2 py-0.5 text-xs rounded text-cyan-600 font-bold shadow-sm">
                    {clusters.filter(c => c.department === 'PWD' && c.status !== 'Resolved').length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[300px]">
                  {clusters
                    .filter((c) => c.department === 'PWD' && c.status !== 'Resolved')
                    .map((item) => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 shadow-sm hover:shadow transition-all space-y-3">
                        <span className="text-[9px] font-black bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200">
                          Severity {item.severity_score}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                        <p className="text-[10px] text-slate-450 leading-normal">{item.ward}</p>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold">👥 {item.mentions} Reports</span>
                          <button
                            onClick={() => routeClusterDepartment(item.id, 'Jal Board')}
                            className="text-[10px] text-signal-500 font-bold hover:underline flex items-center animate-pulse"
                          >
                            <span>Route Water</span>
                            <ArrowRight className="w-3 h-3 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Jal Board Column */}
              <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-black text-slate-700 tracking-wider">WATER (JAL BOARD)</span>
                  <span className="bg-white border border-cyan-150 px-2 py-0.5 text-xs rounded text-cyan-600 font-bold shadow-sm">
                    {clusters.filter(c => c.department === 'Jal Board' && c.status !== 'Resolved').length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[300px]">
                  {clusters
                    .filter((c) => c.department === 'Jal Board' && c.status !== 'Resolved')
                    .map((item) => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 shadow-sm hover:shadow transition-all space-y-3">
                        <span className="text-[9px] font-black bg-red-50 text-red-650 px-2 py-0.5 rounded border border-red-200">
                          Severity {item.severity_score}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                        <p className="text-[10px] text-slate-455 leading-normal">{item.ward}</p>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold">👥 {item.mentions} Reports</span>
                          <button
                            onClick={() => routeClusterDepartment(item.id, 'Waste Management')}
                            className="text-[10px] text-signal-500 font-bold hover:underline flex items-center animate-pulse"
                          >
                            <span>Route Trash</span>
                            <ArrowRight className="w-3 h-3 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Waste Management Column */}
              <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-black text-slate-700 tracking-wider">SOLID WASTE (MC)</span>
                  <span className="bg-white border border-cyan-150 px-2 py-0.5 text-xs rounded text-cyan-600 font-bold shadow-sm">
                    {clusters.filter(c => c.department === 'Waste Management' && c.status !== 'Resolved').length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[300px]">
                  {clusters
                    .filter((c) => c.department === 'Waste Management' && c.status !== 'Resolved')
                    .map((item) => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 shadow-sm hover:shadow transition-all space-y-3">
                        <span className="text-[9px] font-black bg-red-50 text-red-650 px-2 py-0.5 rounded border border-red-200">
                          Severity {item.severity_score}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                        <p className="text-[10px] text-slate-455 leading-normal">{item.ward}</p>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold">👥 {item.mentions} Reports</span>
                          <button
                            onClick={() => routeClusterDepartment(item.id, 'Electricity Board')}
                            className="text-[10px] text-signal-500 font-bold hover:underline flex items-center animate-pulse"
                          >
                            <span>Route Power</span>
                            <ArrowRight className="w-3 h-3 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Electricity Board Column */}
              <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-black text-slate-700 tracking-wider">POWER (ELECTRICITY)</span>
                  <span className="bg-white border border-cyan-150 px-2 py-0.5 text-xs rounded text-cyan-600 font-bold shadow-sm">
                    {clusters.filter(c => c.department === 'Electricity Board' && c.status !== 'Resolved').length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[300px]">
                  {clusters
                    .filter((c) => c.department === 'Electricity Board' && c.status !== 'Resolved')
                    .map((item) => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 shadow-sm hover:shadow transition-all space-y-3">
                        <span className="text-[9px] font-black bg-red-50 text-red-650 px-2 py-0.5 rounded border border-red-200">
                          Severity {item.severity_score}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                        <p className="text-[10px] text-slate-455 leading-normal">{item.ward}</p>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold">👥 {item.mentions} Reports</span>
                          <button
                            onClick={() => routeClusterDepartment(item.id, 'PWD')}
                            className="text-[10px] text-signal-500 font-bold hover:underline flex items-center animate-pulse"
                          >
                            <span>Route PWD</span>
                            <ArrowRight className="w-3 h-3 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: AI WEEKLY BRIEF */}
        {adminTab === 'weekly' && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="border-b border-border-1 pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-black">AI Weekly brief newsletter</h1>
                <p className="text-xs text-slate-500 mt-1">Constituency Performance briefing synthesized by Google Gemini AI</p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={triggerPdfDownload}
                  className="bg-signal-500 hover:bg-signal-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all border border-signal-400/20"
                >
                  Download Full PDF
                </button>
                <button
                  type="button"
                  onClick={triggerWhatsAppDispatch}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg transition-all"
                >
                  Send to WhatsApp
                </button>
              </div>
            </div>

            {/* Newsletter layout */}
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 text-slate-655 text-slate-600 text-sm leading-relaxed shadow-md">
              
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-500">Google Gemini Synthesis</span>
                  <h3 className="text-lg font-black text-slate-800">WEEKLY CONSTITUENCY PERFORMANCE MEMO</h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-bg-elevated border border-border-1 px-2.5 py-1 rounded">
                  July 5, 2026
                </span>
              </div>

              {/* Section 1: executive overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Executive Summary</h4>
                <p>
                  Honorable Member of Parliament, this week your constituency experienced a **12% decrease** in solid waste complaints, largely due to successful sanitation sweeps in Ward 2. However, we have recorded an **unusual 28% spike in streetlight failures** concentrated within Sector 3 (Ward 8). Dark spots along the sub-lanes are creating safety risks. Recommend prioritizing lighting audits.
                </p>
              </div>

              {/* Section 2: key trends */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Active AI Clusters & Health Check</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-250 border-slate-200">
                    <span className="text-[10px] text-red-650 font-bold uppercase">Critical Bottleneck</span>
                    <h5 className="text-xs font-bold text-slate-800 mt-1">Andheri East Junction Roads</h5>
                    <p className="text-[11px] text-slate-500 mt-1">450 citizens are affected by pothole hazards. Severity rating is 🔥 9.8.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-250 border-slate-200">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Successful Resolution</span>
                    <h5 className="text-xs font-bold text-slate-800 mt-1">Sector 3 Bulbs Swapped</h5>
                    <p className="text-[11px] text-slate-550 mt-1">Electricity board completed bulb swaps resolving issues for 120 citizens.</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Sentiment profile */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Citizen Sentiment Profile</h4>
                <p>
                  Overall public sentiment is currently indexed as **Concerned (74% Negative/Neutral sentiment)**, driven heavily by road safety concerns in Andheri East and pipeline repair delays in Sector 5. Solid waste cleanups were received positively, registering 15% positive feedback in Ward 2.
                </p>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-6 border-t border-slate-200 mt-4">
                This document is generated automatically by compiling local geolocated citizen reports. Confidential MP briefing.
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
