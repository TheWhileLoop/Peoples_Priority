import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Phone, Mail, Lock, ShieldCheck, ArrowRight, User, MapPin,
  Home, Loader2, Eye, EyeOff, ChevronDown
} from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth`;
const INDIA_LOCATION_JSON = 'https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json';

// ─── Helper: login user and redirect ────────────────────────────────────────
function useLoginAndRedirect() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  return async (access) => {
    const userRes = await axios.get(`${API}/me/`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    const userData = userRes.data;
    login(userData, access);
    const role = userData.profile?.role || (userData.is_staff ? 'admin' : 'citizen');
    navigate(role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard');
  };
}

// ─── Reusable Field ──────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function InputWithIcon({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all ${props.className || ''}`}
      />
    </div>
  );
}

function SelectField({ icon: Icon, children, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />}
      <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
      <select
        {...props}
        className={`w-full appearance-none ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all ${props.className || ''}`}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Registration Form ────────────────────────────────────────────────────────
function RegisterForm({ setError, setInfoMessage, setView }) {
  const loginAndRedirect = useLoginAndRedirect();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Location data
  const [locationData, setLocationData] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Fetch Indian states and districts on mount
  useEffect(() => {
    axios.get(INDIA_LOCATION_JSON)
      .then(res => setLocationData(res.data.states || []))
      .catch(() => setError('Could not load location data. Please check internet connection.'));
  }, []);

  // When state changes, update districts
  useEffect(() => {
    const found = locationData.find(s => s.state === state);
    setDistricts(found ? found.districts : []);
    setDistrict('');
  }, [state, locationData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!state || !district || !city) {
      setError('Please fill in your State, District, and City/Village.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/register/`, {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone_number: phone,
        country: 'India',
        state,
        district,
        city,
        address,
      });

      setInfoMessage(res.data.message);
      await loginAndRedirect(res.data.access);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        // Extract the first error message from DRF response
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        setError(`${firstKey}: ${msg}`);
      } else {
        setError('Registration failed. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Name Row */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name">
          <InputWithIcon
            icon={User}
            type="text"
            required
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Rahul"
          />
        </Field>
        <Field label="Last Name">
          <InputWithIcon
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Sharma"
          />
        </Field>
      </div>

      {/* Email */}
      <Field label="Email Address">
        <InputWithIcon
          icon={Mail}
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="rahul@example.com"
        />
      </Field>

      {/* Password */}
      <Field label="Password">
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      {/* Phone */}
      <Field label="Phone Number (for OTP Login)">
        <div className="relative">
          <span className="absolute left-3.5 top-3.5 text-sm font-semibold text-slate-500 pointer-events-none">+91</span>
          <input
            type="tel"
            pattern="[0-9]{10}"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="9876543210"
            className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
          />
        </div>
      </Field>

      {/* Divider */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Your Location
          </span>
        </div>
      </div>

      {/* Country (locked to India) */}
      <Field label="Country">
        <InputWithIcon
          icon={MapPin}
          type="text"
          value="India 🇮🇳"
          readOnly
          className="cursor-not-allowed bg-slate-100 text-slate-500"
        />
      </Field>

      {/* State */}
      <Field label="State">
        <SelectField
          icon={MapPin}
          required
          value={state}
          onChange={e => setState(e.target.value)}
        >
          <option value="">Select State...</option>
          {locationData.map(s => (
            <option key={s.state} value={s.state}>{s.state}</option>
          ))}
        </SelectField>
      </Field>

      {/* District */}
      <Field label="District">
        <SelectField
          required
          value={district}
          onChange={e => setDistrict(e.target.value)}
          disabled={!state}
        >
          <option value="">{state ? 'Select District...' : 'Select state first'}</option>
          {districts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </SelectField>
      </Field>

      {/* City/Village */}
      <Field label="City / Village">
        <InputWithIcon
          icon={Home}
          type="text"
          required
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. Andheri, Pune, Varanasi"
        />
      </Field>

      {/* Address */}
      <Field label="Full Address (Optional)">
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="House/Flat No., Street, Ward..."
          rows={2}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all resize-none"
        />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating account...</span></>
        ) : (
          <><span>Create Citizen Account</span><ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <p className="text-center text-xs text-slate-500 pt-1">
        Already have an account?{' '}
        <button type="button" onClick={() => setView('login')} className="font-bold text-blue-600 hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
}

// ─── Email Login Form ─────────────────────────────────────────────────────────
function EmailLoginForm({ setError, setInfoMessage }) {
  const loginAndRedirect = useLoginAndRedirect();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      // Django SimpleJWT uses username field — we use email as username
      const res = await axios.post(`${API}/login/`, { username: email, password });
      setInfoMessage('Login successful! Redirecting...');
      await loginAndRedirect(res.data.access);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else {
        // Offline demo fallback
        setError('Backend unreachable. Use the Quick Access buttons below.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field label="Email Address">
        <InputWithIcon
          icon={Mail}
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Password">
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing in...</span></>
        ) : (
          <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </form>
  );
}

// ─── Phone OTP Login Form ─────────────────────────────────────────────────────
function PhoneOtpForm({ setError, setInfoMessage, setView }) {
  const loginAndRedirect = useLoginAndRedirect();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setOtpSent(false);
      setTimer(60);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    setError('');
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setOtpSent(true);
    setTimer(60);
    setInfoMessage('📲 OTP sent! (For demo, use code: 1234)');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/verify-otp/`, {
        phone_number: phone,
        otp_code: otp,
      });
      setInfoMessage(res.data.message);
      await loginAndRedirect(res.data.access);
    } catch (err) {
      const data = err.response?.data;
      if (data?.needs_registration) {
        setError('No account found. Please register first.');
        setTimeout(() => setView('register'), 1500);
      } else {
        setError(data?.error || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Field label="Phone Number">
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-sm font-semibold text-slate-500 pointer-events-none">+91</span>
              <input
                type="tel"
                pattern="[0-9]{10}"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder="9876543210"
                className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
              />
            </div>
          </Field>
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Phone className="w-4 h-4" />
            <span>Send OTP Code</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <Field label="Verification OTP">
            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Enter 4-Digit OTP
                </label>
                <span className="text-xs text-blue-600 font-semibold">Resend in {timer}s</span>
              </div>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  placeholder="1 2 3 4"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm tracking-[0.5em] font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying...</span></>
            ) : (
              <><ShieldCheck className="w-4 h-4" /><span>Verify & Login</span></>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function Login() {
  // view: 'login' | 'register'
  const [view, setView] = useState('login');
  // loginTab: 'email' | 'phone'
  const [loginTab, setLoginTab] = useState('email');
  const [showCitizenDropdown, setShowCitizenDropdown] = useState(false);

  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const navigate = useNavigate();
  const { login } = useAuthStore();

  // Clear messages when switching views/tabs
  const switchView = (v) => { setView(v); setError(''); setInfoMessage(''); };
  const switchTab = (t) => { setLoginTab(t); setError(''); setInfoMessage(''); };

  // ── Demo quick-login (offline fallback) ──────────────────────
  const handleDemoLogin = async (role, specificUsername = null) => {
    setError('');
    setInfoMessage('');
    const demoPassword = role === 'admin' ? 'demo_admin123' : 'demo_citizen123';
    const demoUsername = role === 'admin' ? 'admin' : (specificUsername || 'citizen');

    try {
      const res = await axios.post(`${API}/login/`, { username: demoUsername, password: demoPassword });
      const userRes = await axios.get(`${API}/me/`, {
        headers: { Authorization: `Bearer ${res.data.access}` },
      });
      login(userRes.data, res.data.access);
      navigate(role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard');
    } catch {
      // Offline fallback
      const mockUser = role === 'admin'
        ? { username: 'admin', email: 'admin@demo.com', is_staff: true, first_name: 'MP Office', profile: { role: 'admin' } }
        : { username: 'citizen', email: 'citizen@demo.com', is_staff: false, first_name: 'Abhishek', profile: { role: 'citizen' } };
      login(mockUser, 'mock_jwt_token_demo');
      setInfoMessage('🔌 Running in Offline Demo Mode!');
      setTimeout(() => navigate(role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard'), 900);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-2xl mb-3">
                <span className="text-2xl">🇮🇳</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {view === 'register' ? 'Citizen Registration' : 'Welcome Back'}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {view === 'register'
                  ? 'Create your account to report civic issues'
                  : 'Sign in to access your civic dashboard'}
              </p>
            </div>

            {/* View Toggle: Login / Register */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => switchView('login')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchView('register')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Register
              </button>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                ⚠️ {error}
              </div>
            )}
            {infoMessage && (
              <div className="text-emerald-700 text-xs font-semibold bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                ✅ {infoMessage}
              </div>
            )}

            {/* ── LOGIN VIEW ── */}
            {view === 'login' && (
              <>
                {/* Login method tabs */}
                <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl">
                  <button
                    onClick={() => switchTab('email')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${loginTab === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email Login
                  </button>
                  <button
                    onClick={() => switchTab('phone')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${loginTab === 'phone' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Phone & OTP
                  </button>
                </div>

                {loginTab === 'email' ? (
                  <EmailLoginForm setError={setError} setInfoMessage={setInfoMessage} />
                ) : (
                  <PhoneOtpForm setError={setError} setInfoMessage={setInfoMessage} setView={switchView} />
                )}

                {/* Quick Demo access */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Quick Demo Access
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 relative">
                  <div className="relative">
                    <button
                      id="demo-citizen-btn"
                      onClick={() => setShowCitizenDropdown(!showCitizenDropdown)}
                      className="w-full flex items-center justify-center py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl transition-all"
                    >
                      👤 Demo Citizen <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>
                    {showCitizenDropdown && (
                      <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-xs font-bold text-slate-700">
                        <button onClick={() => handleDemoLogin('citizen', 'geetanshi')} className="block w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100">
                          Geetanshi Jain
                        </button>
                        <button onClick={() => handleDemoLogin('citizen', 'abhishek_y')} className="block w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100">
                          Abhishek Yaduwanshi
                        </button>
                        <button onClick={() => handleDemoLogin('citizen', 'ayush')} className="block w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100">
                          Ayush Jaiswal
                        </button>
                        <button onClick={() => handleDemoLogin('citizen', 'abhishek_t')} className="block w-full text-left px-4 py-2.5 hover:bg-slate-50">
                          Abhishek Tayde
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    id="demo-admin-btn"
                    onClick={() => handleDemoLogin('admin')}
                    className="flex items-center justify-center py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all h-[42px]"
                  >
                    🏛️ Demo MP (Admin)
                  </button>
                </div>
              </>
            )}

            {/* ── REGISTER VIEW ── */}
            {view === 'register' && (
              <RegisterForm setError={setError} setInfoMessage={setInfoMessage} setView={switchView} />
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center mt-4 text-xs text-slate-400">
          People's Priority · Civic complaint portal for India 🇮🇳
        </p>
      </div>
    </div>
  );
}
