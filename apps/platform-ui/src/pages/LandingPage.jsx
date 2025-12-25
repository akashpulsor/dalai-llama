// @ts-check
// apps/platform-ui/src/pages/LandingPage.jsx
import React, { useState, useEffect } from "react";
import { Play, StopCircle, MessageCircle, X } from "lucide-react";
import { useInitiateLoginMutation } from "@dalaillama/shared-hooks/keycloakApi";
import { appConfig } from "@dalaillama/shared-config";

/**
 * @typedef {Object} AnimatedCardProps
 * @property {React.ReactNode} children
 * @property {number} [delay]
 * @property {string} [className]
 */

/**
 * Animated fade-in wrapper
 * @param {AnimatedCardProps} props
 * @returns {React.ReactElement}
 */
const AnimatedCard = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
};


const HeroSection = () => (
  <AnimatedCard className="text-center py-8 px-4">
    <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-4 tracking-tight">
      Your D2C Copilot: Automate, Save, and Scale
    </h1>
    <p className="text-xl text-gray-700 mb-8 font-medium max-w-4xl mx-auto">
      AI automates returns, fraud, logistics, competitor analysis, and more—so you can focus on growth.
    </p>
  </AnimatedCard>
);


const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("english");

  /**
   * Toggle play/pause state
   * @returns {void}
   */
  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  /**
   * Handle language change
   * @param {React.ChangeEvent<HTMLSelectElement>} e
   * @returns {void}
   */
  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-md">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePlayPause}
          className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all"
        >
          {isPlaying ? <StopCircle size={32} /> : <Play size={32} />}
          <span className="font-bold text-lg">{isPlaying ? "Stop" : "Play"} Sample</span>
        </button>
        <select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-indigo-900 font-semibold"
        >
          <option value="hindi">Hindi</option>
          <option value="english">English</option>
        </select>
      </div>
    </div>
  );
};

/**
 * @typedef {Object} FloatingContactButtonProps
 * @property {() => void} onClick
 */

/**
 * Floating contact button
 * @param {FloatingContactButtonProps} props
 
 */
const FloatingContactButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full px-6 py-3 shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-2 z-50"
  >
    <MessageCircle size={24} />
    <span className="font-bold">Contact Us</span>
  </button>
);

/**
 * @typedef {Object} ContactModalProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 */

/**
 * @typedef {Object} ContactFormData
 * @property {string} name
 * @property {string} email
 * @property {string} message
 */

/**
 * Contact modal component
 * @param {ContactModalProps} props
 
 */
const ContactModal = ({ isOpen, onClose }) => {
  /** @type {ContactFormData} */
  const initialFormData = { name: "", email: "", message: "" };
  const [formData, setFormData] = useState(initialFormData);

  if (!isOpen) return null;

  /**
   * Handle form submission
   * @param {React.FormEvent<HTMLFormElement>} e
   * @returns {void}
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setFormData(initialFormData);
    onClose();
  };

  /**
   * Handle input change
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e
   * @returns {void}
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X size={28} />
        </button>
        <h2 className="text-2xl font-bold text-indigo-900 mb-6">Contact Us</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
          />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};


const LandingPage = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [initiateLogin] = useInitiateLoginMutation();

  /**
   * Handle login - redirects to Keycloak
   * @returns {void}
   */
  const handleLogin = () => {
      console.log("Login clicked");
  console.log("Keycloak URL:", appConfig.KEYCLOAK_URL);
  console.log("Realm:", appConfig.KEYCLOAK_REALM);
  console.log("Client:", appConfig.KEYCLOAK_CLIENT);
    initiateLogin({});
  };

  /**
   * Open contact modal
   * @returns {void}
   */
  const openContactModal = () => {
    setShowContactModal(true);
  };

  /**
   * Close contact modal
   * @returns {void}
   */
  const closeContactModal = () => {
    setShowContactModal(false);
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

      <FloatingContactButton onClick={openContactModal} />
      <ContactModal isOpen={showContactModal} onClose={closeContactModal} />
    </div>
  );
};

export default LandingPage;