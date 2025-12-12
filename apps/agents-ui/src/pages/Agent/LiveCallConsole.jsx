import React, { useState, useEffect, useRef } from "react";
import {
  PhoneCall,
  PhoneOff,
  Loader2,
  Globe,
  Bot,
  Mic,
  Volume2,
  User,
  CheckCircle2,
  Phone,
} from "lucide-react";

/**
 * @typedef {'incoming' | 'fetching-lead' | 'loading-web' | 'call-live' | 'acw'} CallPhase
 */

/**
 * @typedef {Object} TranscriptLine
 * @property {'customer' | 'agent'} speaker - The speaker type
 * @property {string} text - The spoken text
 * @property {number} timestamp - When the line was spoken
 */

/**
 * @typedef {Object} AISuggestion
 * @property {string} text - The suggestion text
 * @property {'response' | 'action' | 'info'} type - The suggestion type
 * @property {number} timestamp - When the suggestion was made
 */

/**
 * @typedef {Object} CustomerData
 * @property {string} name - Customer name
 * @property {string} phone - Customer phone number
 * @property {string} location - Customer location
 * @property {number} previousInteractions - Number of previous interactions
 * @property {number} leadScore - Lead score out of 100
 */

/**
 * @typedef {Object} BeepConfig
 * @property {number} frequency - Frequency in Hz
 * @property {number} duration - Duration in seconds
 */

/**
 * @typedef {HTMLAudioElement & { beepConfig?: BeepConfig, ringInterval?: NodeJS.Timeout }} ExtendedAudioElement
 */

/**
 * LiveCallConsole Component
 * 
 * A comprehensive live call interface that simulates an AI-powered contact center
 * agent console with real-time transcription, AI suggestions, and workflow automation.
 * 
 * Flow:
 * 1. incoming - Call is coming in with ringing sound
 * 2. fetching-lead - Agent accepts, fetching customer details from CRM
 * 3. loading-web - Searching web for additional customer context
 * 4. call-live - Live call with real-time transcript and AI suggestions
 * 5. acw - After Call Work with LLM-generated summary
 * 
 * @returns {React.ReactElement} The live call console interface
 */
export default function LiveCallConsole() {
  /** @type {[CallPhase, React.Dispatch<React.SetStateAction<CallPhase>>]} */
  const [phase, setPhase] = useState(/** @type {CallPhase} */('incoming'));
  
  /** @type {[TranscriptLine[], React.Dispatch<React.SetStateAction<TranscriptLine[]>>]} */
  const [transcript, setTranscript] = useState(/** @type {TranscriptLine[]} */([]));
  
  /** @type {[AISuggestion[], React.Dispatch<React.SetStateAction<AISuggestion[]>>]} */
  const [aiSuggestions, setAiSuggestions] = useState(/** @type {AISuggestion[]} */([]));
  
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [summarySaved, setSummarySaved] = useState(false);
  
  /** @type {[CustomerData | null, React.Dispatch<React.SetStateAction<CustomerData | null>>]} */
  const [customerData, setCustomerData] = useState(/** @type {CustomerData | null} */(null));

  // Audio references for sound effects
  /** @type {React.MutableRefObject<ExtendedAudioElement | null>} */
  const ringtoneRef = useRef(null);
  
  /** @type {React.MutableRefObject<ExtendedAudioElement | null>} */
  const connectSoundRef = useRef(null);
  
  /** @type {React.MutableRefObject<ExtendedAudioElement | null>} */
  const disconnectSoundRef = useRef(null);
  
  /** @type {React.MutableRefObject<ExtendedAudioElement | null>} */
  const notificationSoundRef = useRef(null);

  /* -----------------------------------------------------
   * INITIALIZE AUDIO ELEMENTS
   * ----------------------------------------------------- */
  useEffect(() => {
    // Create audio elements for different sounds
    ringtoneRef.current = /** @type {ExtendedAudioElement} */(new Audio());
    ringtoneRef.current.loop = true;
    
    connectSoundRef.current = /** @type {ExtendedAudioElement} */(new Audio());
    disconnectSoundRef.current = /** @type {ExtendedAudioElement} */(new Audio());
    notificationSoundRef.current = /** @type {ExtendedAudioElement} */(new Audio());

    // Using data URIs for simple beep sounds (you can replace with actual audio files)
    createBeepSound(ringtoneRef.current, 440, 0.5);
    createBeepSound(connectSoundRef.current, 800, 0.3);
    createBeepSound(disconnectSoundRef.current, 400, 0.3);
    createBeepSound(notificationSoundRef.current, 600, 0.2);

    return () => {
      // Cleanup
      stopAllSounds();
    };
  }, []);

  /**
   * Creates a simple beep sound using Web Audio API
   * @param {ExtendedAudioElement} audioElement - The audio element to populate
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   */
  const createBeepSound = (audioElement, frequency, duration) => {
    const AudioContextClass = window.AudioContext || (/** @type {any} */(window)).webkitAudioContext;
    if (!AudioContextClass) return;
    
    // Store config for later use
    audioElement.beepConfig = { frequency, duration };
  };

  /**
   * Plays a beep sound
   * @param {ExtendedAudioElement} audioElement - The audio element to play
   */
  const playBeep = (audioElement) => {
    if (!audioElement.beepConfig) return;
    
    const { frequency, duration } = audioElement.beepConfig;
    const AudioContextClass = window.AudioContext || (/** @type {any} */(window)).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };

  /**
   * Stops all currently playing sounds
   */
  const stopAllSounds = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      if (ringtoneRef.current.ringInterval) {
        clearInterval(ringtoneRef.current.ringInterval);
      }
    }
  };

  /* -----------------------------------------------------
   * PHASE TRANSITION FLOW
   * ----------------------------------------------------- */
  useEffect(() => {
    if (phase === "incoming") {
      // Play ringtone
      playRingtone();
    }

    if (phase === "fetching-lead") {
      stopAllSounds();
      if (connectSoundRef.current) {
        playBeep(connectSoundRef.current);
      }
      setTimeout(() => {
        // Simulate fetching customer data
        setCustomerData({
          name: "Rajesh Kumar",
          phone: "+91 98765 43210",
          location: "Mumbai, Maharashtra",
          previousInteractions: 3,
          leadScore: 85,
        });
        setPhase("loading-web");
      }, 2000);
    }

    if (phase === "loading-web") {
      setTimeout(() => setPhase("call-live"), 2500);
    }

    if (phase === "call-live") {
      startFakeTranscriptStream();
      startFakeAISuggestions();
    }

    if (phase === "acw") {
      if (disconnectSoundRef.current) {
        playBeep(disconnectSoundRef.current);
      }
      setTimeout(() => {
        setSummarySaved(true);
      }, 3000);
    }
  }, [phase]);

  /**
   * Plays the incoming call ringtone
   */
  const playRingtone = () => {
    if (!ringtoneRef.current) return;
    
    // Play ringtone with intervals to simulate ringing pattern
    const ringInterval = setInterval(() => {
      if (ringtoneRef.current) {
        playBeep(ringtoneRef.current);
      }
    }, 2000);

    // Store interval to clear later
    ringtoneRef.current.ringInterval = ringInterval;
  };

  /**
   * Handles accepting an incoming call
   */
  const acceptCall = () => {
    stopAllSounds();
    setPhase("fetching-lead");
  };

  /* -----------------------------------------------------
   * TRANSCRIPT STREAM SIMULATION
   * ----------------------------------------------------- */
  /**
   * Simulates real-time transcript streaming during a live call
   */
  const startFakeTranscriptStream = () => {
    const lines = [
      { speaker: /** @type {'customer'} */('customer'), text: "Hello, I received a missed call from you?", delay: 1000 },
      { speaker: /** @type {'agent'} */('agent'), text: "Hi, this is Akash from DalaiLlama Contact Center. How are you doing today?", delay: 2000 },
      { speaker: /** @type {'customer'} */('customer'), text: "I'm good. Yes, I was checking loan options for my new business.", delay: 2500 },
      { speaker: /** @type {'agent'} */('agent'), text: "Excellent! I'd be happy to help you explore our business loan options.", delay: 2000 },
      { speaker: /** @type {'customer'} */('customer'), text: "What's the rate of interest? And what documents do I need?", delay: 3000 },
      { speaker: /** @type {'agent'} */('agent'), text: "Our rates start from 9.5% per annum. For documents, we'll need your business registration, last 6 months bank statements, and ITR for 2 years.", delay: 3500 },
      { speaker: /** @type {'customer'} */('customer'), text: "That sounds reasonable. What's the maximum loan amount I can get?", delay: 2500 },
      { speaker: /** @type {'agent'} */('agent'), text: "Based on your profile, you can get up to ₹50 lakhs with a flexible tenure of 1-5 years.", delay: 2500 },
      { speaker: /** @type {'customer'} */('customer'), text: "Great! Can you send me the application form?", delay: 2000 },
      { speaker: /** @type {'agent'} */('agent'), text: "Absolutely! I'm sending it to your email right now. You should receive it within 2 minutes.", delay: 2000 },
    ];

    let index = 0;
    
    /**
     * Recursively adds transcript lines with realistic delays
     */
    const addNextLine = () => {
      if (index < lines.length) {
        const line = lines[index];
        setTranscript((prev) => [
          ...prev,
          {
            speaker: line.speaker,
            text: line.text,
            timestamp: Date.now(),
          },
        ]);
        
        // Play notification for new messages
        if (line.speaker === "customer" && notificationSoundRef.current) {
          playBeep(notificationSoundRef.current);
        }
        
        index++;
        setTimeout(addNextLine, line.delay);
      }
    };

    setTimeout(addNextLine, 1000);
  };

  /* -----------------------------------------------------
   * AI SUGGESTIONS STREAM SIMULATION
   * ----------------------------------------------------- */
  /**
   * Simulates real-time AI suggestions based on customer queries
   */
  const startFakeAISuggestions = () => {
    const suggestions = [
      { text: "Customer asking about loan - prepare to discuss interest rates and terms", type: /** @type {'info'} */('info'), delay: 3000 },
      { text: "Suggest: 'Our business loans start at 9.5% with flexible repayment options'", type: /** @type {'response'} */('response'), delay: 5000 },
      { text: "Customer interested in documentation - mention simplified digital process", type: /** @type {'action'} */('action'), delay: 8000 },
      { text: "Suggest: Ask about business type and turnover to provide personalized loan amount", type: /** @type {'response'} */('response'), delay: 11000 },
      { text: "High engagement detected - opportunity to close. Offer to send application form", type: /** @type {'action'} */('action'), delay: 15000 },
      { text: "Suggest: 'I can email you the form right away, and our team will assist you through the process'", type: /** @type {'response'} */('response'), delay: 17000 },
    ];

    let idx = 0;
    
    /**
     * Recursively adds AI suggestions with realistic delays
     */
    const addNextSuggestion = () => {
      if (idx < suggestions.length) {
        const suggestion = suggestions[idx];
        setAiSuggestions((prev) => [
          ...prev,
          {
            text: suggestion.text,
            type: suggestion.type,
            timestamp: Date.now(),
          },
        ]);
        
        if (notificationSoundRef.current) {
          playBeep(notificationSoundRef.current);
        }
        idx++;
        setTimeout(addNextSuggestion, suggestion.delay);
      }
    };

    setTimeout(addNextSuggestion, 2000);
  };

  /* -----------------------------------------------------
   * CALL CONTROL HANDLERS
   * ----------------------------------------------------- */
  /**
   * Handles ending the call and transitioning to ACW phase
   */
  const endCall = () => {
    setPhase("acw");
  };

  /**
   * Toggles microphone mute (simulated)
   */
  const toggleMute = () => {
    // Simulate mute toggle
    console.log("Microphone toggled");
  };

  /**
   * Toggles speaker volume (simulated)
   */
  const toggleSpeaker = () => {
    // Simulate speaker toggle
    console.log("Speaker toggled");
  };

  /* -----------------------------------------------------
   * UI HELPERS
   * ----------------------------------------------------- */
  /**
   * Gets the title for the current phase
   * @type {string}
   */
  const PhaseTitle = {
    incoming: "Incoming Call…",
    "fetching-lead": "Fetching Customer Details from CRM…",
    "loading-web": "Searching the web for context…",
    "call-live": "Call Live — Real-Time Transcript & AI Assistance",
    acw: "After Call Work (ACW) — Generating Summary",
  }[phase];

  /**
   * Gets the appropriate styling class for suggestion type
   * @param {'response' | 'action' | 'info'} type - The suggestion type
   * @returns {string} Tailwind CSS classes
   */
  const getSuggestionStyle = (type) => {
    switch (type) {
      case "response":
        return "bg-green-50 border-green-300";
      case "action":
        return "bg-blue-50 border-blue-300";
      case "info":
        return "bg-yellow-50 border-yellow-300";
      default:
        return "bg-white border-purple-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <h1 className="text-4xl font-bold text-purple-700 mb-6 flex items-center gap-3">
        <Phone className="animate-pulse" />
        Live Call Console
      </h1>

      <div className="bg-white rounded-3xl shadow-2xl border border-purple-200 p-6 grid grid-cols-12 gap-6">
        {/* ------------------------------------------------------------
           LEFT SECTION — Transcript + Stages
        ------------------------------------------------------------- */}
        <div className="col-span-8">
          <div className="flex items-center gap-3 mb-4">
            {phase !== "acw" && phase !== "incoming" && (
              <Loader2 className="text-purple-600 animate-spin" size={22} />
            )}
            <h2 className="text-xl font-semibold text-purple-700">
              {PhaseTitle}
            </h2>
          </div>

          {/* INCOMING CALL */}
          {phase === "incoming" && (
            <IncomingCallScreen onAccept={acceptCall} />
          )}

          {/* CRM LOADING */}
          {phase === "fetching-lead" && (
            <LeadLoader icon={User} text="Pulling lead from CRM…" />
          )}

          {/* WEB LOADING */}
          {phase === "loading-web" && (
            <>
              <LeadLoader icon={Globe} text="Analyzing customer from web…" />
              {customerData && (
                <CustomerInfoCard customerData={customerData} />
              )}
            </>
          )}

          {/* LIVE TRANSCRIPT */}
          {phase === "call-live" && (
            <>
              {customerData && (
                <CustomerInfoCard customerData={customerData} />
              )}
              <div className="bg-gradient-to-b from-purple-50 to-white h-96 overflow-y-auto p-5 rounded-2xl border-2 border-purple-200 shadow-inner mt-4">
                {transcript.length === 0 && (
                  <p className="text-gray-400 italic">Waiting for conversation to start…</p>
                )}
                {transcript.map((line, i) => (
                  <TranscriptLine key={i} line={line} />
                ))}
              </div>
            </>
          )}

          {/* ACW */}
          {phase === "acw" && (
            <ACWSummaryPanel summarySaved={summarySaved} />
          )}
        </div>

        {/* ------------------------------------------------------------
           RIGHT SECTION — AI Suggestions + Controls
        ------------------------------------------------------------- */}
        <div className="col-span-4 flex flex-col gap-4">
          <div className="bg-gradient-to-b from-purple-100 to-purple-50 border-2 border-purple-300 rounded-2xl p-4 h-96 overflow-y-auto shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={22} className="text-purple-700 animate-pulse" />
              <h3 className="text-lg font-semibold text-purple-700">
                AI Real-Time Suggestions
              </h3>
            </div>

            {aiSuggestions.length === 0 && phase === "call-live" && (
              <p className="text-gray-500 italic">Listening to conversation…</p>
            )}

            {aiSuggestions.map((suggestion, idx) => (
              <AISuggestionCard
                key={idx}
                suggestion={suggestion}
                style={getSuggestionStyle(suggestion.type)}
              />
            ))}
          </div>

          {/* CALL CONTROLS */}
          {phase === "call-live" && (
            <CallControlPanel
              onMuteToggle={toggleMute}
              onSpeakerToggle={toggleSpeaker}
              onEndCall={endCall}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------
   SUB-COMPONENTS
----------------------------------------------------- */

/**
 * Displays incoming call screen with accept button
 * @param {Object} props
 * @param {() => void} props.onAccept - Callback when call is accepted
 * @returns {React.ReactElement}
 */
const IncomingCallScreen = ({ onAccept }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border-2 border-green-300 animate-pulse">
      <PhoneCall size={80} className="text-green-600 mb-6 animate-bounce" />
      <h2 className="text-2xl font-bold text-green-800 mb-2">Incoming Call</h2>
      <p className="text-green-700 mb-6">+91 98765 43210</p>
      <button
        onClick={onAccept}
        className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold text-lg shadow-lg transform transition hover:scale-105 flex items-center gap-3"
      >
        <Phone size={24} />
        Accept Call
      </button>
    </div>
  );
};

/**
 * Loading indicator component
 * @param {Object} props
 * @param {React.ComponentType<{size?: number, className?: string}>} props.icon - Lucide icon component
 * @param {string} props.text - Loading text to display
 * @returns {React.ReactElement}
 */
const LeadLoader = ({ icon: Icon, text }) => {
  return (
    <div className="flex items-center gap-3 text-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200 shadow-md animate-fadeIn">
      <Loader2 size={24} className="animate-spin text-purple-600" />
      <Icon size={24} className="text-purple-700" />
      <span className="font-medium">{text}</span>
    </div>
  );
};

/**
 * Displays customer information card
 * @param {Object} props
 * @param {CustomerData} props.customerData - Customer data object
 * @returns {React.ReactElement}
 */
const CustomerInfoCard = ({ customerData }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border-2 border-indigo-200 mt-4 shadow-md animate-fadeIn">
      <h3 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
        <User size={20} />
        Customer Profile
      </h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-600 font-medium">Name</p>
          <p className="text-gray-900 font-semibold">{customerData.name}</p>
        </div>
        <div>
          <p className="text-gray-600 font-medium">Phone</p>
          <p className="text-gray-900 font-semibold">{customerData.phone}</p>
        </div>
        <div>
          <p className="text-gray-600 font-medium">Location</p>
          <p className="text-gray-900">{customerData.location}</p>
        </div>
        <div>
          <p className="text-gray-600 font-medium">Lead Score</p>
          <p className="text-green-600 font-bold">{customerData.leadScore}/100</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders a single transcript line
 * @param {Object} props
 * @param {TranscriptLine} props.line - The transcript line object
 * @returns {React.ReactElement}
 */
const TranscriptLine = ({ line }) => {
  const isCustomer = line.speaker === "customer";
  
  return (
    <div className={`mb-4 animate-fadeIn ${isCustomer ? "text-left" : "text-right"}`}>
      <div
        className={`inline-block max-w-[80%] p-3 rounded-2xl shadow-sm ${
          isCustomer
            ? "bg-white border border-gray-200 text-gray-800"
            : "bg-purple-600 text-white"
        }`}
      >
        <p className="text-xs font-semibold mb-1 opacity-70">
          {isCustomer ? "Customer" : "Agent (You)"}
        </p>
        <p className="text-sm leading-relaxed">{line.text}</p>
      </div>
    </div>
  );
};

/**
 * Displays an AI suggestion card
 * @param {Object} props
 * @param {AISuggestion} props.suggestion - The suggestion object
 * @param {string} props.style - Additional CSS classes
 * @returns {React.ReactElement}
 */
const AISuggestionCard = ({ suggestion, style }) => {
  return (
    <div
      className={`p-3 rounded-xl shadow-md mt-3 border-2 animate-fadeIn ${style}`}
    >
      <div className="flex items-start gap-2">
        <Bot size={16} className="mt-1 flex-shrink-0" />
        <p className="text-sm leading-relaxed">{suggestion.text}</p>
      </div>
    </div>
  );
};

/**
 * Call control panel with mute, speaker, and end call buttons
 * @param {Object} props
 * @param {() => void} props.onMuteToggle - Callback for mute toggle
 * @param {() => void} props.onSpeakerToggle - Callback for speaker toggle
 * @param {() => void} props.onEndCall - Callback for ending call
 * @returns {React.ReactElement}
 */
const CallControlPanel = ({ onMuteToggle, onSpeakerToggle, onEndCall }) => {
  return (
    <div className="flex justify-center gap-4 mt-4">
      <button
        onClick={onMuteToggle}
        className="p-4 bg-purple-200 rounded-full hover:bg-purple-300 transition transform hover:scale-110 shadow-lg"
        title="Toggle Mute"
      >
        <Mic size={26} className="text-purple-800" />
      </button>

      <button
        onClick={onSpeakerToggle}
        className="p-4 bg-purple-200 rounded-full hover:bg-purple-300 transition transform hover:scale-110 shadow-lg"
        title="Toggle Speaker"
      >
        <Volume2 size={26} className="text-purple-800" />
      </button>

      <button
        onClick={onEndCall}
        className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition transform hover:scale-110 shadow-lg"
        title="End Call"
      >
        <PhoneOff size={26} className="text-white" />
      </button>
    </div>
  );
};

/**
 * ACW summary panel showing LLM-generated summary
 * @param {Object} props
 * @param {boolean} props.summarySaved - Whether summary has been saved
 * @returns {React.ReactElement}
 */
const ACWSummaryPanel = ({ summarySaved }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-300 shadow-lg animate-fadeIn">
      <h3 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
        <Bot size={28} />
        Call Summary & Disposition
      </h3>

      <div className="bg-white p-4 rounded-xl mb-4 shadow-inner">
        <p className="text-gray-700 leading-relaxed mb-3">
          <strong>Customer Intent:</strong> Business loan inquiry
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          <strong>Key Points Discussed:</strong> Interest rates (9.5%), documentation requirements, 
          loan amount (up to ₹50 lakhs), tenure options (1-5 years)
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          <strong>Next Steps:</strong> Application form sent to customer email
        </p>
        <p className="text-gray-700 leading-relaxed">
          <strong>Disposition:</strong> <span className="text-green-600 font-semibold">Hot Lead - Follow-up in 24 hours</span>
        </p>
      </div>

      {!summarySaved ? (
        <div className="flex items-center gap-3 text-blue-600">
          <Loader2 size={28} className="animate-spin" />
          <span className="font-medium">Saving to CRM database…</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-green-600 text-lg font-bold animate-fadeIn">
          <CheckCircle2 size={32} />
          <span>Summary saved successfully!</span>
        </div>
      )}
    </div>
  );
};