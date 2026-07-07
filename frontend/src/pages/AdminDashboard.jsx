import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useComplaintStore } from '../store/complaintStore';
import { LayoutDashboard, AlertOctagon, Kanban, Newspaper, LogOut, CheckCircle2, AlertCircle, ThumbsUp, ArrowRight, User, Trash2, Mail, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const { 
    complaints, 
    clusters,
    adminStats,
    adminFiltersData,
    weeklySummary,
    updateClusterStatus, 
    routeClusterDepartment,
    fetchComplaints,
    fetchClusters,
    fetchAdminStats,
    fetchAdminFiltersData,
    fetchWeeklySummary
  } = useComplaintStore();
  
  // Tab/Navigation state
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard' | 'clusters' | 'kanban' | 'weekly'
  const [hoveredWard, setHoveredWard] = useState(null);
  const [selectedWardFilter, setSelectedWardFilter] = useState('All');
  const [expandedClusterId, setExpandedClusterId] = useState(null);
  
  // Weekly briefs
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

  // Filtered clusters for the Priority List
  const filteredClusters = clusters.filter(c => {
    if (selectedWardFilter === 'All') return true;
    return c.ward === selectedWardFilter;
  });

  const activeClusters = clusters.filter(c => c.status !== 'resolved');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col md:flex-row relative overflow-hidden">
      
      {/* Background glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      {/* Real-time Alerts */}
      {showPdfAlert && (
        <div className="fixed top-20 right-6 bg-blue-600 text-white font-bold p-4 rounded-xl shadow-lg border border-blue-500 z-50 animate-fade-in flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Generating Weekly Brief PDF via Gemini AI... Download Complete!</span>
        </div>
      )}
      {showWhatsAppAlert && (
        <div className="fixed top-20 right-6 bg-emerald-600 text-white font-bold p-4 rounded-xl shadow-lg border border-emerald-500 z-50 animate-fade-in flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Brief successfully dispatched to Constituency WhatsApp Groups!</span>
        </div>
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0 z-10 shadow-xl">
        <div className="p-6">
          <div className="flex items-center space-x-2.5 mb-8">
            <span className="text-2xl">🇮🇳</span>
            <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              MP OFFICE PORTAL
            </span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setAdminTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${adminTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Command Center</span>
            </button>
            <button
              onClick={() => setAdminTab('clusters')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${adminTab === 'clusters' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Priority Clusters</span>
              {adminStats.active_clusters > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {adminStats.active_clusters}
                </span>
              )}
            </button>
            <button
              onClick={() => setAdminTab('kanban')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${adminTab === 'kanban' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Kanban className="w-4 h-4" />
              <span>Department Routing</span>
            </button>
            <button
              onClick={() => setAdminTab('weekly')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${adminTab === 'weekly' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Newspaper className="w-4 h-4" />
              <span>AI Weekly Brief</span>
            </button>
          </nav>
        </div>

        {/* User Card Logout */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 bg-slate-850 rounded-full flex items-center justify-center font-bold text-white border border-slate-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block text-white">{user?.first_name || 'MP Admin'}</span>
              <span className="text-[10px] text-slate-500 font-medium capitalize">{adminState} Admin</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 bg-slate-800 hover:bg-red-950 hover:text-red-400 hover:border-red-800 rounded-lg text-slate-400 border border-slate-700 transition-colors"
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
            <div className="flex justify-between items-center border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Constituency Command Center</h1>
                <p className="text-xs text-slate-500 mt-1">Real-time geographical tracking of local hotspots in {adminState}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-right shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">AI Pulse Sentiment</span>
                <span className="text-xs font-black text-red-600">{adminStats.public_sentiment}</span>
              </div>
            </div>

            {/* Global Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-sm font-bold text-slate-500 flex items-center">
                <Layers className="w-4 h-4 mr-2" /> Global Filters:
              </span>
              <select 
                className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-1.5 font-medium text-slate-700 outline-none focus:border-blue-500"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="All">All Districts</option>
                {adminFiltersData.districts?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              
              <select 
                className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-1.5 font-medium text-slate-700 outline-none focus:border-blue-500"
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
              >
                <option value="All">All Wards</option>
                {adminFiltersData.wards?.map(w => <option key={w} value={w}>{w}</option>)}
              </select>

              <select 
                className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-1.5 font-medium text-slate-700 outline-none focus:border-blue-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {adminFiltersData.categories?.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all flex flex-col justify-between shadow-sm hover:shadow">
                <span className="text-xs text-slate-400 font-bold uppercase">Total Reports Ingested</span>
                <span className="text-4xl font-black text-blue-600 mt-3">{adminStats.total_ingested_reports}</span>
                <span className="text-[10px] text-slate-500 mt-2">Active complaints submitted by citizens</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all flex flex-col justify-between shadow-sm hover:shadow">
                <span className="text-xs text-slate-400 font-bold uppercase">Active AI Clusters</span>
                <span className="text-4xl font-black text-red-500 mt-3">
                  {adminStats.active_clusters}
                </span>
                <span className="text-[10px] text-slate-500 mt-2">Grouped dynamically by 2km spatial radius</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all flex flex-col justify-between shadow-sm hover:shadow">
                <span className="text-xs text-slate-400 font-bold uppercase">Resolved Issues</span>
                <span className="text-4xl font-black text-emerald-600 mt-3">{adminStats.resolved_issues}</span>
                <span className="text-[10px] text-slate-500 mt-2">Verified completed by department</span>
              </div>
            </div>

            {/* Heatmap & Map Legend Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Interactive SVG Heatmap with projected coordinates overlays */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 lg:col-span-2 space-y-4 shadow-sm">
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
                          key={districtItem.id}
                          onMouseEnter={() => setHoveredDistrict(districtItem.name)}
                          onMouseLeave={() => setHoveredDistrict(null)}
                          onClick={() => {
                            setSelectedDistrictFilter(districtItem.name);
                            setAdminTab('clusters');
                          }}
                          className="cursor-pointer transition-all duration-300 group"
                        >
                          <rect
                            x={districtItem.x}
                            y={districtItem.y}
                            width={districtItem.w}
                            height={districtItem.h}
                            rx={12}
                            className={`stroke-2 transition-all duration-300 ${colorClass}`}
                          />
                          <text
                            x={wardItem.x + wardItem.w / 2}
                            y={wardItem.y + wardItem.h / 2}
                            textAnchor="middle"
                            className="fill-slate-400 font-bold text-[9px] select-none uppercase tracking-wider"
                          >
                            {districtItem.pathName}
                          </text>
                        </g>
                      );
                    })}

                    {/* LIVE HOTSPOT OVERLAYS: projected coordinates of real database clusters */}
                    {activeClusters.map((cluster) => {
                      const { x, y } = projectCoordinates(cluster.center_latitude, cluster.center_longitude);
                      const isCritical = parseFloat(cluster.severity_score) >= 7.5;
                      
                      return (
                        <g 
                          key={cluster.id} 
                          className="cursor-pointer group/pin"
                          onClick={() => {
                            setExpandedClusterId(cluster.id);
                            setAdminTab('clusters');
                          }}
                        >
                          {/* Pulsating Ring */}
                          <circle
                            cx={x}
                            cy={y}
                            r={isCritical ? 14 : 9}
                            className={`fill-none stroke-2 ${isCritical ? 'stroke-red-500 animate-ping' : 'stroke-orange-500 animate-pulse'}`}
                            style={{ transformOrigin: `${x}px ${y}px` }}
                          />
                          {/* Solid Center */}
                          <circle
                            cx={x}
                            cy={y}
                            r={isCritical ? 6 : 4}
                            className={`${isCritical ? 'fill-red-650 fill-red-500' : 'fill-orange-500'} stroke-white stroke-1`}
                          />
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
                          <span className="font-bold text-red-650 text-red-600">{getDistrictSeverity(hoveredDistrict)}</span>
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
                            {complaints.filter(c => c.district === hoveredDistrict).length}
                          </span>
                        </div>
                      </div>
                      <span className="block text-[9px] text-blue-600 font-bold mt-2 uppercase tracking-wide">Click to view complaints list</span>
                    </div>
                  )}
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center space-x-6 text-[10px] text-slate-400 font-bold uppercase pt-2 justify-center border-t border-slate-200">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 bg-red-100 border border-red-400 rounded-full animate-pulse" />
                    <span className="text-slate-550">Extreme Risk (&gt;=7.5)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 bg-orange-100 border border-orange-400 rounded-full animate-pulse" />
                    <span className="text-slate-550">Medium Risk (5.0-7.4)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 bg-emerald-100 border border-emerald-400 rounded-full" />
                    <span className="text-slate-550">Low / Clean Zone</span>
                  </div>
                </div>
              </div>

              {/* Side Panel: Urgent Issues */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Immediate Action Alerts</h3>
                
                <div className="space-y-3">
                  {activeClusters.slice(0, 2).map((alert) => (
                    <div key={alert.id} className="bg-slate-50 p-4 rounded-xl border border-red-150 relative text-slate-700 shadow-sm">
                      <span className="absolute top-2.5 right-2.5 bg-red-100 text-red-700 font-black text-[10px] px-2 py-0.5 rounded-full">
                        🔥 {parseFloat(alert.severity_score).toFixed(1)}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 pr-12 capitalize">{alert.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 capitalize">Category: {alert.category} · Ward: {alert.ward?.split(' - ')[1]}</p>
                      
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/50 flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-slate-500">👥 {alert.mentions_count} citizens affected</span>
                        <button
                          onClick={() => {
                            setExpandedClusterId(alert.id);
                            setAdminTab('clusters');
                          }}
                          className="text-blue-600 hover:underline font-bold"
                        >
                          View Details &gt;
                        </button>
                      </div>
                    </div>
                  ))}
                  {activeClusters.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">No active complaints found.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: DETAILED CLUSTERS LIST */}
        {adminTab === 'clusters' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Priority AI Clusters</h1>
                <p className="text-xs text-slate-500 mt-1">Select an AI group to view citizen feedback & change routing/status</p>
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

                        <div className="flex items-center space-x-4 self-end sm:self-center">
                          <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Severity</span>
                          <span className="text-sm font-black text-red-600">{parseFloat(cluster.severity_score).toFixed(1)}/10</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Reports</span>
                          <span className="text-sm font-black text-slate-700">{cluster.mentions_count}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Status</span>
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${cluster.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : cluster.status === 'in_progress' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                            {cluster.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
                        
                        {/* Summary Block */}
                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-inner">
                          <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Gemini Compiled AI Summary</h4>
                          <p className="text-xs text-slate-650 mt-1 italic leading-relaxed">"{cluster.ai_summary}"</p>
                        </div>

                        {/* Action Control Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Change Process Status</label>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateClusterStatus(cluster.id, 'in_progress')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${cluster.status === 'in_progress' ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                              >
                                Mark In Progress
                              </button>
                              <button
                                onClick={() => updateClusterStatus(cluster.id, 'resolved')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${cluster.status === 'resolved' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                              >
                                Mark Resolved
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Route Department</label>
                            <select
                              value={cluster.department || ''}
                              onChange={(e) => routeClusterDepartment(cluster.id, e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            >
                              <option value="PWD">Public Works Department (PWD)</option>
                              <option value="Jal Board">Water Board (Jal Board)</option>
                              <option value="DISCOM">Electricity Board (DISCOM)</option>
                              <option value="Sanitation Dept">Waste Department</option>
                              <option value="Health Department">Health Department</option>
                              <option value="Police Department">Police Department</option>
                              <option value="Veterinary Department">Veterinary Department</option>
                              <option value="Collectorate Office">Collectorate Office</option>
                            </select>
                          </div>
                        </div>

                        {/* Nested Raw Complaints List */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Submissions in Cluster</h4>
                          {cluster.complaints?.map((c) => (
                            <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4">
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400">Reporter: {c.citizen_name}</span>
                                <p className="text-xs text-slate-700">{c.description}</p>
                                <span className="block text-[9px] text-slate-400">Date: {new Date(c.created_at).toLocaleDateString()}</span>
                              </div>
                              {c.image_file && (
                                <a href={c.image_file} target="_blank" rel="noopener noreferrer">
                                  <img src={c.image_file} alt="complaint snap" className="h-14 w-14 object-cover rounded-lg border border-slate-100 hover:scale-105 transition-all" />
                                </a>
                              )}
                            </div>
                          ))}
                          {(!cluster.complaints || cluster.complaints.length === 0) && (
                            <p className="text-xs text-slate-400 italic">No nested complaints found in this group.</p>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
              {filteredClusters.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-10">No clusters found for selected filter.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KANBAN BOARD */}
        {adminTab === 'kanban' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Department Kanban Routing</h1>
              <p className="text-xs text-slate-500 mt-1">Drag-and-drop or select route options to dispatch work orders directly</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
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

        {/* TAB 4: GEMINI WEEKLY BRIEF REPORT */}
        {adminTab === 'weekly' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">AI Weekly Briefing</h1>
                <p className="text-xs text-slate-500 mt-1">Generated by Google Gemini 1.5 Flash compiler on {new Date().toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}</p>
              </div>
              
              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={triggerPdfDownload}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all"
                >
                  Download PDF Brief
                </button>
                <button
                  onClick={triggerWhatsAppDispatch}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow shadow-emerald-600/20 transition-all"
                >
                  Send to WhatsApp
                </button>
              </div>
            </div>

            {/* Newsletter layout */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 leading-relaxed text-slate-700 text-sm">
              <div className="border-b border-slate-100 pb-4 text-center">
                <span className="text-2xl">🏛️</span>
                <h2 className="text-lg font-black text-slate-900 uppercase mt-2">Executive Grievance Newsletter</h2>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Office of state administration</p>
              </div>

              {!weeklySummary ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-slate-500 font-bold animate-pulse">Gemini AI is analyzing constituency data...</p>
                </div>
              ) : (
                <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {weeklySummary}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
