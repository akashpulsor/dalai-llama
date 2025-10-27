import React, { useState, useEffect } from 'react';
import { ChevronUp, Play, StopCircle, MessageCircle, X } from 'lucide-react';

// Animated Card Component
const AnimatedCard = ({ children, delay = 0, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Hero Section
const HeroSection = () => (
  <AnimatedCard className="text-center py-8 px-4">
    <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-4 tracking-tight">
      Your D2C Copilot: Automate, Save, and Scale
    </h1>
    <p className="text-xl text-gray-700 mb-8 font-medium max-w-4xl mx-auto">
      AI automates returns, fraud, logistics, competitor analysis, and more—so you can focus on growth.
    </p>

    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-8">
      <div className="bg-yellow-50 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-bold text-indigo-900 mb-4">The Challenge</h3>
        <div className="space-y-3 text-left">
          <p className="text-sm text-yellow-800 font-medium">
            Too many apps for RTO, fraud, notifications = high costs, complexity, and data sharing.
          </p>
          <p className="text-sm text-yellow-800 font-medium">
            Every new problem adds another app, creating more risk and dependency.
          </p>
          <p className="text-sm text-yellow-800 font-medium">
            Hard to scale like big brands due to tool limitations.
          </p>
          <p className="text-sm text-yellow-800 font-medium">
            Vendor lock-in limits your control and flexibility.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-bold text-indigo-900 mb-4">The Solution</h3>
        <div className="space-y-3 text-left">
          <p className="text-sm text-blue-800 font-medium">
            • D2C Copilot: AI + Email + Shopify webhooks = one smart system.
          </p>
          <p className="text-sm text-blue-800 font-medium">
            • Unified automation: fraud, RTO, competition, notifications.
          </p>
          <p className="text-sm text-blue-800 font-medium">
            • Branded voice notifications: engage & subsidize logistics.
          </p>
          <p className="text-sm text-blue-800 font-medium">
            • Open, flexible platform: no vendor lock-in.
          </p>
        </div>
      </div>

      <div className="bg-green-50 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-bold text-indigo-900 mb-4">The Result</h3>
        <div className="space-y-3 text-left">
          <p className="text-sm text-green-800 font-medium">• 1/10th the cost, fewer apps, less admin.</p>
          <p className="text-sm text-green-800 font-medium">• More control, less risk, no vendor lock-in.</p>
          <p className="text-sm text-green-800 font-medium">• Scale like a house of brands—focus on growth.</p>
        </div>
      </div>
    </div>
  </AnimatedCard>
);

// Audio Player Component
const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log('Audio playback:', !isPlaying ? 'playing' : 'stopped');
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-md">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePlayPause}
          className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all duration-200 hover:scale-105"
        >
          {isPlaying ? <StopCircle size={32} /> : <Play size={32} />}
          <span className="font-bold text-lg">{isPlaying ? 'Stop' : 'Play'} Sample</span>
        </button>

        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-indigo-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hindi">Hindi</option>
          <option value="english">English</option>
        </select>
      </div>
    </div>
  );
};

// Floating Contact Button
const FloatingContactButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full px-6 py-3 shadow-2xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 z-50 hover:scale-105"
  >
    <MessageCircle size={24} />
    <span className="font-bold">Contact Us</span>
  </button>
);

// Contact Modal
const ContactModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X size={28} />
        </button>
        <h2 className="text-2xl font-bold text-indigo-900 mb-6">Contact Us</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Your Message"
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

// Main Landing Page
const LandingPage = () => {
  const [showContactModal, setShowContactModal] = useState(false);

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-300">
      <header className="bg-transparent p-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 bg-purple-200 rounded-full flex items-center justify-center text-4xl">
            🦙
          </div>
          <h1 className="text-2xl font-bold text-white">Dalai Llama</h1>
        </div>
        <button
          onClick={handleLogin}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
        >
          Login
        </button>
      </header>

      <main className="pb-24">
        <HeroSection />
        <AudioPlayer />
      </main>

      <FloatingContactButton onClick={() => setShowContactModal(true)} />
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
};

export default LandingPage;
