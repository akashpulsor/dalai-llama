// shared/ui/components/SupervisorControls.jsx
import React from "react";
import { Headphones, Volume2, Mic, MicOff, XCircle } from "lucide-react";

/**
 * @typedef {Object} SupervisorControlsProps
 * @property {boolean} isListening
 * @property {boolean} isWhispering
 * @property {() => void} onListen
 * @property {() => void} onStopListen
 * @property {() => void} onWhisper
 * @property {() => void} onStopWhisper
 */

/**
 * @param {SupervisorControlsProps} props
 */
export default function SupervisorControls({
  isListening,
  isWhispering,
  onListen,
  onStopListen,
  onWhisper,
  onStopWhisper,
}) {
  return (
    <div className="flex flex-wrap gap-3 p-4 bg-gray-50 border-t rounded-b-xl">

      {/* Listen / Stop Listen */}
      <button
        onClick={isListening ? onStopListen : onListen}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold shadow transition-all duration-200 hover:scale-105
          ${isListening ? "bg-red-500" : "bg-blue-600 hover:bg-blue-700"}
        `}
      >
        {isListening ? <XCircle size={18} /> : <Headphones size={18} />}
        {isListening ? "Stop Listening" : "Listen"}
      </button>

      {/* Whisper / Stop Whisper */}
      <button
        onClick={isWhispering ? onStopWhisper : onWhisper}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold shadow transition-all duration-200 hover:scale-105
          ${isWhispering ? "bg-red-500" : "bg-green-600 hover:bg-green-700"}
        `}
      >
        {isWhispering ? <MicOff size={18} /> : <Mic size={18} />}
        {isWhispering ? "Stop Whisper" : "Whisper"}
      </button>

      {/* Optional future buttons:
          - barge-in
          - takeover
      */}
    </div>
  );
}
