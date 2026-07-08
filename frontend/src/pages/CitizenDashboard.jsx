import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Camera, FileText, MapPin, RefreshCw, Send,
  CheckCircle, Clock, AlertCircle, ChevronRight, ThumbsUp,
  Layers, Trash2, Play, Square, Volume2, Navigation
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
  const [coords, setCoords] = useState({ lat: null, lng: null });
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
  const { complaints, clusters, addComplaint, fetchComplaints, fetchClusters, upvoteComplaint } = useComplaintStore();
  useEffect(() => {
    fetchComplaints();
    fetchClusters();
  }, []);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('report');
  const [reportMethod, setReportMethod] = useState('text');

  // Form State
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Roads');
  const [photoUrl, setPhotoUrl] = useState(null);

  // ΓöÇΓöÇΓöÇ FEATURE 1: Real GPS + City Name ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [isLocating, setIsLocating] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);
  const [cityName, setCityName] = useState('');
  const [locationError, setLocationError] = useState('');

  // Location Permission Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  // 'requesting' | 'fetching' | 'success' | 'denied'
  const [locationModalStatus, setLocationModalStatus] = useState('requesting');

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    // Open our custom modal immediately
    setShowLocationModal(true);
    setLocationModalStatus('requesting');
    setLocationError('');
    setIsLocating(true);

    // Simultaneously trigger the browser's native permission popup
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Browser granted ΓÇö move to fetching city
        setLocationModalStatus('fetching');
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lon: longitude });
        setLocationGranted(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || addr.state || 'Unknown Location';
          const state = addr.state || '';
          setCityName(state ? `${city}, ${state}` : city);
        } catch {
          setCityName('Location detected');
        }
        setLocationModalStatus('success');
        setIsLocating(false);
        // Auto-close modal after 2.5s on success
        setTimeout(() => setShowLocationModal(false), 2500);
      },
      (err) => {
        setIsLocating(false);
        setLocationGranted(false);
        setLocationModalStatus('denied');
        if (err.code === 1) {
          setLocationError('Location permission denied. Please allow location access in browser settings.');
        } else {
          setLocationError('Unable to fetch location. Try again.');
        }
      },
      { timeout: 15000 }
    );
  };

  // ΓöÇΓöÇΓöÇ FEATURE 2: Real Audio Recording ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioError, setAudioError] = useState('');
  const [locationRequiredMsg, setLocationRequiredMsg] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = async () => {
    setAudioError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setAudioError('Microphone access denied. Please allow mic permission.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDeleteAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioError('');
    setLocationRequiredMsg('');
  };

  // ΓöÇΓöÇΓöÇ FEATURE 3: Photo Upload (polished) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processPhotoFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPhotoUrl(URL.createObjectURL(file));
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setDescription('Civic issue detected at the uploaded location. Please add more details.');
      setCategory('Roads');
    }, 2200);
  };

  const handleCustomPhotoUpload = (e) => processPhotoFile(e.target.files[0]);

  const handleSelectPhoto = (sample) => {
    setPhotoUrl(sample.url);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setDescription(sample.text);
      setCategory(sample.category);
    }, 2200);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processPhotoFile(e.dataTransfer.files[0]);
  };

  // ΓöÇΓöÇΓöÇ FEATURE 4: ChatGPT-style Inline Voice (Web Speech API) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const speechRecognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Hindi + English

      let finalTranscript = '';
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t + ' ';
          } else {
            interim = t;
          }
        }
        setDescription(finalTranscript + interim);
      };
      recognition.onerror = () => setIsSpeechListening(false);
      recognition.onend = () => setIsSpeechListening(false);
      speechRecognitionRef.current = recognition;
    }
    return () => {
      if (speechRecognitionRef.current) speechRecognitionRef.current.abort();
    };
  }, []);

  const toggleSpeechListening = () => {
    if (!speechRecognitionRef.current) return;
    if (isSpeechListening) {
      speechRecognitionRef.current.stop();
      setIsSpeechListening(false);
    } else {
      setDescription('');
      speechRecognitionRef.current.start();
      setIsSpeechListening(true);
    }
  };

  // ΓöÇΓöÇΓöÇ Submission Logic ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [confetti, setConfetti] = useState([]);

  // Confetti
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

  // Fetch GPS Coordinates using the browser's Geolocation API
  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
        setWard('Ward 4 - Andheri East');
        alert(`📍 Your location has been stored!\n\nLatitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}`);
      },
      (error) => {
        setIsLocating(false);
        alert(`Unable to fetch your location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
    setLocationRequiredMsg('');

    // Validate location for voice submissions
    if (reportMethod === 'voice' && !locationGranted) {
      setLocationRequiredMsg('📍 Please give location access first! Click "Auto-Detect via GPS" in the Location Details panel.');
      return;
    }

    if (!description.trim() && reportMethod !== 'voice') return;
    if (reportMethod === 'voice' && !audioBlob) return;

    setIsSubmitting(true);

    // Use the real GPS coordinates captured via "Refresh GPS coordinates" if available.
    // Otherwise fall back to a scattered coordinate near the default ward so the map still has something to show.
    const lat = coords.lat !== null
      ? coords.lat.toFixed(6)
      : (19.1155 + (Math.random() - 0.5) * 0.04).toFixed(6);
    const lng = coords.lng !== null
      ? coords.lng.toFixed(6)
      : (72.8755 + (Math.random() - 0.5) * 0.04).toFixed(6);

    const complaintData = {
      title: `Reported ${category.toUpperCase()}`,
      description: description || 'Voice complaint submitted.',
      category: category.toLowerCase(),
      district: cityName || 'Indore',
      latitude: locationCoords?.lat || 23.2599 + (Math.random() - 0.5) * 0.04,
      longitude: locationCoords?.lon || 77.4126 + (Math.random() - 0.5) * 0.04,
      image_file: null, 
      audio_file: null
    };

    if (audioBlob) {
      complaintData.audio_file = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
    }
    
    // For photo, if they used sample photo, fetch it and convert to File
    if (photoUrl && photoUrl.startsWith('http')) {
      try {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        complaintData.image_file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      } catch (e) {
        console.warn("Could not download sample photo as File object. Sending only URL.");
      }
    }

    try {
      const result = await addComplaint(complaintData);
      setSubmittedComplaint(result);
      setShowConfirmation(true);

      // Clear form
      setDescription('');
      setPhotoUrl(null);
      handleDeleteAudio();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userComplaints = complaints.filter(
    (c) => c.user === (user?.email || 'guest@demo.com')
  );

  // ΓöÇΓöÇΓöÇ Reder ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  return (
    <div className="relative min-h-[90vh] pb-20">
      {/* Dynamic Premium Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/80 via-white to-indigo-50/80 -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-400/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
      
      {/* Marquee Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-2 shadow-md">
        {/* eslint-disable-next-line jsx-a11y/no-distracting-elements */}
        <marquee className="text-sm font-bold tracking-widest uppercase" scrollamount="6">
          Γ£¿ Welcome to the {cityName ? `${cityName} ` : ''}Citizen Portal! Report issues, upvote community concerns, and track resolutions in real-time. Γ£¿
        </marquee>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">

      {/* ΓöÇΓöÇ Location Permission Modal ΓöÇΓöÇ */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15,23,42,0.55)' }}>
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{ animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            {/* Top gradient strip */}
            <div className={`h-1.5 w-full ${locationModalStatus === 'success' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : locationModalStatus === 'denied' ? 'bg-gradient-to-r from-red-400 to-rose-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} />

            <div className="p-7">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                {locationModalStatus === 'requesting' && (
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* Pulsing rings */}
                    <span className="absolute w-20 h-20 rounded-full bg-blue-100 animate-ping opacity-60" />
                    <span className="absolute w-14 h-14 rounded-full bg-blue-200 animate-ping opacity-40" style={{ animationDelay: '0.3s' }} />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-300">
                      <MapPin className="w-7 h-7 text-white" />
                    </div>
                  </div>
                )}
                {locationModalStatus === 'fetching' && (
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                    <RefreshCw className="w-7 h-7 text-white animate-spin" />
                  </div>
                )}
                {locationModalStatus === 'success' && (
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200" style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                )}
                {locationModalStatus === 'denied' && (
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              {/* Title & description */}
              {locationModalStatus === 'requesting' && (
                <>
                  <h2 className="text-xl font-black text-slate-800 text-center mb-1">Location Access Required</h2>
                  <p className="text-sm text-slate-500 text-center leading-relaxed">
                    Please <span className="font-bold text-blue-600">Allow</span> location access in the browser popup above. We need your location to file accurate civic complaints.
                  </p>
                  <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-bold text-blue-700 flex items-center space-x-1.5">
                      <Navigation className="w-3.5 h-3.5" /><span>Why we need your location?</span>
                    </p>
                    {['Pin your issue on the map', 'Auto-detect your city', 'Group complaints by area for priority'].map((point, i) => (
                      <div key={i} className="flex items-center space-x-2 text-xs text-slate-600">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-center space-x-2 text-slate-400 text-xs">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Waiting for browser permission...</span>
                  </div>
                </>
              )}

              {locationModalStatus === 'fetching' && (
                <>
                  <h2 className="text-xl font-black text-slate-800 text-center mb-1">Location Granted! Γ£à</h2>
                  <p className="text-sm text-slate-500 text-center">Fetching your city name from GPS coordinates...</p>
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex space-x-1.5">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {locationModalStatus === 'success' && (
                <>
                  <h2 className="text-xl font-black text-slate-800 text-center mb-1">Location Detected! ≡ƒÄ»</h2>
                  <p className="text-sm text-slate-500 text-center mb-4">Your complaint will be accurately filed at:</p>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                    <p className="text-lg font-black text-emerald-700">{cityName}</p>
                    {locationCoords && (
                      <p className="text-[11px] text-emerald-500 font-mono mt-1">
                        {locationCoords.lat.toFixed(4)}┬░N, {locationCoords.lon.toFixed(4)}┬░E
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-3">This dialog will close automatically...</p>
                </>
              )}

              {locationModalStatus === 'denied' && (
                <>
                  <h2 className="text-xl font-black text-slate-800 text-center mb-1">Permission Denied Γ¥î</h2>
                  <p className="text-sm text-slate-500 text-center mb-4">{locationError || 'Location access was blocked.'}</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                    <p className="text-xs font-bold text-amber-700">How to enable location manually:</p>
                    <p className="text-xs text-amber-600">1. Click the ≡ƒöÆ lock icon in your browser's address bar</p>
                    <p className="text-xs text-amber-600">2. Set Location ΓåÆ <strong>Allow</strong></p>
                    <p className="text-xs text-amber-600">3. Refresh the page and try again</p>
                  </div>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="mt-5 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Confetti */}
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

      {/* Header & Floating Tab Navigation */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-indigo-900 tracking-tight">Citizen Dashboard</h1>
          <div className="flex items-center space-x-2 mt-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-sm font-medium text-slate-500">
              Welcome back, <span className="font-bold text-slate-800">{user?.first_name || 'Guest'}</span>
            </p>
          </div>
        </div>

        {/* Glassmorphic Floating Tabs */}
        <div className="flex bg-white/60 backdrop-blur-xl p-1.5 rounded-2xl shadow-sm border border-white/80 w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('report'); setShowConfirmation(false); }}
            className={`flex-1 md:flex-none px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'report' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-100' : 'text-slate-500 hover:bg-white/60 hover:text-slate-800 scale-95 hover:scale-100'}`}
          >Report Issue</button>
          <button
            onClick={() => { setActiveTab('my-issues'); setShowConfirmation(false); }}
            className={`flex-1 md:flex-none px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 relative ${activeTab === 'my-issues' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-100' : 'text-slate-500 hover:bg-white/60 hover:text-slate-800 scale-95 hover:scale-100'}`}
          >
            My Submissions
            {userComplaints.length > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black shadow-sm ${activeTab === 'my-issues' ? 'bg-white text-blue-600' : 'bg-indigo-600 text-white'}`}>
                {userComplaints.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('community'); setShowConfirmation(false); }}
            className={`flex-1 md:flex-none px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'community' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-100' : 'text-slate-500 hover:bg-white/60 hover:text-slate-800 scale-95 hover:scale-100'}`}
          >Nearby Feed</button>
        </div>
      </div>

      {/* CONFIRMATION SCREEN */}
      {showConfirmation ? (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto text-center py-12 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 text-emerald-600">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Aapki baat receive ho gayi! Γ£à</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm">AI processed your issue successfully and routed it to the constituency priority map.</p>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 text-left mb-8 max-w-md mx-auto">
            <div className="flex items-center space-x-2 text-blue-800 font-bold mb-3 text-sm">
              <Layers className="w-4 h-4" />
              <span>AI Severity &amp; Priority Details</span>
            </div>
            <div className="space-y-2 text-slate-700 text-sm">
              <div className="flex justify-between"><span>Priority Index:</span><span className="font-bold text-red-600">≡ƒöÑ High (Severity 8.9/10)</span></div>
              <div className="flex justify-between"><span>Cluster Assignment:</span><span className="font-bold text-slate-800">{submittedComplaint?.category} Problems</span></div>
              {cityName && <div className="flex justify-between"><span>City:</span><span className="font-bold text-slate-800">{cityName}</span></div>}
              <div className="flex justify-between border-t border-blue-200/50 pt-2 mt-2"><span>Community Upvotes:</span><span className="font-bold text-indigo-700">1 (You) + 340 active mentions</span></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs sm:max-w-md mx-auto">
            <button onClick={() => setActiveTab('my-issues')} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm">Track Issue Status</button>
            <button onClick={() => setShowConfirmation(false)} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-sm">Report Another Issue</button>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: REPORT COMPLAINT */}
          {activeTab === 'report' && (
            <div className="bg-white/50 backdrop-blur-2xl rounded-[40px] border border-slate-200/60 shadow-xl p-6 md:p-10 relative overflow-hidden group animate-fade-in">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
              


              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

              {/* Left Column */}
              <div className="space-y-6 lg:col-span-1">

                {/* ΓöÇΓöÇ FEATURE 1: Location Details Card ΓöÇΓöÇ */}
                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center relative z-10">
                    <MapPin className="w-4 h-4 mr-1.5 text-blue-500" /> Location Details
                  </h3>

                  <div className="space-y-4">


                    {/* City Name Display */}
                    {cityName && (
                      <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                        <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">Detected City</p>
                          <p className="text-sm font-bold text-emerald-800">{cityName}</p>
                        </div>
                      </div>
                    )}

                    {/* Coordinates Display */}
                    {locationCoords && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">GPS Coordinates</p>
                        <p className="text-xs font-mono text-slate-600">Lat: {locationCoords.lat.toFixed(5)}</p>
                        <p className="text-xs font-mono text-slate-600">Lon: {locationCoords.lon.toFixed(5)}</p>
                      </div>
                    )}

                    {/* Location Error */}
                    {locationError && (
                      <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600 font-medium">{locationError}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGPSLocation}
                      disabled={isLocating}
                      className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all border ${
                        locationGranted
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100'
                      }`}
                    >
                      {isLocating ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Acquiring GPS...</span></>
                      ) : locationGranted ? (
                        <><CheckCircle className="w-3.5 h-3.5" /><span>Location Acquired Γ£ô</span></>
                      ) : (
                        <><Navigation className="w-3.5 h-3.5" /><span>Auto-Detect via GPS</span></>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Classification Info */}
                <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-700 shadow-xl shadow-slate-900/20 text-white relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-10 -mt-10 transition-transform duration-700 group-hover:scale-150" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
                    <Layers className="w-4 h-4 mr-1.5 text-indigo-400" /> AI Classification
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Upload voice or photos. Gemini AI scans submissions to identify category &amp; matches duplicate complaints to prioritize them.
                  </p>
                  <div className="flex items-center space-x-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 text-indigo-300">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-[11px] font-medium leading-tight">Photos/Voice inputs will auto-fill your descriptions!</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                    <MapPin className="text-blue-500 w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">{ward}</p>
                      <p className="text-[10px] text-slate-400">
                        {coords.lat !== null ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Maharashtra, India'}
                      </p>
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

              {/* Right Column: Form */}
              <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/60 shadow-xl shadow-blue-100/40 lg:col-span-2 space-y-6 relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mb-20 transition-transform duration-700 group-hover:scale-110 pointer-events-none" />

                {/* Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Choose Reporting Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'voice', icon: <Mic className="w-6 h-6 mb-2" />, label: '≡ƒÄÖ∩╕Å Speak (Voice)' },
                      { key: 'photo', icon: <Camera className="w-6 h-6 mb-2" />, label: '≡ƒô╕ Snap (Photo)' },
                      { key: 'text', icon: <FileText className="w-6 h-6 mb-2" />, label: 'Γî¿∩╕Å Type (Text)' },
                    ].map(({ key, icon, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setReportMethod(key); setDescription(''); setPhotoUrl(null); handleDeleteAudio(); setLocationRequiredMsg(''); }}
                        className={`flex flex-col items-center justify-center py-5 px-2 border-2 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                          reportMethod === key
                            ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 font-bold shadow-md shadow-indigo-100'
                            : 'border-slate-100 bg-white/50 text-slate-500 hover:border-blue-200 hover:bg-white hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50'
                        }`}
                      >
                        <div className={`transition-transform duration-300 ${reportMethod === key ? 'scale-110 text-indigo-600' : 'group-hover:scale-110'}`}>
                          {icon}
                        </div>
                        <span className="text-xs z-10">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-6">

                  {/* ΓöÇΓöÇ FEATURE 2: VOICE TAB ΓöÇΓöÇ */}
                  {reportMethod === 'voice' && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-5">
                      {/* Prompt Text */}
                      <div className="text-center">
                        <h4 className="text-base font-bold text-slate-700">≡ƒÄÖ∩╕Å "Boliye, aapki kya samasya hai?"</h4>
                        <p className="text-xs text-slate-400 mt-1">Record your complaint in your voice. It will be saved and submitted.</p>
                      </div>

                      {/* Waveform / Status */}
                      <div className="flex justify-center items-center h-16 bg-white rounded-xl border border-slate-200">
                        {isRecording ? (
                          <div className="flex space-x-1 items-end h-10 px-4">
                            {[3, 6, 4, 8, 5, 9, 6, 7, 4, 6, 3, 7, 5, 8, 4].map((h, i) => (
                              <div
                                key={i}
                                className="w-1.5 bg-red-500 rounded-full"
                                style={{
                                  height: `${h * 10}%`,
                                  animation: `wave 0.8s ease-in-out infinite`,
                                  animationDelay: `${i * 0.07}s`
                                }}
                              />
                            ))}
                          </div>
                        ) : audioUrl ? (
                          <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold">
                            <Volume2 className="w-4 h-4" />
                            <span>Recording saved ΓÇö listen below</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Click the mic button below to start recording</span>
                        )}
                      </div>

                      {/* Record / Stop Buttons */}
                      {!audioUrl && (
                        <div className="flex flex-col items-center space-y-3">
                          <button
                            type="button"
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg hover:scale-105 active:scale-95 ${
                              isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-6 h-6" />}
                          </button>
                          {isRecording && (
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-sm font-bold text-red-500">
                                Recording: {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          )}
                          {!isRecording && (
                            <p className="text-xs text-slate-400">{isRecording ? '' : 'Tap to start ┬╖ Tap again to stop'}</p>
                          )}
                        </div>
                      )}

                      {/* Audio Playback + Delete */}
                      {audioUrl && (
                        <div className="bg-white rounded-xl border border-emerald-200 p-4 space-y-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-600 flex items-center space-x-1">
                              <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Your Recording</span>
                            </span>
                            <button
                              type="button"
                              onClick={handleDeleteAudio}
                              className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-700 font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-all border border-red-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                          <audio
                            controls
                            src={audioUrl}
                            className="w-full h-10"
                            style={{ borderRadius: '8px' }}
                          />
                          <p className="text-[11px] text-slate-400 text-center">Listen to verify ┬╖ Delete to re-record ┬╖ Submit when ready</p>
                        </div>
                      )}

                      {/* Mic Error */}
                      {audioError && (
                        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <p className="text-xs text-red-600 font-medium">{audioError}</p>
                        </div>
                      )}

                      {/* Location Required Warning */}
                      {locationRequiredMsg && (
                        <div className="flex items-start space-x-2 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 animate-pulse">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 font-semibold">{locationRequiredMsg}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ΓöÇΓöÇ FEATURE 3: PHOTO TAB ΓöÇΓöÇ */}
                  {reportMethod === 'photo' && (
                    <div className="space-y-4">
                      <div
                        className={`bg-slate-50 p-6 rounded-2xl border-2 border-dashed text-center space-y-4 relative overflow-hidden transition-all ${
                          isDragging ? 'border-blue-500 bg-blue-50/40 scale-[1.01]' : 'border-slate-200/80'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {/* AI Scanning Overlay */}
                        {isScanning && (
                          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none z-10">
                            <div className="w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-scan absolute left-0" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center space-x-1.5">
                                <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
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
                              className="mt-3 flex items-center space-x-1 text-xs text-red-500 font-bold hover:underline"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove Photo</span>
                            </button>
                          </div>
                        ) : (
                          <div className="py-6 flex flex-col items-center justify-center space-y-3">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                              <Camera className="w-8 h-8 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-600">
                                {isDragging ? '≡ƒôé Drop image here!' : 'Upload photo of the issue'}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">Drag & drop or click to browse</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              id="photo-file"
                              onChange={handleCustomPhotoUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="photo-file"
                              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer shadow-sm transition-all hover:shadow-md"
                            >
                              Choose File
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Sample Photos */}
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

                  {/* ΓöÇΓöÇ FEATURE 4: TEXT TAB with Inline Voice Icon ΓöÇΓöÇ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Description</label>
                    <div className="relative">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required={reportMethod === 'text'}
                        rows={4}
                        className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                        placeholder={
                          reportMethod === 'text'
                            ? 'Write description here, or click the ≡ƒÄñ mic icon to speak...'
                            : reportMethod === 'voice'
                            ? 'Auto-filled after voice recording...'
                            : 'Auto-filled after photo analysis...'
                        }
                      />

                      {/* ΓöÇΓöÇ ChatGPT-style Inline Voice Icon (TEXT TAB only) ΓöÇΓöÇ */}
                      {reportMethod === 'text' && speechSupported && (
                        <button
                          type="button"
                          onClick={toggleSpeechListening}
                          title={isSpeechListening ? 'Stop listening' : 'Speak to fill text'}
                          className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                            isSpeechListening
                              ? 'bg-red-500 text-white animate-pulse shadow-red-300 shadow-md'
                              : 'bg-white border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'
                          }`}
                        >
                          {isSpeechListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {/* Speech Status Indicator */}
                    {isSpeechListening && reportMethod === 'text' && (
                      <div className="flex items-center space-x-2 mt-2 text-red-500 text-xs font-bold">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        <span>Listening... (Hindi/English) ΓÇö click mic again to stop</span>
                      </div>
                    )}
                    {reportMethod === 'text' && !speechSupported && (
                      <p className="text-xs text-slate-400 mt-1">ΓÜá∩╕Å Voice input not supported in this browser. Try Chrome or Edge.</p>
                    )}
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
                        <option value="Roads">≡ƒÜù Roads (Potholes, Repair)</option>
                        <option value="Water Supply">≡ƒÆº Water Supply (Leak, Sewage)</option>
                        <option value="Waste Management">≡ƒùæ∩╕Å Waste Management (Trash heap)</option>
                        <option value="Electricity">≡ƒÆí Electricity (Streetlights)</option>
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
                    disabled={
                      isSubmitting || isScanning || isRecording ||
                      (reportMethod === 'voice' && !audioBlob)
                    }
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /><span>AI evaluating &amp; routing complaint...</span></>
                    ) : (
                      <><span>Submit Priority Complaint</span><Send className="w-4 h-4" /></>
                    )}
                  </button>

                  {/* Voice tab: hint if no audio recorded */}
                  {reportMethod === 'voice' && !audioBlob && !isRecording && (
                    <p className="text-center text-xs text-slate-400">Record your voice above before submitting.</p>
                  )}
                </form>
              </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY ISSUES */}
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {userComplaints.map((comp) => {
                    const matchingCluster = clusters.find((c) => c.complaint_ids.includes(comp.id));
                    return (
                      <div key={comp.id} className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-lg shadow-slate-200/40 p-6 space-y-6 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150" />
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${comp.status === 'Resolved' ? 'bg-emerald-500' : comp.status === 'In Progress' ? 'bg-orange-500' : 'bg-red-500'}`} />

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pl-3">
                          <div>
                            <div className="flex items-center space-x-2.5">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${comp.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : comp.status === 'In Progress' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                {comp.status}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(comp.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mt-2">{comp.category} Issue</h3>
                            <p className="text-sm text-slate-500 mt-1">{comp.text}</p>
                          </div>
                          {comp.media_url && (
                            <img src={comp.media_url} alt="complaint proof" className="h-16 w-16 object-cover rounded-xl border border-slate-100 self-start" />
                          )}
                        </div>

                        <div className="pl-3 border-t border-slate-100 pt-5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Complaint Lifecycle Status</h4>
                          <div className="grid grid-cols-4 gap-2 relative">
                            <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-slate-200 z-0" />
                            <div
                              className="absolute top-4 left-[12.5%] h-0.5 bg-emerald-500 transition-all duration-1000 z-0"
                              style={{ width: comp.status === 'Resolved' ? '75%' : comp.status === 'In Progress' ? '50%' : '25%' }}
                            />
                            {[
                              { label: 'Received', sub: 'AI Registered', done: true },
                              { label: 'Clustered', sub: matchingCluster ? `Score: ${matchingCluster.severity_score}/10` : 'Searching...', done: !!matchingCluster },
                              { label: 'Action', sub: (comp.status === 'In Progress' || comp.status === 'Resolved') ? `Dept: ${matchingCluster?.department}` : 'Awaiting Dept', done: comp.status === 'In Progress' || comp.status === 'Resolved' },
                              { label: 'Resolved', sub: comp.status === 'Resolved' ? 'Verified Done' : 'Pending Work', done: comp.status === 'Resolved' },
                            ].map((step, i) => (
                              <div key={i} className="flex flex-col items-center text-center z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                  {step.done ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 mt-2">{step.label}</span>
                                <span className="text-[9px] text-slate-400">{step.sub}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMUNITY FEED */}
          {activeTab === 'community' && (
            <div className="mx-auto space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Nearby Constituency Issues</h2>
                  <p className="text-xs text-slate-500">Problems reported in your 2km radius. Upvote instead of writing duplicates.</p>
                </div>
                <div className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100 self-start">
                  ≡ƒôî Local area complaints
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clusters.filter(c => c.status !== 'Resolved').map((cluster, idx) => (
                  <div 
                    key={cluster.id} 
                    className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-lg shadow-slate-200/40 flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${cluster.severity_score >= 8.0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                          Severity: {cluster.severity_score}/10
                        </span>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{cluster.category}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mt-3">{cluster.title}</h3>
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">AI Summary Insight:</span>
                        <p className="text-xs text-slate-500 mt-1 italic">"{cluster.ai_summary}"</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-2 relative z-10">
                      <span className="text-xs text-slate-400 font-medium">≡ƒæÑ {cluster.mentions} citizens affected</span>
                      <button
                        type="button"
                        onClick={() => upvoteComplaint(cluster.complaints?.[0]?.id || cluster.id)}
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

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes slideUp {
          0% { transform: translateY(60px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scan { animation: scan 1.5s linear infinite; }
        .animate-fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      </div>
    </div>
  );
}
