import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveCall, selectIncomingCall, selectCallState, selectIsRegistered } from '@dalaillama/shared-store/slices/sipSlice.js';
import { Phone, PhoneOff, PhoneIncoming, Mic, MicOff, Pause, Play, ArrowRightLeft, Hash, X, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * @typedef {Object} SipPhoneApi
 * @property {(number: string) => void} call
 * @property {() => void} answer
 * @property {() => void} hangup
 * @property {() => void} hold
 * @property {() => void} unhold
 * @property {() => void} mute
 * @property {() => void} unmute
 * @property {(target: string) => void} transfer
 * @property {(digit: string) => void} sendDtmf
 * @property {boolean} isMuted
 * @property {boolean} isRegistered
 */

/**
 * Floating softphone widget — bottom-right corner, always visible.
 *
 * @param {{ sipPhone: SipPhoneApi }} props
 */
export default function SoftphoneWidget({ sipPhone }) {
  const isRegistered = useSelector(selectIsRegistered);
  const activeCall = /** @type {{ id: string, direction: string, remoteNumber: string, remoteName: string, state: string, startTime: number }|null} */ (useSelector(selectActiveCall));
  const incomingCall = /** @type {{ id: string, callerNumber: string, callerName: string, timestamp: number }|null} */ (useSelector(selectIncomingCall));
  const callState = useSelector(selectCallState);

  const [isExpanded, setIsExpanded] = useState(false);
  const [dialInput, setDialInput] = useState('');
  const [showDtmf, setShowDtmf] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Call timer
  useEffect(() => {
    if (!activeCall?.startTime) { setCallDuration(0); return; }
    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - activeCall.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall?.startTime]);

  const formatTime = (/** @type {number} */ s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const dialpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const handleDial = () => {
    if (dialInput.trim()) {
      sipPhone.call(dialInput.trim());
      setDialInput('');
    }
  };

  const handleKeyPress = (/** @type {string} */ key) => {
    if (activeCall && showDtmf) {
      sipPhone.sendDtmf(key);
    } else {
      setDialInput((prev) => prev + key);
    }
  };

  // ── Incoming call popup ──
  if (incomingCall && callState === 'RINGING_IN') {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <div className="bg-white rounded-3xl shadow-2xl border border-emerald-200 p-6 w-80">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <PhoneIncoming className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{incomingCall.callerName}</p>
              <p className="text-sm text-slate-500">{incomingCall.callerNumber}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={sipPhone.answer}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Answer
            </button>
            <button
              onClick={sipPhone.hangup}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main widget ──
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 ${isExpanded ? 'w-80' : 'w-16 h-16'}`}>

        {/* Collapsed: just the phone icon */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className={`w-16 h-16 flex items-center justify-center rounded-3xl transition-colors ${
              activeCall ? 'bg-emerald-500 text-white animate-pulse' :
              isRegistered ? 'bg-purple-600 text-white hover:bg-purple-700' :
              'bg-slate-300 text-slate-500'
            }`}
          >
            <Phone className="w-6 h-6" />
          </button>
        )}

        {/* Expanded */}
        {isExpanded && (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRegistered ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {isRegistered ? 'Online' : 'Offline'}
                </span>
              </div>
              <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-slate-600">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Active call display */}
            {activeCall ? (
              <div className="mb-4">
                <div className="text-center mb-3">
                  <p className="font-bold text-slate-900">{activeCall.remoteName || activeCall.remoteNumber}</p>
                  <p className="text-sm text-slate-500">{activeCall.remoteNumber}</p>
                  <p className="text-lg font-mono text-purple-600 mt-1">{formatTime(callDuration)}</p>
                  <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">{/** @type {string} */ (callState)}</p>
                </div>

                {/* Call controls */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <CallButton
                    icon={sipPhone.isMuted ? MicOff : Mic}
                    label={sipPhone.isMuted ? 'Unmute' : 'Mute'}
                    onClick={sipPhone.isMuted ? sipPhone.unmute : sipPhone.mute}
                    active={sipPhone.isMuted}
                  />
                  <CallButton
                    icon={callState === 'ON_HOLD' ? Play : Pause}
                    label={callState === 'ON_HOLD' ? 'Resume' : 'Hold'}
                    onClick={callState === 'ON_HOLD' ? sipPhone.unhold : sipPhone.hold}
                    active={callState === 'ON_HOLD'}
                  />
                  <CallButton icon={ArrowRightLeft} label="Transfer" onClick={() => {
                    const target = prompt('Transfer to extension:');
                    if (target) sipPhone.transfer(target);
                  }} />
                  <CallButton icon={Hash} label="DTMF" onClick={() => setShowDtmf(!showDtmf)} active={showDtmf} />
                </div>

                {/* DTMF pad */}
                {showDtmf && (
                  <div className="grid grid-cols-3 gap-1 mb-3">
                    {dialpadKeys.map((key) => (
                      <button key={key} onClick={() => sipPhone.sendDtmf(key)}
                        className="bg-slate-50 hover:bg-slate-100 rounded-lg py-2 text-lg font-semibold text-slate-700 transition-colors">
                        {key}
                      </button>
                    ))}
                  </div>
                )}

                {/* Hangup */}
                <button onClick={sipPhone.hangup}
                  className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                  <PhoneOff className="w-4 h-4" /> End Call
                </button>
              </div>
            ) : (
              /* Dial pad */
              <div>
                <input
                  type="text"
                  value={dialInput}
                  onChange={(e) => setDialInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDial()}
                  placeholder="Enter number..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-mono mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="grid grid-cols-3 gap-1 mb-3">
                  {dialpadKeys.map((key) => (
                    <button key={key} onClick={() => handleKeyPress(key)}
                      className="bg-slate-50 hover:bg-slate-100 rounded-lg py-3 text-lg font-semibold text-slate-700 transition-colors">
                      {key}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDial} disabled={!dialInput.trim() || !isRegistered}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Call
                  </button>
                  {dialInput && (
                    <button onClick={() => setDialInput('')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl px-4 py-3 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @param {{ icon: import('react').ElementType, label: string, onClick: () => void, active?: boolean }} props
 */
function CallButton({ icon: Icon, label, onClick, active = false }) {
  return (
    <button onClick={() => onClick()}
      className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-colors ${
        active ? 'bg-purple-100 text-purple-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
      }`}>
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}