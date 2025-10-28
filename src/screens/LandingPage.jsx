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
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
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
          <p className="text-sm text-green-800 font-medium">
            • 1/10th the cost, fewer apps, less admin.
          </p>
          <p className="text-sm text-green-800 font-medium">
            • More control, less risk, no vendor lock-in.
          </p>
          <p className="text-sm text-green-800 font-medium">
            • Scale like a house of brands—focus on growth.
          </p>
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

// Showcase Section
const ShowcaseSection = () => (
  <div className="bg-white rounded-2xl p-8 mx-4 shadow-lg mb-8">
    <h2 className="text-3xl font-bold text-indigo-900 text-center mb-6">
      How It Works for D2C Brands
    </h2>
    
    <div className="grid md:grid-cols-3 gap-8 mb-8">
      <div className="bg-yellow-50 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold text-indigo-900 mb-3">
          Copilot for Delivery Updates
        </h3>
        <p className="text-sm text-gray-700">
          Copilot reads all delivery updates from mail and takes action. It categorizes, prioritizes, and assigns the right agent.
        </p>
      </div>

      <div className="bg-blue-50 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold text-indigo-900 mb-3">
          AI Agent for Website Visitors
        </h3>
        <p className="text-sm text-gray-700">
          AI agent completes tasks and notifies your team. For example, detects cart abandonment and can call to increase sales.
        </p>
      </div>

      <div className="bg-green-50 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold text-indigo-900 mb-3">
          Configure Multiple Stores
        </h3>
        <p className="text-sm text-gray-700">
          D2C Copilot is decoupled from store, so you can manage orders, inventory, and shipping for multiple stores in one place.
        </p>
      </div>
    </div>

    <AudioPlayer />
  </div>
);

// Industry Solutions
const IndustrySolutions = () => {
  const solutions = [
    { icon: '🏥', title: 'Healthcare', metrics: '40% faster response', description: 'Automated appointment reminders' },
    { icon: '🛍️', title: 'E-commerce', metrics: '3x lead coverage', description: 'Smart cart abandonment recovery' },
    { icon: '💰', title: 'Finance', metrics: '98% completion', description: 'Automated payment reminders' },
    { icon: '📚', title: 'Education', metrics: '50% cost reduction', description: 'Student enrollment automation' },
  ];

  return (
    <div className="bg-white rounded-2xl p-8 mx-4 shadow-lg mb-8">
      <h2 className="text-3xl font-bold text-indigo-900 text-center mb-8">Industry Solutions</h2>
      <div className="grid md:grid-cols-4 gap-6">
        {solutions.map((solution, idx) => (
          <AnimatedCard key={idx} delay={idx * 120}>
            <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200 hover:scale-105">
              <div className="text-4xl mb-4">{solution.icon}</div>
              <h3 className="text-xl font-bold text-indigo-900 mb-2">{solution.title}</h3>
              <p className="text-blue-600 font-semibold mb-2">{solution.metrics}</p>
              <p className="text-sm text-gray-700">{solution.description}</p>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
};

// Features Section
const FeaturesSection = () => {
  const features = [
    { title: 'Smart Lead Prioritization', description: 'AI-driven scoring to call high-potential leads first', icon: '⭐' },
    { title: 'Multi-Language Support', description: 'Engage customers in their preferred language', icon: '🌐' },
    { title: 'Automated Follow-ups', description: 'Schedule and execute follow-up calls automatically', icon: '🔄' },
    { title: 'CRM Integration', description: 'Seamless integration with your existing CRM', icon: '🔗' },
  ];

  return (
    <div className="bg-white rounded-2xl p-8 mx-4 shadow-lg mb-8">
      <h2 className="text-3xl font-bold text-indigo-900 text-center mb-8">Outbound Calling Features</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => (
          <AnimatedCard key={idx} delay={idx * 120}>
            <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200 hover:scale-105">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold text-indigo-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-700">{feature.description}</p>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
};

// Metrics Section
const MetricsSection = () => {
  const metrics = [
    { metric: '98%', label: 'Call Completion Rate' },
    { metric: '45%', label: 'Cost Reduction' },
    { metric: '3x', label: 'Lead Coverage' },
    { metric: '24/7', label: 'Operation Hours' },
  ];

  return (
    <div className="bg-white rounded-2xl p-8 mx-4 shadow-lg mb-8">
      <h2 className="text-3xl font-bold text-indigo-900 text-center mb-8">Performance Metrics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map((stat, idx) => (
          <AnimatedCard key={idx} delay={idx * 100}>
            <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200 hover:scale-105">
              <div className="text-3xl font-bold text-indigo-900 mb-2">{stat.metric}</div>
              <div className="text-sm text-gray-700">{stat.label}</div>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
};

// Contact Form Modal
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={28} />
        </button>
        <h2 className="text-2xl font-bold text-indigo-900 mb-6">Contact Us</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Your Message"
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

// Drag Up Hint
const DragUpHint = ({ onPress, visible }) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-40 pointer-events-none">
      <button
        onClick={onPress}
        className="pointer-events-auto animate-bounce bg-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            🦙
          </div>
          <ChevronUp size={36} className="text-blue-600" />
          <span className="text-blue-600 font-bold text-sm">Explore More</span>
        </div>
      </button>
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

// Main Landing Page
const LandingPage = () => {
  const [showAllSections, setShowAllSections] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  const handleLogin = () => {
    console.log('Navigate to login');
  };

  const scrollToNext = () => {
    if (!showAllSections) {
      setShowAllSections(true);
    }
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-300">
      {/* Header */}
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

      {/* Main Content */}
      <main className="pb-24">
        <HeroSection />
        <ShowcaseSection />

        {showAllSections && (
          <>
            <IndustrySolutions />
            <FeaturesSection />
            <MetricsSection />
          </>
        )}
      </main>

      {/* Floating Elements */}
      <DragUpHint onPress={scrollToNext} visible={!showAllSections} />
      <FloatingContactButton onClick={() => setShowContactModal(true)} />

      {/* Contact Modal */}
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-sm">This website uses cookies to ensure you get the best experience.</p>
          <button
            onClick={() => setShowCookieBanner(false)}
            className="bg-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Accept
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
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

export default LandingPage;