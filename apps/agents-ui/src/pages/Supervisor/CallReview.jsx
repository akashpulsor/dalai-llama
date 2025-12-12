// src/pages/supervisor/CallReview.jsx

/**
 * @file Call Review
 * 
 * Detailed call review interface with AI-powered summary, sentiment-colored
 * transcript, and coaching recommendations.
 */

import React, { useState } from "react";
import { useParams } from "react-router-dom";

import {
  useGetCallReviewQuery,
  useGenerateCoachingMutation
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Sentiment type for transcript lines
 * @typedef {"positive" | "neutral" | "negative" | "frustrated"} SentimentType
 */

/**
 * Speaker type
 * @typedef {"agent" | "customer"} SpeakerType
 */

/**
 * Transcript line
 * @typedef {Object} TranscriptLine
 * @property {string} id - Line ID
 * @property {string} timestamp - Timestamp in MM:SS format
 * @property {SpeakerType} speaker - Who is speaking
 * @property {string} text - What was said
 * @property {SentimentType} sentiment - Detected sentiment
 */

/**
 * AI coaching recommendation
 * @typedef {Object} CoachingRecommendation
 * @property {string} id - Recommendation ID
 * @property {string} type - Type of recommendation
 * @property {string} text - Recommendation text
 * @property {string} [timestamp] - Optional timestamp reference
 * @property {string} [courseLink] - Optional training course link
 * @property {string} [courseName] - Optional training course name
 */

/**
 * Call review data
 * @typedef {Object} CallReview
 * @property {string} id - Call ID
 * @property {string} agentId - Agent ID
 * @property {string} agentName - Agent name
 * @property {string} customerId - Customer ID
 * @property {string} customerName - Customer name
 * @property {string} date - Call date (ISO format)
 * @property {string} duration - Call duration (MM:SS)
 * @property {string} aiSummary - AI-generated call summary
 * @property {TranscriptLine[]} transcript - Call transcript
 * @property {CoachingRecommendation[]} coaching - AI coaching recommendations
 * @property {string} [queue] - Queue name
 * @property {number} [overallSentiment] - Overall sentiment score (1-5)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Sentiment configuration for transcript
 * @type {Record<SentimentType, {emoji: string, color: string, bgColor: string}>}
 */
const SENTIMENT_CONFIG = {
  positive: {
    emoji: "😊",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200"
  },
  neutral: {
    emoji: "😐",
    color: "text-slate-700",
    bgColor: "bg-slate-50 border-slate-200"
  },
  negative: {
    emoji: "😡",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200"
  },
  frustrated: {
    emoji: "😟",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200"
  }
};

/**
 * Coaching type icons
 * @type {Record<string, string>}
 */
const COACHING_ICONS = {
  phrasing: "💬",
  tone: "🎵",
  empathy: "❤️",
  policy: "📋",
  training: "📚",
  default: "💡"
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets sentiment emoji
 * @param {SentimentType} sentiment
 * @returns {string}
 */
const getSentimentEmoji = (sentiment) => {
  return SENTIMENT_CONFIG[sentiment]?.emoji || "😐";
};

/**
 * Gets sentiment color class
 * @param {SentimentType} sentiment
 * @returns {string}
 */
const getSentimentColor = (sentiment) => {
  return SENTIMENT_CONFIG[sentiment]?.color || "text-slate-700";
};

/**
 * Gets sentiment background color
 * @param {SentimentType} sentiment
 * @returns {string}
 */
const getSentimentBgColor = (sentiment) => {
  return SENTIMENT_CONFIG[sentiment]?.bgColor || "bg-slate-50 border-slate-200";
};

/**
 * Gets coaching icon
 * @param {string} type
 * @returns {string}
 */
const getCoachingIcon = (type) => {
  return COACHING_ICONS[type.toLowerCase()] || COACHING_ICONS.default;
};

/**
 * Formats date
 * @param {string} isoDate
 * @returns {string}
 */
const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

// ============================================================================
// TRANSCRIPT LINE COMPONENT
// ============================================================================

/**
 * @typedef {Object} TranscriptLineProps
 * @property {TranscriptLine} line
 */

/**
 * Transcript Line Component
 * 
 * @param {TranscriptLineProps} props
 * @returns {React.ReactElement}
 */
function TranscriptLineComponent(props) {
  const { line } = props;
  const isAgent = line.speaker === "agent";

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:shadow-sm ${getSentimentBgColor(line.sentiment)}`}>
      <div className="flex-shrink-0 w-16 text-xs font-mono font-semibold text-slate-600">
        {line.timestamp}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold ${isAgent ? "text-blue-700" : "text-purple-700"}`}>
            {isAgent ? "Agent" : "Customer"}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${getSentimentColor(line.sentiment)}`}>
          "{line.text}"
        </p>
      </div>
      <div className="flex-shrink-0 text-2xl">
        {getSentimentEmoji(line.sentiment)}
      </div>
    </div>
  );
}

// ============================================================================
// COACHING CARD COMPONENT
// ============================================================================

/**
 * @typedef {Object} CoachingCardProps
 * @property {CoachingRecommendation} recommendation
 */

/**
 * Coaching Card Component
 * 
 * @param {CoachingCardProps} props
 * @returns {React.ReactElement}
 */
function CoachingCard(props) {
  const { recommendation } = props;

  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex-shrink-0 text-2xl">
        {getCoachingIcon(recommendation.type)}
      </div>
      <div className="flex-1">
        <p className="text-sm text-blue-900 leading-relaxed">
          {recommendation.text}
        </p>
        {recommendation.timestamp && (
          <div className="mt-2 text-xs text-blue-700 font-medium">
            @ {recommendation.timestamp}
          </div>
        )}
        {recommendation.courseName && (
          <div className="mt-2">
            <a
              href={recommendation.courseLink || "#"}
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {recommendation.courseName}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CALL REVIEW PAGE
// ============================================================================

/**
 * Call Review Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function CallReview() {
  const { callId } = useParams();

  const { data: review, isLoading } = useGetCallReviewQuery(
    { callId: callId || "" },
    { skip: !callId }
  );

  const [generateCoaching, { isLoading: isGenerating }] = useGenerateCoachingMutation();

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  /**
   * Handles regenerate coaching
   * @returns {Promise<void>}
   */
  const handleRegenerateCoaching = async () => {
    if (!callId) return;
    
    try {
      await generateCoaching({ callId }).unwrap();
      // Success feedback
    } catch (error) {
      console.error("Failed to regenerate coaching:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading call review...</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Call not found</h3>
          <p className="text-sm text-slate-500">The requested call review could not be loaded.</p>
        </div>
      </div>
    );
  }

  const displayTranscript = showFullTranscript 
    ? review.transcript 
    : review.transcript.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-slate-900">
              Call Review: {review.customerName} ↔ {review.agentName}
            </h1>
            <button
              onClick={() => window.history.back()}
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              ← Back
            </button>
          </div>

          {/* Call Metadata */}
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(review.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Duration: {review.duration}</span>
            </div>
            {review.queue && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span>{review.queue}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        
        {/* AI Call Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-blue-900 mb-2">AI Call Summary</h2>
              <p className="text-sm text-blue-800 leading-relaxed">
                {review.aiSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Transcript</h2>
                <p className="text-sm text-slate-600 mt-1">Sentiment-analyzed conversation</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <span className="text-lg">😊</span>
                  <span>Positive</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg">😐</span>
                  <span>Neutral</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg">😟</span>
                  <span>Frustrated</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg">😡</span>
                  <span>Negative</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
            {displayTranscript.map(
              /**
               * @param {TranscriptLine} line
               */
              (line) => (
              <TranscriptLineComponent key={line.id} line={line} />
            ))}

            {review.transcript.length > 5 && !showFullTranscript && (
              <button
                onClick={() => setShowFullTranscript(true)}
                className="w-full py-3 text-sm text-blue-600 hover:text-blue-800 font-medium 
                           border-t border-slate-200 mt-3 pt-3"
              >
                Show full transcript ({review.transcript.length - 5} more lines) →
              </button>
            )}
          </div>
        </div>

        {/* AI Coaching */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">AI Coaching</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Personalized recommendations for improvement
                </p>
              </div>
              <button
                onClick={handleRegenerateCoaching}
                disabled={isGenerating}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                {isGenerating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {review.coaching.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No coaching recommendations available
              </div>
            ) : (
              review.coaching.map(
                /**
                 * @param {CoachingRecommendation} rec
                 */
                (rec) => (
                <CoachingCard key={rec.id} recommendation={rec} />
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium 
                       rounded-lg hover:bg-slate-50 transition-colors"
          >
            Download Transcript
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium 
                       rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Feedback to Agent
          </button>
        </div>

      </div>

    </div>
  );
}