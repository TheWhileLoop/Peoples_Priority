import React, { useState, useEffect } from 'react';
import { 
  Mic, Camera, FileText, MapPin, RefreshCw, Send, CheckCircle, 
  Clock, AlertCircle, ChevronRight, Heart, Home, Trash2, 
  Volume2, Play, Pause, Layers
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useComplaintStore } from '../store/complaintStore';

// Pre-defined sample photos representing civic issues for quick testing/demo
const samplePhotos = [
  {
    id: 's1',
    name: 'Pothole',
    category: 'Roads',
    text: 'A dangerous pothole is causing minor accidents near the main crossing.',
    url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 's2',
    name: 'Broken Water Pipe',
    category: 'Water Supply',
    text: 'Huge water leak near the main pipeline. Road is flooded.',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 's3',
    name: 'Garbage Pile',
    category: 'Waste Management',
    text: 'Overflowing municipal garbage bin near the apartments. Strong odor.',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80'
  }
];

export default function CitizenDashboard() {
  const { user } = useAuthStore();
  const { 
    complaints, 
    clusters, 
    addComplaint, 
    upvoteComplaint, 
    fetchComplaints, 
    fetchClusters,
    loading 
  } = useComplaintStore();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'my-issues' | 'community'
  const [reportMethod, setReportMethod] = useState('text'); // 'text' | 'voice' | 'photo'
  
  // Form State
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('roads');
  const [ward, setWard] = useState('Ward 4 - Andheri East');
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
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

  // Fetch complaints and clusters on mount
  useEffect(() => {
    fetchComplaints();
    fetchClusters();
  }, []);

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

  // Fetch GPS Coordinates
  const handleGPSLocation = () => {
    setIsLocating(true);
    // Simulate reading GPS location
    setTimeout(() => {
      setIsLocating(false);
      setWard('Ward 4 - Andheri East');
    }, 1000);
  };

  // Simulate Voice Record & create dummy file for Cloudinary upload
  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsTranslating(true);
      
      // Build a dummy audio file so backend can upload it to Cloudinary
      const dummyAudioBlob = new Blob([new Uint8Array(1000)], { type: 'audio/mp3' });
      const file = new File([dummyAudioBlob], 'voice_complaint.mp3', { type: 'audio/mp3' });
      setAudioFile(file);

      setTimeout(() => {
        setIsTranslating(false);
        setDescription('Hamare area me road bilkul kharab ho chuki hai, bade gadde hain. (Voice Input translated: The road in our area is completely damaged, there are large potholes.)');
        setCategory('roads');
      }, 1500);
    } else {
      setDescription('');
      setAudioFile(null);
      setIsRecording(true);
    }
  };

  // Helper to download sample photo and convert it to File object
  const handleSelectPhoto = async (sample) => {
    setPhotoUrl(sample.url);
    setIsScanning(true);
    
    try {
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const file = new File([blob], `${sample.name.toLowerCase().replace(/ /g, '_')}.jpg`, { type: 'image/jpeg' });
      setImageFile(file);
    } catch (err) {
      console.warn("Could not download sample photo as File object. Sending only URL.");
    }
    
    setTimeout(() => {
      setIsScanning(false);
      setDescription(sample.text);
      setCategory(sample.category.toLowerCase().startsWith('water') ? 'water' : sample.category.toLowerCase().startsWith('waste') ? 'sanitation' : 'roads');
    }, 1800);
  };

  // Handle local photo upload
  const handleCustomPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPhotoUrl(URL.createObjectURL(file));
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        setDescription('Reported civic issue at current ward coordinate.');
        setCategory('roads');
      }, 1800);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    
    // Setup coordinates with slight random offset to scatter markers on the dashboard map
    const lat = (19.1155 + (Math.random() - 0.5) * 0.04).toFixed(6);
    const lng = (72.8755 + (Math.random() - 0.5) * 0.04).toFixed(6);

    const complaintData = {
      title: `Reported ${category.toUpperCase()}`,
      description: description,
      category: category,
      ward: ward,
      latitude: lat,
      longitude: lng,
      image_file: imageFile,
      audio_file: audioFile
    };

    try {
      const result = await addComplaint(complaintData);
      setSubmittedComplaint(result);
      setShowConfirmation(true);
      
      // Clear form states
      setDescription('');
      setImageFile(null);
      setAudioFile(null);
      setPhotoUrl(null);
    } catch (err) {
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get user-specific complaints
  const userComplaints = complaints.filter(
    (c) => c.user === user?.id || c.user === user?.username || c.user?.username === user?.username
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-[90vh] relative">
      
      {/* Confetti Animation */}
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

      {/* Dashboard Title */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-100 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Citizen Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Hello, {user?.first_name || 'Citizen'}! Report details below.</p>
        </div>

        {/* Dashboard Mode Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start border border-slate-200/50">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4.5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'report' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            📢 Report Issue
          </button>
          <button
            onClick={() => { setActiveTab('my-issues'); fetchComplaints(); }}
            className={`px-4.5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'my-issues' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            📍 My Reports ({userComplaints.length})
          </button>
          <button
            onClick={() => { setActiveTab('community'); fetchComplaints(); }}
            className={`px-4.5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'community' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            📸 Social Feed
          </button>
        </div>
      </div>

      {/* ── SCREEN: SUCCESS CONFIRMATION ── */}
      {showConfirmation && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-2xl text-center space-y-6 animate-scaleUp">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">AI Successfully Logged!</h2>
            <p className="text-slate-500 text-xs mt-2">
              Aapki complaint AI ne scan kar li hai. It has been routed to the correct department.
            </p>
          </div>

          <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400">STATUS:</span>
              <span className="bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                {submittedComplaint?.status || 'AI Scanning'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400">CATEGORY:</span>
              <span className="font-bold text-slate-700 capitalize">{submittedComplaint?.category || category}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400">LOCATION:</span>
              <span className="font-bold text-slate-700">{submittedComplaint?.ward || ward}</span>
            </div>
          </div>

          <button
            onClick={() => { setShowConfirmation(false); setActiveTab('my-issues'); }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Track Status Timeline
          </button>
        </div>
      )}

      {/* ── TAB CONTENT PANELS ── */}
      {!showConfirmation && (
        <>
          {/* TAB 1: FILING REPORT */}
          {activeTab === 'report' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Info panel */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                  <h3 className="text-lg font-bold">Zero Friction Reporting</h3>
                  <p className="text-white/80 text-xs mt-2 leading-relaxed">
                    India's first AI-powered complaint routing portal. Take a photo of the damaged road, record a voice description, or write text.
                  </p>
                  <ul className="mt-4 space-y-2.5 text-xs text-white/90">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Auto-GPS Ward Tagging
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Automatic Department Routing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Live Status Timeline Updates
                    </li>
                  </ul>
                </div>

                {/* GPS Location widget */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">GPS Ward Location</h4>
                    {isLocating && <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />}
                  </div>
                  <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                    <MapPin className="text-blue-500 w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">{ward}</p>
                      <p className="text-[10px] text-slate-400">Maharashtra, India</p>
                    </div>
                  </div>
                  <button
                    onClick={handleGPSLocation}
                    type="button"
                    className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    Refresh GPS coordinates
                  </button>
                </div>
              </div>

              {/* Form Input panel */}
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <form className="space-y-6" onSubmit={handleFormSubmit}>
                  
                  {/* Reporting Input Mode Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setReportMethod('text')}
                      className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition-all ${reportMethod === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Type Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportMethod('voice')}
                      className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition-all ${reportMethod === 'voice' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      <Mic className="w-3.5 h-3.5 animate-pulse text-red-500" />
                      <span>Speak (Voice)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportMethod('photo')}
                      className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition-all ${reportMethod === 'photo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>
                  </div>

                  {/* DYNAMIC VIEW FOR VOICE TAB */}
                  {reportMethod === 'voice' && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 text-center space-y-4">
                      <div className="flex justify-center items-center space-x-3 py-4">
                        <button
                          type="button"
                          onClick={handleVoiceRecord}
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-ping' : 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'}`}
                        >
                          <Mic className="w-6 h-6" />
                        </button>
                        {isRecording && (
                          <span className="text-red-500 text-sm font-bold tracking-wider animate-pulse">
                            RECORDING... {recordingSeconds}s
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {isRecording ? "Tap mic button to stop." : "Tap mic and speak in Hindi, Marathi or English. AI will automatically translate and transcribe."}
                      </p>

                      {isTranslating && (
                        <div className="flex items-center justify-center space-x-2 text-slate-500 text-xs">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                          <span>AI Transcribing Vernacular Audio...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DYNAMIC VIEW FOR PHOTO TAB */}
                  {reportMethod === 'photo' && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 text-center space-y-4 relative overflow-hidden">
                        
                        {isScanning && (
                          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none">
                            <div className="w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-scan absolute left-0" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-slate-950/90 text-white text-xs px-3.5 py-2 rounded-full font-bold shadow-lg flex items-center space-x-1.5">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
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
                              onClick={() => { setPhotoUrl(null); setImageFile(null); setDescription(''); }}
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
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Issue Description</label>
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
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="roads">🚗 Roads & Infrastructure</option>
                        <option value="water">💧 Water Supply</option>
                        <option value="electricity">💡 Electricity</option>
                        <option value="sanitation">🗑️ Sanitation & Waste</option>
                        <option value="health">🏥 Public Health</option>
                        <option value="safety">🛡️ Public Safety</option>
                        <option value="animals">🐕 Stray Animals</option>
                        <option value="other">⚙️ Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assigned Department (AI)</label>
                      <div className="w-full px-4 py-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-sm font-semibold capitalize">
                        {category === 'roads' && 'PWD'}
                        {category === 'water' && 'Jal Board'}
                        {category === 'electricity' && 'DISCOM'}
                        {category === 'sanitation' && 'Sanitation Dept'}
                        {category === 'health' && 'Health Department'}
                        {category === 'safety' && 'Police Department'}
                        {category === 'animals' && 'Veterinary Department'}
                        {category === 'other' && 'Collectorate Office'}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isScanning || isRecording || isTranslating}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><RefreshCw className="w-4.5 h-4.5 animate-spin" /><span>AI scanning & routing complaint...</span></>
                    ) : (
                      <><span>Submit Priority Complaint</span><Send className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: MY ISSUES / LIFECYCLE TIMELINE */}
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
                    const matchingCluster = clusters.find((c) => c.id === comp.cluster || c.complaints?.some(x => x.id === comp.id));
                    
                    return (
                      <div key={comp.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 relative overflow-hidden">
                        
                        {/* Status Left Accent Bar */}
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${comp.status === 'resolved' ? 'bg-emerald-500' : comp.status === 'in_progress' ? 'bg-orange-500' : 'bg-red-500'}`} />

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pl-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${comp.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : comp.status === 'in_progress' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                {comp.status?.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(comp.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-800 capitalize mt-2">{comp.category} Issue in {comp.ward}</h3>
                            <p className="text-sm text-slate-500 mt-1">{comp.description}</p>
                          </div>

                          {/* Image proof if present */}
                          {comp.image_file && (
                            <img src={comp.image_file} alt="complaint proof" className="h-16 w-16 object-cover rounded-xl border border-slate-100 self-start" />
                          )}
                        </div>

                        {/* Lifecycle Timeline */}
                        <div className="pl-3 border-t border-slate-100 pt-5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Complaint Lifecycle Status</h4>
                          
                          <div className="grid grid-cols-4 gap-2 relative">
                            {/* Connect Line */}
                            <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-slate-200 z-0" />
                            <div 
                              className="absolute top-4 left-[12.5%] h-0.5 bg-emerald-500 transition-all duration-1000 z-0"
                              style={{
                                width: comp.status === 'resolved' ? '75%' : comp.status === 'in_progress' ? '50%' : comp.status === 'verified' ? '25%' : '0%'
                              }}
                            />

                            {/* Node 1: Received */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white shadow-md">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 mt-2">Received</span>
                              <span className="text-[9px] text-slate-400">AI Registered</span>
                            </div>

                            {/* Node 2: Clustered */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md ${matchingCluster || comp.status === 'verified' || comp.status === 'in_progress' || comp.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {matchingCluster ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 mt-2">Clustered</span>
                              <span className="text-[9px] text-slate-400">{matchingCluster ? `Score: ${matchingCluster.severity_score}/10` : 'AI Scanning'}</span>
                            </div>

                            {/* Node 3: Action */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md ${comp.status === 'in_progress' || comp.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {comp.status === 'in_progress' || comp.status === 'resolved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 mt-2">Action</span>
                              <span className="text-[9px] text-slate-400">{comp.status === 'in_progress' || comp.status === 'resolved' ? `Dept: ${matchingCluster?.department || 'Assigned'}` : 'Awaiting Dept'}</span>
                            </div>

                            {/* Node 4: Resolved */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md ${comp.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {comp.status === 'resolved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 mt-2">Resolved</span>
                              <span className="text-[9px] text-slate-400">{comp.status === 'resolved' ? 'Verified Done' : 'Pending Work'}</span>
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

          {/* TAB 3: INSTAGRAM-STYLE CITIZEN FEED */}
          {activeTab === 'community' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="text-center space-y-1 mb-6">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Citizen Social Feed</h2>
                <p className="text-xs text-slate-500">View what citizens are reporting near you. Upvote to alert the state admin.</p>
              </div>

              {complaints.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No complaints posted in the feed yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {complaints.map((post) => (
                    <div key={post.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                      
                      {/* Post Header */}
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center font-bold text-blue-700 text-xs">
                            {post.citizen_name ? post.citizen_name.charAt(0) : 'C'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{post.citizen_name}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-slate-300" /> {post.citizen_location}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg border border-slate-200/50">
                          {post.category}
                        </span>
                      </div>

                      {/* Post Media (Image or Audio visualizer card) */}
                      {post.image_file ? (
                        <div className="relative aspect-video w-full bg-slate-900">
                          <img src={post.image_file} alt="complaint proof" className="w-full h-full object-cover" />
                        </div>
                      ) : post.audio_file ? (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex flex-col items-center justify-center border-y border-slate-100 space-y-3">
                          <Volume2 className="w-10 h-10 text-blue-500 animate-pulse" />
                          <span className="text-xs font-bold text-blue-700">Voice Complaint Recorded</span>
                          <audio src={post.audio_file} controls className="h-8 max-w-full" />
                        </div>
                      ) : null}

                      {/* Post Content */}
                      <div className="p-5 space-y-3 flex-grow">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {post.description}
                        </p>

                        {/* AI Processed Insight tag */}
                        {post.processed_text && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/40 text-xs">
                            <span className="font-extrabold text-blue-600 uppercase tracking-wider text-[9px] block mb-1">AI Verified Insight</span>
                            <span className="text-slate-500 italic">"{post.processed_text}"</span>
                          </div>
                        )}
                      </div>

                      {/* Post Interaction Footer */}
                      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <button
                          type="button"
                          onClick={() => upvoteComplaint(post.id)}
                          className={`flex items-center space-x-1.5 py-2 px-4 rounded-xl text-xs font-bold transition-all active:scale-95 border ${post.is_upvoted ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                          <Heart className={`w-4 h-4 ${post.is_upvoted ? 'fill-red-500 text-red-500' : ''}`} />
                          <span>{post.upvotes_count || 0} Upvotes</span>
                        </button>

                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400 font-bold">STATUS:</span>
                          <span className={`text-[9px] uppercase font-black px-2.5 py-1 rounded-full ${post.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : post.status === 'in_progress' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                            {post.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}
