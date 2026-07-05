import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Phone, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [usePhone, setUsePhone] = useState(false);
  
  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // Simulated OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer === 0) {
      setOtpSent(false);
      setTimer(60);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handleDemoLogin = async (role) => {
    setError('');
    setInfoMessage('');
    const demoPassword = role === 'admin' ? 'demo_admin123' : 'demo_citizen123';
    const username = role === 'admin' ? 'admin' : 'citizen';
    
    try {
      // Try to connect to Django API
      const response = await axios.post('http://localhost:8000/api/auth/login/', {
        username: username,
        password: demoPassword
      });
      
      const { access } = response.data;
      
      const userRes = await axios.get('http://localhost:8000/api/auth/me/', {
        headers: { Authorization: `Bearer ${access}` }
      });
      
      login(userRes.data, access);
      
      if (userRes.data.is_staff) {
        navigate('/admin/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      console.warn("Backend not running or unreachable. Falling back to local offline demo login.");
      
      // Offline fallback login logic
      const mockUserData = role === 'admin' 
        ? { username: 'admin', email: 'admin@demo.com', is_staff: true, first_name: 'MP Office' }
        : { username: 'citizen', email: 'citizen@demo.com', is_staff: false, first_name: 'Abhishek' };
      
      login(mockUserData, 'mock_jwt_token_for_hackathon');
      setInfoMessage('Running in Offline Demo Mode!');
      
      setTimeout(() => {
        if (mockUserData.is_staff) {
          navigate('/admin/dashboard');
        } else {
          navigate('/citizen/dashboard');
        }
      }, 1000);
    }
  };

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setOtpSent(true);
    setTimer(60);
    setInfoMessage('SMS Sent! Verification code is 1234');
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (otpCode === '1234') {
      setError('');
      setInfoMessage('OTP Verified successfully!');
      
      const mockUserData = { username: 'phone_user', email: 'citizen@demo.com', is_staff: false, first_name: 'Citizen' };
      login(mockUserData, 'mock_otp_jwt_token');
      
      setTimeout(() => {
        navigate('/citizen/dashboard');
      }, 1000);
    } else {
      setError('Invalid OTP code. Please use 1234.');
    }
  };

  const handleGuestLogin = () => {
    setError('');
    const mockUserData = { username: 'guest_user', email: 'guest@demo.com', is_staff: false, first_name: 'Guest User' };
    login(mockUserData, 'mock_guest_jwt_token');
    setInfoMessage('Logged in as Guest!');
    setTimeout(() => {
      navigate('/citizen/dashboard');
    }, 800);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('Connecting to backend API... Falling back to local mock sign-in.');
    handleDemoLogin('citizen');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div>
          <h2 className="mt-2 text-center text-3xl font-black text-slate-800 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            {isLogin ? 'Sign in to access your civic priorities' : 'Join to report issues in your ward'}
          </p>
        </div>

        {/* Tab Selector */}
        {isLogin && (
          <div className="flex bg-slate-100 p-1.5 rounded-xl">
            <button
              onClick={() => { setUsePhone(false); setError(''); setInfoMessage(''); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-sm font-semibold rounded-lg transition-all ${!usePhone ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Mail className="w-4 h-4" />
              <span>Email Sign In</span>
            </button>
            <button
              onClick={() => { setUsePhone(true); setError(''); setInfoMessage(''); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-sm font-semibold rounded-lg transition-all ${usePhone ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Phone className="w-4 h-4" />
              <span>Phone & OTP</span>
            </button>
          </div>
        )}

        {/* Messaging Panels */}
        {error && (
          <div className="text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-xl border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}
        {infoMessage && (
          <div className="text-green-600 text-xs font-semibold bg-green-50 p-3 rounded-xl border border-green-100 text-center">
            {infoMessage}
          </div>
        )}

        {/* Form Inputs */}
        {!usePhone ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="name@constituency.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-sm font-semibold text-slate-500">+91</span>
                    <input
                      type="tel"
                      pattern="[0-9]{10}"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      placeholder="9876543210"
                      className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <span>Send OTP Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Verification OTP</label>
                    <span className="text-xs text-blue-600 font-semibold">Resend in {timer}s</span>
                  </div>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                      placeholder="Enter 4-digit code"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <span>Verify & Login</span>
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
            <span className="bg-white px-3 text-slate-400">Quick Testing</span>
          </div>
        </div>

        {/* Demo Portals */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleDemoLogin('citizen')}
              className="flex items-center justify-center py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl transition-all"
            >
              Demo Citizen
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              className="flex items-center justify-center py-2.5 px-3 bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              Demo MP (Admin)
            </button>
          </div>
          <button
            onClick={handleGuestLogin}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
          >
            Continue as Guest (No Login)
          </button>
        </div>

        {/* Navigation Mode */}
        {isLogin && (
          <div className="text-center pt-2">
            <button 
              onClick={() => setIsLogin(false)}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600"
            >
              Don't have an account? Register here
            </button>
          </div>
        )}
        {!isLogin && (
          <div className="text-center pt-2">
            <button 
              onClick={() => setIsLogin(true)}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600"
            >
              Already have an account? Login here
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

