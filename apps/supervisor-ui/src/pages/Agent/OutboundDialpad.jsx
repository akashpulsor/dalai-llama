import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Loader2,
  Globe,
  Bot,
  User,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Briefcase,
  MapPin,
  Calendar,
  X,
  Search,
  Target,
} from "lucide-react";

/**
 * @typedef {'idle' | 'analyzing' | 'web-search' | 'scoring' | 'ready-to-call' | 'dialing' | 'connected' | 'completed'} DialerPhase
 */

/**
 * @typedef {Object} LeadData
 * @property {string} id - Lead unique identifier
 * @property {string} name - Lead name
 * @property {string} phone - Lead phone number
 * @property {string} company - Company name
 * @property {string} location - Lead location
 * @property {string} industry - Industry type
 * @property {number} estimatedRevenue - Estimated revenue potential
 * @property {string} lastContact - Last contact date
 * @property {string} source - Lead source
 * @property {string} email - Lead email
 */

/**
 * @typedef {Object} AIAnalysis
 * @property {number} score - Lead score (0-100)
 * @property {'high' | 'medium' | 'low'} priority - Lead priority
 * @property {string} reasoning - AI reasoning for the score
 * @property {string[]} positiveFactors - Positive factors
 * @property {string[]} negativeFactors - Negative factors
 * @property {string} recommendation - Call recommendation
 * @property {string} talkingPoints - Suggested talking points
 * @property {string} webContext - Context from web search
 */

/**
 * @typedef {Object} CallTranscript
 * @property {'agent' | 'customer'} speaker - Speaker type
 * @property {string} text - Spoken text
 * @property {number} timestamp - Timestamp
 */

/**
 * OutboundDialer Component
 * 
 * AI-powered outbound dialer with predictive lead analysis and prioritization.
 * 
 * Flow:
 * 1. idle - Waiting for leads from lead management
 * 2. analyzing - LLM analyzing both leads
 * 3. web-search - Searching web for lead context
 * 4. scoring - Generating priority scores
 * 5. ready-to-call - Display analyzed leads with recommendations
 * 6. dialing - Calling the selected lead
 * 7. connected - Live call in progress
 * 8. completed - Call completed with summary
 * 
 * @returns {React.ReactElement} The outbound dialer interface
 */
export default function OutboundDialer() {
  /** @type {[DialerPhase, React.Dispatch<React.SetStateAction<DialerPhase>>]} */
  const [phase, setPhase] = useState(/** @type {DialerPhase} */('idle'));
  
  /** @type {[LeadData[], React.Dispatch<React.SetStateAction<LeadData[]>>]} */
  const [leads, setLeads] = useState(/** @type {LeadData[]} */([]));
  
  /** @type {[Map<string, AIAnalysis>, React.Dispatch<React.SetStateAction<Map<string, AIAnalysis>>>]} */
  const [aiAnalyses, setAiAnalyses] = useState(new Map());
  
  /** @type {[LeadData | null, React.Dispatch<React.SetStateAction<LeadData | null>>]} */
  const [selectedLead, setSelectedLead] = useState(/** @type {LeadData | null} */(null));
  
  /** @type {[CallTranscript[], React.Dispatch<React.SetStateAction<CallTranscript[]>>]} */
  const [callTranscript, setCallTranscript] = useState(/** @type {CallTranscript[]} */([]));
  
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [analysisProgress, setAnalysisProgress] = useState("");
  
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [callCompleted, setCallCompleted] = useState(false);

  /* -----------------------------------------------------
   * SIMULATE LEAD MANAGEMENT SYSTEM
   * ----------------------------------------------------- */
  useEffect(() => {
    if (phase === 'idle') {
      // Simulate receiving leads from lead management system
      setTimeout(() => {
        const mockLeads = [
          {
            id: "LEAD-001",
            name: "Priya Sharma",
            phone: "+91 98765 12345",
            company: "TechVista Solutions",
            location: "Bangalore, Karnataka",
            industry: "Software Development",
            estimatedRevenue: 5000000,
            lastContact: "2024-11-15",
            source: "Website Form",
            email: "priya.sharma@techvista.com",
          },
          {
            id: "LEAD-002",
            name: "Rajesh Patel",
            phone: "+91 98765 67890",
            company: "Mumbai Traders Pvt Ltd",
            location: "Mumbai, Maharashtra",
            industry: "Retail",
            estimatedRevenue: 1200000,
            lastContact: "2024-10-20",
            source: "Cold Outreach",
            email: "rajesh@mumbaitraders.com",
          },
        ];
        setLeads(mockLeads);
        setPhase('analyzing');
      }, 1500);
    }
  }, [phase]);

  /* -----------------------------------------------------
   * AI ANALYSIS FLOW
   * ----------------------------------------------------- */
  useEffect(() => {
    if (phase === 'analyzing' && leads.length > 0) {
      analyzeLeads();
    }
  }, [phase, leads]);

  /**
   * Analyzes leads using AI with web search
   */
  const analyzeLeads = async () => {
    setAnalysisProgress("Starting AI analysis...");
    
    // Simulate initial analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAnalysisProgress("Analyzing lead profiles...");
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPhase('web-search');
    setAnalysisProgress("Searching web for lead context...");
    
    // Simulate web search for each lead
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAnalysisProgress("Gathering company information...");
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPhase('scoring');
    setAnalysisProgress("Generating priority scores...");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate AI analyses
    const analyses = new Map();
    
    // High priority lead (Lead 1)
    analyses.set(leads[0].id, {
      score: 87,
      priority: 'high',
      reasoning: "Strong fit based on industry, company size, and recent engagement. High revenue potential with active digital presence.",
      positiveFactors: [
        "Fast-growing tech company with 200+ employees",
        "Recent website activity indicates active evaluation",
        "Industry aligns perfectly with our solution",
        "Strong social media presence and positive reviews",
        "Decision-maker title (VP Operations)",
      ],
      negativeFactors: [
        "Competitive market - may have existing vendors",
      ],
      recommendation: "HIGH PRIORITY - Call immediately. Strong potential for conversion.",
      talkingPoints: "Focus on: ROI through automation, scalability for growing teams, integration with existing tech stack, case studies from similar companies",
      webContext: "TechVista Solutions recently announced 40% YoY growth and is expanding operations. LinkedIn shows they're hiring in operations.",
    });
    
    // Low priority lead (Lead 2)
    analyses.set(leads[1].id, {
      score: 34,
      priority: 'low',
      reasoning: "Limited fit due to industry mismatch, small company size, and outdated contact. Low engagement signals.",
      positiveFactors: [
        "Established business with 10+ years history",
        "Located in major metro area",
      ],
      negativeFactors: [
        "No recent engagement (45+ days since last contact)",
        "Industry (Retail) has lower adoption rates",
        "Small company size may indicate budget constraints",
        "Minimal online presence and dated website",
        "Previous cold outreach attempts unsuccessful",
        "No social media activity in past 6 months",
      ],
      recommendation: "LOW PRIORITY - Deprioritize. Consider nurture campaign instead of immediate call.",
      talkingPoints: "If calling: Focus on cost-effectiveness, simple implementation, retail-specific benefits",
      webContext: "Mumbai Traders shows minimal digital footprint. Website last updated in 2023. No recent news or expansion signals.",
    });
    
    setAiAnalyses(analyses);
    setPhase('ready-to-call');
    setAnalysisProgress("Analysis complete!");
  };

  /**
   * Initiates call to selected lead
   * @param {LeadData} lead - The lead to call
   */
  const initiateCall = (lead) => {
    setSelectedLead(lead);
    setPhase('dialing');
    
    // Simulate dialing
    setTimeout(() => {
      setPhase('connected');
      startCallSimulation(lead);
    }, 3000);
  };

  /**
   * Simulates a live call conversation
   * @param {LeadData} lead - The lead being called
   */
  const startCallSimulation = (lead) => {
    const conversation = [
      { speaker: /** @type {'agent'} */('agent'), text: `Hi, may I speak with ${lead.name}?`, delay: 1000 },
      { speaker: /** @type {'customer'} */('customer'), text: "Yes, this is she. Who's calling?", delay: 2000 },
      { speaker: /** @type {'agent'} */('agent'), text: "Hi Priya, this is Akash from DalaiLlama. I hope I'm not catching you at a bad time?", delay: 2500 },
      { speaker: /** @type {'customer'} */('customer'), text: "No, it's fine. What's this regarding?", delay: 2000 },
      { speaker: /** @type {'agent'} */('agent'), text: "I noticed TechVista is expanding rapidly. I wanted to discuss how we're helping similar tech companies automate their contact center operations.", delay: 3000 },
      { speaker: /** @type {'customer'} */('customer'), text: "Oh interesting! We've actually been looking at solutions. Our support team is overwhelmed.", delay: 2500 },
      { speaker: /** @type {'agent'} */('agent'), text: "That's exactly what we solve. Our AI-native platform reduces support costs by 70% while improving response times. Can I ask about your current setup?", delay: 3500 },
      { speaker: /** @type {'customer'} */('customer'), text: "We're using a legacy system. It's expensive and doesn't integrate well with our tools.", delay: 2500 },
      { speaker: /** @type {'agent'} */('agent'), text: "Perfect timing then. Would you be open to a 15-minute demo next week?", delay: 2000 },
      { speaker: /** @type {'customer'} */('customer'), text: "Yes, that would be great. Can you email me some information first?", delay: 2000 },
    ];

    let index = 0;
    
    const addNextLine = () => {
      if (index < conversation.length) {
        const line = conversation[index];
        setCallTranscript((prev) => [
          ...prev,
          {
            speaker: line.speaker,
            text: line.text,
            timestamp: Date.now(),
          },
        ]);
        index++;
        setTimeout(addNextLine, line.delay);
      }
    };

    setTimeout(addNextLine, 1000);
  };

  /**
   * Ends the current call
   */
  const endCall = () => {
    setPhase('completed');
    setTimeout(() => {
      setCallCompleted(true);
    }, 2500);
  };

  /**
   * Resets the dialer to start over
   */
  const resetDialer = () => {
    setPhase('idle');
    setLeads([]);
    setAiAnalyses(new Map());
    setSelectedLead(null);
    setCallTranscript([]);
    setAnalysisProgress("");
    setCallCompleted(false);
  };

  /**
   * Gets the title for current phase
   */
  const getPhaseTitle = () => {
    switch (phase) {
      case 'idle': return 'Waiting for Leads...';
      case 'analyzing': return 'AI Analysis in Progress';
      case 'web-search': return 'Enriching Lead Data from Web';
      case 'scoring': return 'Calculating Priority Scores';
      case 'ready-to-call': return 'Leads Analyzed - Ready to Call';
      case 'dialing': return 'Dialing...';
      case 'connected': return 'Call in Progress';
      case 'completed': return 'Call Completed';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-purple-700 mb-2 flex items-center gap-3">
          <Phone className="animate-pulse" />
          AI-Powered Outbound Dialer
        </h1>
        <p className="text-gray-600 mb-6">Predictive Lead Analysis & Prioritization</p>

        <div className="bg-white rounded-3xl shadow-2xl border border-purple-200 p-6">
          {/* Phase Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {(phase === 'analyzing' || phase === 'web-search' || phase === 'scoring') && (
                <Loader2 className="text-purple-600 animate-spin" size={24} />
              )}
              <h2 className="text-2xl font-semibold text-purple-700">
                {getPhaseTitle()}
              </h2>
            </div>
            
            {phase === 'completed' && (
              <button
                onClick={resetDialer}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Phone size={18} />
                New Session
              </button>
            )}
          </div>

          {/* IDLE STATE */}
          {phase === 'idle' && (
            <IdleState />
          )}

          {/* ANALYZING STATE */}
          {(phase === 'analyzing' || phase === 'web-search' || phase === 'scoring') && (
            <AnalyzingState 
              leads={leads} 
              progress={analysisProgress}
              phase={phase}
            />
          )}

          {/* READY TO CALL STATE */}
          {phase === 'ready-to-call' && (
            <ReadyToCallState 
              leads={leads}
              aiAnalyses={aiAnalyses}
              onInitiateCall={initiateCall}
            />
          )}

          {/* DIALING STATE */}
          {phase === 'dialing' && selectedLead && (
            <DialingState lead={selectedLead} />
          )}

          {/* CONNECTED STATE */}
          {phase === 'connected' && selectedLead && (
            <ConnectedState 
              lead={selectedLead}
              analysis={aiAnalyses.get(selectedLead.id)}
              transcript={callTranscript}
              onEndCall={endCall}
            />
          )}

          {/* COMPLETED STATE */}
          {phase === 'completed' && selectedLead && (
            <CompletedState 
              lead={selectedLead}
              callCompleted={callCompleted}
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
 * Idle state component
 * @returns {React.ReactElement}
 */
const IdleState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-purple-100 p-8 rounded-full mb-6">
        <Target size={64} className="text-purple-600 animate-pulse" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">
        Connecting to Lead Management
      </h3>
      <p className="text-gray-600 mb-6">
        Waiting for leads to analyze...
      </p>
      <Loader2 className="text-purple-600 animate-spin" size={32} />
    </div>
  );
};

/**
 * Analyzing state component
 * @param {Object} props
 * @param {LeadData[]} props.leads - Leads being analyzed
 * @param {string} props.progress - Current progress message
 * @param {DialerPhase} props.phase - Current phase
 * @returns {React.ReactElement}
 */
const AnalyzingState = ({ leads, progress, phase }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border-2 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <Bot size={28} className="text-purple-600 animate-pulse" />
          <h3 className="text-xl font-bold text-purple-800">
            AI Predictive Analysis
          </h3>
        </div>
        <p className="text-gray-700 mb-4">{progress}</p>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {phase === 'analyzing' && <Bot size={16} />}
          {phase === 'web-search' && <Globe size={16} />}
          {phase === 'scoring' && <TrendingUp size={16} />}
          <span className="font-medium">
            {phase === 'analyzing' && 'Analyzing lead profiles and history'}
            {phase === 'web-search' && 'Searching web for company information'}
            {phase === 'scoring' && 'Calculating priority scores'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {leads.map((lead, idx) => (
          <div 
            key={lead.id}
            className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm animate-fadeIn"
            style={{ animationDelay: `${idx * 0.2}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-gray-800">{lead.name}</h4>
                <p className="text-sm text-gray-600">{lead.company}</p>
              </div>
              <Loader2 size={20} className="text-purple-600 animate-spin" />
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>{lead.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase size={14} />
                <span>{lead.industry}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Ready to call state component
 * @param {Object} props
 * @param {LeadData[]} props.leads - Analyzed leads
 * @param {Map<string, AIAnalysis>} props.aiAnalyses - AI analyses for leads
 * @param {(lead: LeadData) => void} props.onInitiateCall - Callback to initiate call
 * @returns {React.ReactElement}
 */
const ReadyToCallState = ({ leads, aiAnalyses, onInitiateCall }) => {
  // Sort leads by priority
  const sortedLeads = [...leads].sort((a, b) => {
    const scoreA = aiAnalyses.get(a.id)?.score || 0;
    const scoreB = aiAnalyses.get(b.id)?.score || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-300">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="text-green-600" />
          <div>
            <h3 className="font-bold text-green-800">Analysis Complete!</h3>
            <p className="text-sm text-green-700">
              {sortedLeads.length} leads analyzed and prioritized
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedLeads.map((lead) => {
          const analysis = aiAnalyses.get(lead.id);
          if (!analysis) return null;

          const isHighPriority = analysis.priority === 'high';

          return (
            <div
              key={lead.id}
              className={`p-6 rounded-2xl border-2 shadow-lg transition-all ${
                isHighPriority
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {lead.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isHighPriority
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-400 text-white'
                      }`}
                    >
                      {analysis.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium">{lead.company}</p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    {isHighPriority ? (
                      <TrendingUp className="text-green-600" size={24} />
                    ) : (
                      <TrendingDown className="text-gray-500" size={24} />
                    )}
                    <span className="text-3xl font-bold text-gray-800">
                      {analysis.score}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">AI Score</p>
                </div>
              </div>

              {/* Lead Details */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-white rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-purple-600" />
                  <span className="text-gray-700">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-purple-600" />
                  <span className="text-gray-700">{lead.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase size={16} className="text-purple-600" />
                  <span className="text-gray-700">{lead.industry}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={16} className="text-purple-600" />
                  <span className="text-gray-700">
                    ₹{(lead.estimatedRevenue / 100000).toFixed(1)}L potential
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-purple-600" />
                  <span className="text-gray-700">Last: {lead.lastContact}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Search size={16} className="text-purple-600" />
                  <span className="text-gray-700">{lead.source}</span>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="space-y-3 mb-4">
                <div className="bg-white p-4 rounded-xl">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Bot size={18} className="text-purple-600" />
                    AI Reasoning
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {analysis.reasoning}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="font-bold text-green-800 mb-2 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Positive Factors
                    </h4>
                    <ul className="space-y-1">
                      {analysis.positiveFactors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <h4 className="font-bold text-red-800 mb-2 text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      Negative Factors
                    </h4>
                    <ul className="space-y-1">
                      {analysis.negativeFactors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2 text-sm flex items-center gap-2">
                    <Globe size={16} />
                    Web Research Context
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {analysis.webContext}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-2 text-sm">
                    Suggested Talking Points
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {analysis.talkingPoints}
                  </p>
                </div>
              </div>

              {/* Recommendation & Action */}
              <div className={`p-4 rounded-xl border-2 mb-4 ${
                isHighPriority
                  ? 'bg-green-100 border-green-400'
                  : 'bg-gray-100 border-gray-400'
              }`}>
                <p className={`font-bold text-sm ${
                  isHighPriority ? 'text-green-800' : 'text-gray-700'
                }`}>
                  {analysis.recommendation}
                </p>
              </div>

              <button
                onClick={() => onInitiateCall(lead)}
                disabled={!isHighPriority}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition transform ${
                  isHighPriority
                    ? 'bg-green-500 hover:bg-green-600 text-white hover:scale-105 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <PhoneCall size={24} />
                {isHighPriority ? 'Call Now' : 'Deprioritized - Skip'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Dialing state component
 * @param {Object} props
 * @param {LeadData} props.lead - Lead being called
 * @returns {React.ReactElement}
 */
const DialingState = ({ lead }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-purple-100 p-8 rounded-full mb-6 animate-pulse">
        <PhoneCall size={64} className="text-purple-600 animate-bounce" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">
        Calling {lead.name}
      </h3>
      <p className="text-gray-600 mb-2">{lead.phone}</p>
      <p className="text-sm text-gray-500 mb-6">{lead.company}</p>
      <div className="flex items-center gap-2 text-purple-600">
        <Loader2 className="animate-spin" size={24} />
        <span className="font-medium">Connecting...</span>
      </div>
    </div>
  );
};

/**
 * Connected state component
 * @param {Object} props
 * @param {LeadData} props.lead - Lead on call
 * @param {AIAnalysis | undefined} props.analysis - AI analysis for the lead
 * @param {CallTranscript[]} props.transcript - Call transcript
 * @param {() => void} props.onEndCall - Callback to end call
 * @returns {React.ReactElement}
 */
const ConnectedState = ({ lead, analysis, transcript, onEndCall }) => {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left - Transcript */}
      <div className="col-span-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-300 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
              <div>
                <h3 className="font-bold text-green-800">{lead.name}</h3>
                <p className="text-sm text-green-700">{lead.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <Clock size={18} />
              <span className="font-mono">00:{String(Math.floor(transcript.length * 2)).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-purple-50 to-white h-96 overflow-y-auto p-5 rounded-2xl border-2 border-purple-200 shadow-inner">
          {transcript.length === 0 && (
            <p className="text-gray-400 italic">Waiting for conversation...</p>
          )}
          {transcript.map((line, i) => (
            <TranscriptLine key={i} line={line} />
          ))}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={onEndCall}
            className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-lg shadow-lg transform transition hover:scale-105 flex items-center gap-3"
          >
            <PhoneOff size={24} />
            End Call
          </button>
        </div>
      </div>

      {/* Right - AI Talking Points */}
      <div className="col-span-4">
        <div className="bg-gradient-to-b from-purple-100 to-purple-50 border-2 border-purple-300 rounded-2xl p-4 h-[500px] overflow-y-auto shadow-inner">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={22} className="text-purple-700 animate-pulse" />
            <h3 className="text-lg font-semibold text-purple-700">
              AI Coach - Live
            </h3>
          </div>

          {analysis && (
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-sm">
                <h4 className="font-bold text-sm text-purple-800 mb-2">
                  Talking Points
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {analysis.talkingPoints}
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded-xl border border-green-200 shadow-sm">
                <h4 className="font-bold text-sm text-green-800 mb-2">
                  Strengths to Highlight
                </h4>
                <ul className="space-y-1">
                  {analysis.positiveFactors.slice(0, 3).map((factor, idx) => (
                    <li key={idx} className="text-xs text-gray-700">
                      • {factor}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 shadow-sm">
                <h4 className="font-bold text-sm text-blue-800 mb-2">
                  Context from Web
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {analysis.webContext}
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 shadow-sm">
                <h4 className="font-bold text-sm text-yellow-800 mb-2">
                  💡 Real-time Tip
                </h4>
                <p className="text-xs text-gray-700">
                  Customer mentioned "overwhelmed support team" - emphasize automation and cost savings!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Renders a transcript line
 * @param {Object} props
 * @param {CallTranscript} props.line - Transcript line
 * @returns {React.ReactElement}
 */
const TranscriptLine = ({ line }) => {
  const isCustomer = line.speaker === 'customer';
  
  return (
    <div className={`mb-4 animate-fadeIn ${isCustomer ? 'text-left' : 'text-right'}`}>
      <div
        className={`inline-block max-w-[80%] p-3 rounded-2xl shadow-sm ${
          isCustomer
            ? 'bg-white border border-gray-200 text-gray-800'
            : 'bg-purple-600 text-white'
        }`}
      >
        <p className="text-xs font-semibold mb-1 opacity-70">
          {isCustomer ? 'Customer' : 'Agent (You)'}
        </p>
        <p className="text-sm leading-relaxed">{line.text}</p>
      </div>
    </div>
  );
};

/**
 * Completed state component
 * @param {Object} props
 * @param {LeadData} props.lead - Lead that was called
 * @param {boolean} props.callCompleted - Whether summary is saved
 * @returns {React.ReactElement}
 */
const CompletedState = ({ lead, callCompleted }) => {
  return (
    <div className="py-10">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-300 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Bot size={32} className="text-blue-600" />
          <h3 className="text-2xl font-bold text-blue-800">
            Call Summary - {lead.name}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-xl mb-6 shadow-inner space-y-4">
          <div>
            <h4 className="font-bold text-gray-800 mb-2">Call Outcome</h4>
            <p className="text-gray-700">
              Successfully connected with decision-maker. Strong interest expressed in automation solution.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-2">Key Discussion Points</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Current pain points with legacy system</li>
              <li>Interest in cost reduction (70% mentioned)</li>
              <li>Integration requirements discussed</li>
              <li>Timeline: Evaluating solutions this quarter</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-2">Next Steps</h4>
            <p className="text-gray-700">
              📧 Send product information and case studies<br />
              📅 Schedule 15-minute demo for next week<br />
              🎯 Follow-up: Within 24 hours
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-2">Disposition</h4>
            <span className="inline-block px-4 py-2 bg-green-100 text-green-800 font-bold rounded-lg">
              ✅ Hot Lead - Demo Scheduled
            </span>
          </div>
        </div>

        {!callCompleted ? (
          <div className="flex items-center gap-3 text-blue-600">
            <Loader2 size={28} className="animate-spin" />
            <span className="font-medium">Saving to CRM...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-green-600 text-xl font-bold">
            <CheckCircle2 size={36} />
            <span>Summary saved successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};