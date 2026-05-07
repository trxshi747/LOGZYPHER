import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!loginData.username) newErrors.username = 'Username is required';
    if (!loginData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const validateRegister = () => {
    const newErrors = {};
    if (!registerData.username) newErrors.username = 'Username is required';
    if (!registerData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(registerData.email)) newErrors.email = 'Email is invalid';
    if (!registerData.password) newErrors.password = 'Password is required';
    else if (registerData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (registerData.password !== registerData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = validateLogin();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/login_check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        login(data.token);
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Login error:', errorData);
        setErrors({ general: errorData.message || 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Fetch error during login:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const newErrors = validateRegister();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password
        })
      });
      
      if (response.ok) {
        // After successful registration, switch to login tab
        setActiveTab('login');
        setLoginData({ username: registerData.username, password: '' });
        setErrors({ general: 'Registration successful. Please login.' });
      } else {
        const errorData = await response.json();
        console.error('Registration error:', errorData);
        setErrors({ general: errorData.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Fetch error during registration:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="glass-card rounded-xl p-6 w-full max-w-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-5xl text-white font-medium">Authentication</h2>
          <button 
            onClick={onClose}
            className="text-white text-3xl hover:text-gray-300"
          >
            &times;
          </button>
        </div>

        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 text-3xl ${activeTab === 'login' ? 'border-b-2 border-white text-white' : 'text-gray-500'}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`py-2 px-4 text-3xl ${activeTab === 'register' ? 'border-b-2 border-white text-white' : 'text-gray-500'}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>

        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errors.general}
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-white text-2xl mb-2" htmlFor="username">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
                className={`w-full glass-input px-4 py-2 text-2xl rounded-lg focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-200 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.username && <p className="text-red-500 text-xl mt-1">{errors.username}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-white mb-2 text-2xl" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                className={`w-full glass-input px-4 py-2 text-2xl rounded-lg focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-200 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.password && <p className="text-red-500 text-xl mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-5 flex justify-center w-full px-3 py-3 rounded-lg border border-white/30 transition-all duration-200 hover:scale-105 glass-button text-white text-3xl hover:text-white hover:bg-white/15 hover:border-white/40 shadow-lg disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block text-white text-2xl mb-2" htmlFor="reg-username">
                Username
              </label>
              <input
                type="text"
                id="reg-username"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                className={`w-full glass-input px-4 py-2 text-2xl rounded-lg focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-200 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.username && <p className="text-red-500 text-xl mt-1">{errors.username}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-white text-2xl mb-2" htmlFor="reg-email">
                Email
              </label>
              <input
                type="email"
                id="reg-email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                className={`w-full glass-input px-4 py-2 text-2xl rounded-lg focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-200 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.email && <p className="text-red-500 text-xl mt-1">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-white text-2xl mb-2" htmlFor="reg-password">
                Password
              </label>
              <input
                type="password"
                id="reg-password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                className={`w-full glass-input px-4 py-2 text-2xl rounded-lg focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-200 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.password && <p className="text-red-500 text-xl mt-1">{errors.password}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-white text-2xl mb-2" htmlFor="reg-confirmPassword">
                Confirm Password
              </label>
              <input
                type="password"
                id="reg-confirmPassword"
                name="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                className={`w-full glass-input px-4 py-2 text-2xl rounded-lg focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-200 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xl mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-5 flex justify-center w-full px-3 py-3 rounded-lg border border-white/30 transition-all duration-200 hover:scale-105 glass-button text-white text-3xl hover:text-white hover:bg-white/15 hover:border-white/40 shadow-lg disabled:opacity-50"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}