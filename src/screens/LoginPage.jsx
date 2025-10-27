/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Home, User, Key, X } from 'lucide-react';

// ✅ Floating Action Button Component (fixed icon warning)
const FloatingActionButton = ({ icon, label, onPress, className = '' }) => (
  <button
    onClick={onPress}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${className}`}
  >
    {icon && React.createElement(icon, { size: 20 })}
    <span>{label}</span>
  </button>
);

// ✅ Input Field Component
const InputField = ({ type = 'text', placeholder, value, onChange, error, icon }) => (
  <div className="w-full">
    <div className="relative">
      {icon && (
        React.createElement(icon, {
          className: 'absolute left-4 top-1/2 -translate-y-1/2 text-purple-400',
          size: 20,
        })
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border-2 rounded-2xl p-4 mb-3 text-base bg-[#f8fafd] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
          icon ? 'pl-12' : ''
        } ${error ? 'border-red-500 bg-red-50' : 'border-[#e3e8fd]'}`}
      />
    </div>
  </div>
);

// ✅ Modal Component
const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-600 hover:text-purple-800 transition-colors"
        >
          <X size={28} />
        </button>
        {title && <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">{title}</h2>}
        {children}
      </div>
    </div>
  );
};

// ✅ Animated Mascot Component
const AnimatedMascot = () => {
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBounce((prev) => (prev === 0 ? -10 : 0));
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="w-20 h-20 bg-purple-200 rounded-full flex items-center justify-center text-5xl mb-4 transition-transform duration-700"
      style={{ transform: `translateY(${bounce}px)` }}
    >
      🦙
    </div>
  );
};

// ✅ Error Message Component
const ErrorMessage = ({ message }) => (
  <div className="text-red-500 text-sm text-center mb-4 p-2 bg-red-50 rounded-lg">
    {message}
  </div>
);

// ✅ Button Component
const Button = ({ children, onClick, disabled, loading, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`w-full bg-purple-600 text-white font-bold py-4 rounded-2xl text-lg shadow-lg hover:bg-purple-700 transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {loading ? (
      <div className="flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    ) : (
      children
    )}
  </button>
);

// ✅ Registration Form Component (Placeholder)
const RegistrationForm = () => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold text-purple-700 mb-4">Create Account</h3>
    <InputField placeholder="Full Name" value="" onChange={() => {}} />
    <InputField placeholder="Email" type="email" value="" onChange={() => {}} />
    <InputField placeholder="Password" type="password" value="" onChange={() => {}} />
    <InputField placeholder="Confirm Password" type="password" value="" onChange={() => {}} />
    <Button onClick={() => {}}>Register</Button>
  </div>
);

// ✅ Reset Password Form Component (Placeholder)
const ResetPasswordForm = () => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold text-blue-600 mb-4">Reset Password</h3>
    <InputField placeholder="Enter your email" type="email" value="" onChange={() => {}} />
    <Button onClick={() => {}} className="bg-blue-600 hover:bg-blue-700">
      Send Reset Link
    </Button>
  </div>
);

// ✅ Main Login Component
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    setShowError(false);

    if (!email || !validateEmail(email)) {
      setShowError(true);
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (!password) {
      setShowError(true);
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowError(true);
      setErrorMessage('Demo mode - Login functionality not connected');
    }, 1500);
  };

  const handleBackToHome = () => {
    console.log('Navigate to landing page');
  };

  return (
    <div className="min-h-screen bg-[#d3d3d3] flex items-center justify-center p-4 relative">
      {/* Back Button */}
      <button
        onClick={handleBackToHome}
        className="absolute top-4 left-4 md:top-8 md:left-6 flex items-center gap-2 bg-white px-4 py-2 md:px-6 md:py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-purple-200 hover:scale-105"
      >
        <Home size={18} className="text-purple-600 md:hidden" />
        <Home size={20} className="text-purple-600 hidden md:block" />
        <span className="text-purple-600 font-bold text-base md:text-lg">Home</span>
      </button>

      {/* Login Card */}
      <div className="bg-white bg-opacity-90 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl mt-20 md:mt-16 mx-4">
        <AnimatedMascot />

        <h1 className="text-3xl font-bold text-purple-600 text-center mb-1 tracking-wide">
          Welcome to Dalai Llama 🦙
        </h1>

        <p className="text-center text-gray-700 font-medium mb-6">
          AI Outbound Calling Platform
        </p>

        <div className="space-y-3 mb-6">
          <InputField
            type="email"
            placeholder="Email"
            value={email}
            onChange={setEmail}
            error={showError && !validateEmail(email)}
          />
          <InputField
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
            error={showError && !password}
          />

          {showError && <ErrorMessage message={errorMessage} />}
        </div>

        <Button onClick={handleLogin} loading={isLoading}>
          Login
        </Button>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <FloatingActionButton
            icon={User}
            label="Register"
            onPress={() => setShowRegisterModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          />
          <FloatingActionButton
            icon={Key}
            label="Forgot Password?"
            onPress={() => setShowResetModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          />
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Create Account"
      >
        <RegistrationForm />
      </Modal>

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Password"
      >
        <ResetPasswordForm />
      </Modal>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
