import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleDemoLogin = async (role) => {
    setError('');
    const demoEmail = role === 'admin' ? 'admin@demo.com' : 'citizen@demo.com';
    const demoPassword = role === 'admin' ? 'demo_admin123' : 'demo_citizen123';
    
    // We just use the username 'admin' or 'citizen' for token login since Django auth uses username by default
    const username = role === 'admin' ? 'admin' : 'citizen';
    
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login/', {
        username: username,
        password: demoPassword
      });
      
      const { access } = response.data;
      
      // Fetch user details
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
      setError('Failed to login. Is backend running?');
      console.error(err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('Manual login is not wired up yet. Please use the Demo buttons below!');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create an account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-blue-600 hover:text-blue-500">
              {isLogin ? 'register as a new user' : 'sign in to existing account'}
            </button>
          </p>
        </div>
        
        {error && <div className="text-red-600 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input id="name" name="name" type="text" className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Full Name" />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={`appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 ${isLogin ? 'rounded-t-md' : ''} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`} placeholder="Email address" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Password" />
            </div>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-colors">
              {isLogin ? 'Sign In' : 'Register'}
            </button>
          </div>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Quick Demo Access</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button 
                type="button" 
                onClick={() => handleDemoLogin('admin')}
                className="w-full flex justify-center py-2.5 px-4 border border-indigo-600 rounded-md shadow-sm bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                Login as Demo Admin
              </button>
              <button 
                type="button" 
                onClick={() => handleDemoLogin('citizen')}
                className="w-full flex justify-center py-2.5 px-4 border border-green-600 rounded-md shadow-sm bg-green-50 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
              >
                Login as Demo Citizen
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
