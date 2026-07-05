import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Camera, FileText, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const resolvedTickerPhrases = [
  "💧 12 Pipeline leaks repaired in Ward 12 this morning.",
  "💡 48 streetlights replaced in Sector 3 yesterday.",
  "🗑️ 2 Tons of garbage cleared from Ward 2 municipal park.",
  "🚗 340 Potholes filled in Andheri East Main Junction.",
  "📢 Total 1,452 complaints resolved this month across constituency."
];

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
  const [tickerIndex, setTickerIndex] = useState(0);

  // Rotate resolved ticker phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % resolvedTickerPhrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartReport = (method) => {
    // If not authenticated, we direct them to login, otherwise straight to dashboard with state
    if (isAuthenticated) {
      navigate('/citizen/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative min-h-[85vh] bg-gradient-to-b from-blue-50/50 via-white to-slate-50 overflow-hidden flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      
      {/* Decorative ambient blur blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER: Language Selection */}
      <div className="w-full flex justify-end items-center space-x-3 z-10 mb-8">
        <span className="flex items-center space-x-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>Awaaz Ki Bhasha:</span>
        </span>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="English">English</option>
          <option value="Hindi">हिंदी (Hindi)</option>
          <option value="Marathi">मराठी (Marathi)</option>
          <option value="Bengali">বাংলা (Bengali)</option>
        </select>
      </div>

      {/* MAIN HERO CONTENT */}
      <div className="text-center max-w-3xl mx-auto z-10 space-y-6">
        
        {/* Live glowing resolved ticker */}
        <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-100 rounded-full px-4.5 py-1.5 shadow-sm text-emerald-800 animate-pulse text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="transition-all duration-500 ease-in-out">
            {resolvedTickerPhrases[tickerIndex]}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-800 tracking-tight leading-none">
          Apni Awaaz, <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Apne MP Tak</span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-slate-500 leading-relaxed">
          Report civic issues in your ward instantly using Voice, Photo, or Text. 
          Google Gemini AI compiles similar issues and automatically informs your MP office for faster action.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
          <button
            onClick={() => handleStartReport('text')}
            className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
          >
            <span>Report Civic Issue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex-1 py-3 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            MP Admin Access
          </button>
        </div>
      </div>

      {/* THREE INTERACTIVE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 z-10">
        
        {/* Speak Card */}
        <div className="bg-white/85 backdrop-blur-sm p-6.5 rounded-3xl shadow-sm border border-slate-100/80 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="h-14 w-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Mic className="h-6.5 w-6.5 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-md font-bold text-slate-800">Speak (Voice)</h3>
          <p className="mt-2 text-xs text-slate-400 mb-5 leading-normal">
            Boliye, aapki kya samasya hai? Speak in Hindi, Marathi, or English. AI translates instantly.
          </p>
          <button 
            onClick={() => handleStartReport('voice')}
            className="mt-auto w-full bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-bold py-2.5 px-4 border border-slate-200/80 rounded-xl text-xs transition-colors"
          >
            Record Audio &gt;
          </button>
        </div>

        {/* Snap Card */}
        <div className="bg-white/85 backdrop-blur-sm p-6.5 rounded-3xl shadow-sm border border-slate-100/80 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="h-14 w-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <Camera className="h-6.5 w-6.5 text-emerald-600" />
          </div>
          <h3 className="text-md font-bold text-slate-800">Snap (Photo)</h3>
          <p className="mt-2 text-xs text-slate-400 mb-5 leading-normal">
            Upload a photo of damaged roads or waste. Gemini Vision automatically classifies and reviews it.
          </p>
          <button 
            onClick={() => handleStartReport('photo')}
            className="mt-auto w-full bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-bold py-2.5 px-4 border border-slate-200/80 rounded-xl text-xs transition-colors"
          >
            Take Photo &gt;
          </button>
        </div>

        {/* Type Card */}
        <div className="bg-white/85 backdrop-blur-sm p-6.5 rounded-3xl shadow-sm border border-slate-100/80 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="h-14 w-14 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-6.5 w-6.5 text-purple-600" />
          </div>
          <h3 className="text-md font-bold text-slate-800">Type (Text)</h3>
          <p className="mt-2 text-xs text-slate-400 mb-5 leading-normal">
            Write a detailed explanation of public water leaks or safety issues directly in your local language.
          </p>
          <button 
            onClick={() => handleStartReport('text')}
            className="mt-auto w-full bg-slate-50 hover:bg-purple-50 hover:text-purple-700 text-slate-600 font-bold py-2.5 px-4 border border-slate-200/80 rounded-xl text-xs transition-colors"
          >
            Write Text &gt;
          </button>
        </div>

      </div>

    </div>
  );
}
