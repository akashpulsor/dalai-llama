// src/pages/admin/IVR/IVRBuilderPage.jsx

/**
 * @file IVR Builder - Visual Flow Editor
 * 
 * Enterprise SaaS interface for building Interactive Voice Response (IVR) flows
 * with drag-and-drop canvas, node palette, and properties panel.
 */

import React, { useState, useCallback } from "react";

import {
  useGetIVRQuery,
  useSaveIVRDraftMutation,
  usePublishIVRMutation,
  useGetIVRVersionsQuery
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Types of IVR nodes available
 * @typedef {"start" | "play_message" | "menu" | "queue" | "bot" | "transfer" | "voicemail" | "end_call"} NodeType
 */

/**
 * Audio source types for prompts
 * @typedef {"upload" | "tts" | "none"} AudioSourceType
 */

/**
 * Language options for TTS
 * @typedef {"en-US" | "en-GB" | "es-ES" | "fr-FR" | "de-DE" | "hi-IN"} LanguageCode
 */

/**
 * DTMF key mapping
 * @typedef {Object} DTMFMapping
 * @property {string} key - DTMF key (0-9, *, #)
 * @property {string} action - Action description
 * @property {string} targetNodeId - Target node ID to connect to
 */

/**
 * Position on canvas
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * Connection between nodes
 * @typedef {Object} Connection
 * @property {string} id - Unique connection ID
 * @property {string} sourceNodeId - Source node ID
 * @property {string} targetNodeId - Target node ID
 * @property {string} [label] - Optional connection label (e.g., "Press 1")
 */

/**
 * IVR Node configuration
 * @typedef {Object} IVRNode
 * @property {string} id - Unique node ID
 * @property {NodeType} type - Node type
 * @property {string} label - Display label
 * @property {Position} position - Position on canvas
 * @property {Object} config - Node-specific configuration
 * @property {AudioSourceType} [config.audioSource] - Audio source type
 * @property {string} [config.audioFileUrl] - Uploaded audio file URL
 * @property {string} [config.ttsText] - Text-to-speech text
 * @property {LanguageCode} [config.language] - TTS language
 * @property {number} [config.timeout] - Timeout in seconds
 * @property {DTMFMapping[]} [config.dtmfMappings] - DTMF key mappings
 * @property {string} [config.queueId] - Queue ID for queue nodes
 * @property {string} [config.botId] - Bot ID for bot nodes
 * @property {string} [config.transferNumber] - Transfer phone number
 * @property {string} [config.fallbackNodeId] - Fallback node ID
 */

/**
 * Complete IVR Flow
 * @typedef {Object} IVRFlow
 * @property {string} id - Flow ID
 * @property {string} name - Flow name
 * @property {string} description - Flow description
 * @property {IVRNode[]} nodes - Array of nodes
 * @property {Connection[]} connections - Array of connections
 * @property {string} status - Flow status (draft/published)
 * @property {number} version - Version number
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * Node template for palette
 * @typedef {Object} NodeTemplate
 * @property {NodeType} type - Node type
 * @property {string} label - Display label
 * @property {string} icon - Icon identifier
 * @property {string} description - Node description
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** @type {readonly NodeTemplate[]} */
const NODE_TEMPLATES = [
  {
    type: "start",
    label: "Start",
    icon: "play-circle",
    description: "Entry point of the IVR flow"
  },
  {
    type: "play_message",
    label: "Play Message",
    icon: "volume-up",
    description: "Play an audio message"
  },
  {
    type: "menu",
    label: "Menu (DTMF)",
    icon: "grid",
    description: "Present options via DTMF"
  },
  {
    type: "queue",
    label: "Queue",
    icon: "users",
    description: "Route to a queue"
  },
  {
    type: "bot",
    label: "Bot",
    icon: "cpu",
    description: "Connect to AI bot"
  },
  {
    type: "transfer",
    label: "Transfer",
    icon: "phone-forwarded",
    description: "Transfer to phone number"
  },
  {
    type: "voicemail",
    label: "Voicemail",
    icon: "voicemail",
    description: "Record voicemail"
  },
  {
    type: "end_call",
    label: "End Call",
    icon: "phone-off",
    description: "Terminate the call"
  }
];

/** @type {readonly LanguageCode[]} */
const LANGUAGES = ["en-US", "en-GB", "es-ES", "fr-FR", "de-DE", "hi-IN"];

/** @type {readonly string[]} */
const DTMF_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "#"];

// ============================================================================
// NODE PROPERTIES PANEL COMPONENT
// ============================================================================

/**
 * @typedef {Object} NodePropertiesPanelProps
 * @property {IVRNode | null} selectedNode - Currently selected node
 * @property {(nodeId: string, config: Object) => void} onUpdateNode - Update node callback
 */

/**
 * Node Properties Panel Component
 * 
 * @param {NodePropertiesPanelProps} props
 * @returns {React.ReactElement}
 */
function NodePropertiesPanel({ selectedNode, onUpdateNode }) {
  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p>Select a node to edit properties</p>
        </div>
      </div>
    );
  }

  const config = selectedNode.config || {};

  /**
   * Updates a config field
   * @param {string} key - Config key to update
   * @param {any} value - New value for the key
   * @returns {void}
   */
  const updateConfig = 
    /**
     * @param {string} key
     * @param {any} value
     */
    (key, value) => {
      onUpdateNode(selectedNode.id, { ...config, [key]: value });
    };

  /**
   * Adds a new DTMF mapping
   * @returns {void}
   */
  const addDTMFMapping = () => {
    /** @type {DTMFMapping[]} */
    const mappings = config.dtmfMappings || [];
    updateConfig("dtmfMappings", [
      ...mappings,
      /** @type {DTMFMapping} */ ({ key: "1", action: "", targetNodeId: "" })
    ]);
  };

  /**
   * Updates a DTMF mapping
   * @param {number} index - Index of mapping to update
   * @param {Partial<DTMFMapping>} updates - Updates to apply
   * @returns {void}
   */
  const updateDTMFMapping = 
    /**
     * @param {number} index
     * @param {Partial<DTMFMapping>} updates
     */
    (index, updates) => {
      /** @type {DTMFMapping[]} */
      const mappings = [...(config.dtmfMappings || [])];
      mappings[index] = { ...mappings[index], ...updates };
      updateConfig("dtmfMappings", mappings);
    };

  /**
   * Removes a DTMF mapping
   * @param {number} index - Index of mapping to remove
   * @returns {void}
   */
  const removeDTMFMapping = 
    /**
     * @param {number} index
     */
    (index) => {
      /** @type {DTMFMapping[]} */
      const mappings = (config.dtmfMappings || []).filter((_, i) => i !== index);
      updateConfig("dtmfMappings", mappings);
    };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      
      {/* Node Info */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          {selectedNode.label}
        </h3>
        <p className="text-xs text-slate-500">
          {NODE_TEMPLATES.find(t => t.type === selectedNode.type)?.description}
        </p>
      </div>

      {/* Play Message / Menu Node - Audio Config */}
      {(selectedNode.type === "play_message" || selectedNode.type === "menu") && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Prompt
            </label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => updateConfig("audioSource", "upload")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  config.audioSource === "upload"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => updateConfig("audioSource", "tts")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  config.audioSource === "tts"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                TTS
              </button>
            </div>

            {config.audioSource === "upload" && (
              <input
                type="file"
                accept="audio/*"
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4
                           file:rounded-md file:border-0 file:text-sm file:font-medium
                           file:bg-slate-900 file:text-white hover:file:bg-slate-800
                           file:cursor-pointer"
              />
            )}

            {config.audioSource === "tts" && (
              <textarea
                value={config.ttsText || ""}
                onChange={(e) => updateConfig("ttsText", e.target.value)}
                placeholder="Enter text to convert to speech..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                           placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Language
            </label>
            <select
              value={config.language || "en-US"}
              onChange={(e) => updateConfig("language", /** @type {LanguageCode} */ (e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Timeout (seconds)
            </label>
            <input
              type="number"
              value={config.timeout || 5}
              onChange={(e) => updateConfig("timeout", parseInt(e.target.value, 10))}
              min={1}
              max={60}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </>
      )}

      {/* Menu Node - DTMF Mappings */}
      {selectedNode.type === "menu" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-slate-700">
              DTMF Keys
            </label>
            <button
              onClick={addDTMFMapping}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              + Add Key
            </button>
          </div>
          
          <div className="space-y-2">
            {(config.dtmfMappings || []).map((mapping, index) => (
              <div key={index} className="flex gap-2 items-start p-2 bg-slate-50 rounded border border-slate-200">
                <select
                  value={mapping.key}
                  onChange={(e) => updateDTMFMapping(index, { key: e.target.value })}
                  className="w-16 px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
                >
                  {DTMF_KEYS.map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={mapping.action}
                  onChange={(e) => updateDTMFMapping(index, { action: e.target.value })}
                  placeholder="Action (e.g., Sales)"
                  className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
                <button
                  onClick={() => removeDTMFMapping(index)}
                  className="p-1.5 text-slate-400 hover:text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Node */}
      {selectedNode.type === "queue" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Queue
          </label>
          <select
            value={config.queueId || ""}
            onChange={(e) => updateConfig("queueId", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Select Queue</option>
            <option value="sales">Sales Queue</option>
            <option value="support">Support Queue</option>
            <option value="billing">Billing Queue</option>
          </select>
        </div>
      )}

      {/* Bot Node */}
      {selectedNode.type === "bot" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Bot
          </label>
          <select
            value={config.botId || ""}
            onChange={(e) => updateConfig("botId", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Select Bot</option>
            <option value="general">General Assistant</option>
            <option value="sales">Sales Bot</option>
            <option value="support">Support Bot</option>
          </select>
        </div>
      )}

      {/* Transfer Node */}
      {selectedNode.type === "transfer" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Transfer Number
          </label>
          <input
            type="tel"
            value={config.transferNumber || ""}
            onChange={(e) => updateConfig("transferNumber", e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      )}

      {/* Fallback (for most nodes) */}
      {selectedNode.type !== "start" && selectedNode.type !== "end_call" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fallback
          </label>
          <select
            value={config.fallbackNodeId || ""}
            onChange={(e) => updateConfig("fallbackNodeId", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">End Call</option>
            <option value="voicemail">Voicemail</option>
            <option value="queue">Default Queue</option>
          </select>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// CANVAS NODE COMPONENT
// ============================================================================

/**
 * @typedef {Object} CanvasNodeProps
 * @property {IVRNode} node
 * @property {boolean} isSelected
 * @property {boolean} isConnecting
 * @property {string | null} connectingFrom
 * @property {(node: IVRNode) => void} onSelect
 * @property {(nodeId: string, position: Position) => void} onMove
 * @property {(nodeId: string) => void} onStartConnection
 * @property {(nodeId: string) => void} onCompleteConnection
 */

/**
 * Canvas Node Component
 * 
 * @param {CanvasNodeProps} props
 * @returns {React.ReactElement}
 */
function CanvasNode({ 
  node, 
  isSelected, 
  isConnecting, 
  connectingFrom,
  onSelect, 
  onMove, 
  onStartConnection,
  onCompleteConnection 
}) {
  const template = NODE_TEMPLATES.find(t => t.type === node.type);
  
  /**
   * Gets color classes based on node type
   * @returns {string}
   */
  const getNodeColor = () => {
    switch (node.type) {
      case "start":
        return "bg-green-100 border-green-500 text-green-900";
      case "end_call":
        return "bg-red-100 border-red-500 text-red-900";
      case "menu":
        return "bg-blue-100 border-blue-500 text-blue-900";
      case "queue":
        return "bg-purple-100 border-purple-500 text-purple-900";
      case "bot":
        return "bg-indigo-100 border-indigo-500 text-indigo-900";
      default:
        return "bg-slate-100 border-slate-500 text-slate-900";
    }
  };

  /**
   * Handles clicking on the output connection point
   * @param {React.MouseEvent} e
   */
  const handleOutputClick = (e) => {
    e.stopPropagation();
    if (!isConnecting) {
      // Start a new connection from this node
      onStartConnection(node.id);
    } else if (connectingFrom !== node.id) {
      // Complete connection to this node
      onCompleteConnection(node.id);
    }
  };

  /**
   * Handles clicking on the input connection point
   * @param {React.MouseEvent} e
   */
  const handleInputClick = (e) => {
    e.stopPropagation();
    if (isConnecting && connectingFrom !== node.id) {
      // Complete connection to this node
      onCompleteConnection(node.id);
    } else if (!isConnecting) {
      // Can also start from input point
      onStartConnection(node.id);
    }
  };

  const isHighlighted = isConnecting && connectingFrom !== node.id;

  return (
    <div
      onClick={() => onSelect(node)}
      className={`absolute cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-slate-900 ring-offset-2" : ""
      } ${isHighlighted ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        width: "180px"
      }}
    >
      <div className={`px-4 py-3 border-2 rounded-lg ${getNodeColor()}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            {/* Icon placeholder */}
            <div className="w-4 h-4 bg-current opacity-50 rounded" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{node.label}</div>
            <div className="text-xs opacity-75">{template?.label}</div>
          </div>
        </div>
        
        {/* Output connection point (right) */}
        <button
          onClick={handleOutputClick}
          onMouseDown={(e) => e.stopPropagation()}
          className={`absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                      hover:scale-150 transition-all z-10 cursor-pointer ${
                        connectingFrom === node.id 
                          ? "bg-blue-500 border-4 border-blue-300 animate-pulse shadow-lg shadow-blue-500/50" 
                          : "bg-white border-3 border-current hover:bg-blue-100"
                      }`}
          title={connectingFrom === node.id ? "Click target node" : "Click to start connection"}
        />
        
        {/* Input connection point (left) */}
        <button
          onClick={handleInputClick}
          onMouseDown={(e) => e.stopPropagation()}
          className={`absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                      hover:scale-150 transition-all z-10 cursor-pointer ${
                        isHighlighted 
                          ? "bg-green-500 border-4 border-green-300 scale-125 shadow-lg shadow-green-500/50 animate-pulse" 
                          : "bg-white border-3 border-current hover:bg-green-100"
                      }`}
          title={isHighlighted ? "Click to complete connection" : "Click to start connection"}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN IVR BUILDER PAGE COMPONENT
// ============================================================================

/**
 * IVR Builder Page Component
 * 
 * @param {{ivrId?: string}} props
 * @returns {React.ReactElement}
 */
export default function IVRBuilderPage({ ivrId }) {
  // RTK Query hooks
  const { data: ivrData, isLoading } = useGetIVRQuery(ivrId, { skip: !ivrId });
  const [saveDraft] = useSaveIVRDraftMutation();
  const [publish] = usePublishIVRMutation();
  const { data: versions = [] } = useGetIVRVersionsQuery(ivrId, { skip: !ivrId });

  // State
  /** @type {[IVRNode[], React.Dispatch<React.SetStateAction<IVRNode[]>>]} */
  const [nodes, setNodes] = useState(
    ivrData?.nodes || [
      {
        id: "start-1",
        type: "start",
        label: "Start",
        position: { x: 100, y: 100 },
        config: {}
      }
    ]
  );

  /** @type {[Connection[], React.Dispatch<React.SetStateAction<Connection[]>>]} */
  const [connections, setConnections] = useState(ivrData?.connections || []);

  /** @type {[IVRNode | null, React.Dispatch<React.SetStateAction<IVRNode | null>>]} */
  const [selectedNode, setSelectedNode] = useState(/** @type {IVRNode | null} */ (null));

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isSaving, setIsSaving] = useState(false);

  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [connectingFrom, setConnectingFrom] = useState(/** @type {string | null} */ (null));

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isConnecting, setIsConnecting] = useState(false);

  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [selectedConnection, setSelectedConnection] = useState(/** @type {string | null} */ (null));

  /**
   * Adds a node to the canvas
   * @param {NodeType} type - Type of node to add
   * @returns {void}
   */
  const addNode = useCallback(
    /**
     * @param {NodeType} type
     */
    (type) => {
      const template = NODE_TEMPLATES.find(t => t.type === type);
      if (!template) return;

      /** @type {IVRNode} */
      const newNode = {
        id: `${type}-${Date.now()}`,
        type: type,
        label: template.label,
        position: { x: 300, y: 200 + nodes.length * 100 },
        config: {}
      };

      setNodes((prev) => [...prev, newNode]);
    },
    [nodes.length]
  );

  /**
   * Updates a node's configuration
   * @param {string} nodeId - ID of the node to update
   * @param {Object} config - New configuration object
   * @returns {void}
   */
  const updateNodeConfig = useCallback(
    /**
     * @param {string} nodeId
     * @param {Object} config
     */
    (nodeId, config) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId ? { ...node, config } : node
        )
      );
    },
    []
  );

  /**
   * Deletes the selected node
   */
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    
    setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id));
    setConnections((prev) =>
      prev.filter((c) => c.sourceNodeId !== selectedNode.id && c.targetNodeId !== selectedNode.id)
    );
    setSelectedNode(null);
  }, [selectedNode]);

  /**
   * Starts a connection from a node
   * @param {string} nodeId - Source node ID
   * @returns {void}
   */
  const startConnection = useCallback(
    /**
     * @param {string} nodeId
     */
    (nodeId) => {
      console.log('Starting connection from:', nodeId);
      setConnectingFrom(nodeId);
      setIsConnecting(true);
    },
    []
  );

  /**
   * Completes a connection to a target node
   * @param {string} targetNodeId - Target node ID
   * @returns {void}
   */
  const completeConnection = useCallback(
    /**
     * @param {string} targetNodeId
     */
    (targetNodeId) => {
      console.log('Completing connection:', { connectingFrom, targetNodeId });
      
      if (!connectingFrom || connectingFrom === targetNodeId) {
        console.log('Invalid connection - same node or no source');
        setConnectingFrom(null);
        setIsConnecting(false);
        return;
      }

      // Check if connection already exists
      const exists = connections.some(
        (c) => c.sourceNodeId === connectingFrom && c.targetNodeId === targetNodeId
      );

      if (exists) {
        console.log('Connection already exists');
        setConnectingFrom(null);
        setIsConnecting(false);
        return;
      }

      /** @type {Connection} */
      const newConnection = {
        id: `conn-${Date.now()}`,
        sourceNodeId: connectingFrom,
        targetNodeId: targetNodeId
      };

      console.log('Creating new connection:', newConnection);
      setConnections((prev) => [...prev, newConnection]);
      setConnectingFrom(null);
      setIsConnecting(false);
    },
    [connectingFrom, connections]
  );

  /**
   * Cancels an ongoing connection
   * @returns {void}
   */
  const cancelConnection = useCallback(() => {
    setConnectingFrom(null);
    setIsConnecting(false);
  }, []);

  /**
   * Deletes a connection
   * @param {string} connectionId - Connection ID to delete
   * @returns {void}
   */
  const deleteConnection = useCallback(
    /**
     * @param {string} connectionId
     */
    (connectionId) => {
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      setSelectedConnection(null);
    },
    []
  );

  /**
   * Saves the IVR as draft
   */
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveDraft({ id: ivrId, nodes, connections }).unwrap();
      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Failed to save draft:", error);
      alert("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Publishes the IVR
   */
  const handlePublish = async () => {
    if (!window.confirm("Are you sure you want to publish this IVR flow?")) return;
    
    setIsSaving(true);
    try {
      await publish({ id: ivrId, nodes, connections }).unwrap();
      alert("IVR published successfully!");
    } catch (error) {
      console.error("Failed to publish:", error);
      alert("Failed to publish. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-600">Loading IVR builder...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">IVR Builder</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Visual flow editor for Interactive Voice Response
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 
                         rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg 
                         hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Publish
            </button>
            <button className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
              Version History
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel - Node Palette */}
        <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Nodes</h2>
            <div className="space-y-2">
              {NODE_TEMPLATES.map((template) => (
                <button
                  key={template.type}
                  onClick={() => addNode(template.type)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-200
                             hover:bg-slate-50 hover:border-slate-300 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded group-hover:bg-slate-200">
                      <div className="w-4 h-4 bg-slate-400 rounded" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{template.label}</div>
                      <div className="text-xs text-slate-500 truncate">{template.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }} />
          
          {/* Canvas content */}
          <div 
            className="absolute inset-0 overflow-auto p-8"
            onClick={(e) => {
              const target = /** @type {HTMLElement} */ (e.target);
              if (e.target === e.currentTarget || target.tagName === 'svg') {
                cancelConnection();
                setSelectedConnection(null);
              }
            }}
          >
            <div className="relative min-w-[2000px] min-h-[2000px]">
              {nodes.map((node) => (
                <CanvasNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNode?.id === node.id}
                  isConnecting={isConnecting}
                  connectingFrom={connectingFrom}
                  onSelect={setSelectedNode}
                  onMove={(nodeId, position) => {
                    setNodes((prev) =>
                      prev.map((n) => (n.id === nodeId ? { ...n, position } : n))
                    );
                  }}
                  onStartConnection={startConnection}
                  onCompleteConnection={completeConnection}
                />
              ))}
              
              {/* SVG for connections */}
              <svg className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
                {connections.map((conn) => {
                  const source = nodes.find((n) => n.id === conn.sourceNodeId);
                  const target = nodes.find((n) => n.id === conn.targetNodeId);
                  if (!source || !target) return null;

                  // Calculate connection points
                  const sourceX = source.position.x + 180; // Right side of source node
                  const sourceY = source.position.y + 35; // Middle of node (adjusted for padding)
                  const targetX = target.position.x; // Left side of target node
                  const targetY = target.position.y + 35; // Middle of node

                  // Calculate control points for smooth curve
                  const dx = targetX - sourceX;
                  const controlPointOffset = Math.abs(dx) * 0.5;
                  
                  // Create a smooth bezier curve path
                  const path = `M ${sourceX} ${sourceY} C ${sourceX + controlPointOffset} ${sourceY}, ${targetX - controlPointOffset} ${targetY}, ${targetX} ${targetY}`;

                  const isSelected = selectedConnection === conn.id;

                  return (
                    <g key={conn.id}>
                      {/* Invisible thick line for easier clicking */}
                      <path
                        d={path}
                        stroke="transparent"
                        strokeWidth="20"
                        fill="none"
                        className="cursor-pointer pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConnection(conn.id);
                        }}
                      />
                      
                      {/* Shadow/outline for better visibility */}
                      <path
                        d={path}
                        stroke={isSelected ? "#ef4444" : "#1e293b"}
                        strokeWidth={isSelected ? "6" : "5"}
                        fill="none"
                        opacity="0.15"
                        className="pointer-events-none"
                      />
                      
                      {/* Main connection line */}
                      <path
                        d={path}
                        stroke={isSelected ? "#ef4444" : "#3b82f6"}
                        strokeWidth={isSelected ? "4" : "3"}
                        fill="none"
                        markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                        className="pointer-events-none transition-all"
                        style={{ 
                          filter: isSelected 
                            ? 'drop-shadow(0 4px 6px rgba(239, 68, 68, 0.4))' 
                            : 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))' 
                        }}
                      />
                      
                      {/* Connection label (optional) */}
                      {conn.label && (
                        <text
                          x={(sourceX + targetX) / 2}
                          y={(sourceY + targetY) / 2 - 10}
                          fill={isSelected ? "#ef4444" : "#64748b"}
                          fontSize="12"
                          fontWeight="600"
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {conn.label}
                        </text>
                      )}

                      {/* Delete button on selected connection */}
                      {isSelected && (
                        <g>
                          <circle
                            cx={(sourceX + targetX) / 2}
                            cy={(sourceY + targetY) / 2}
                            r="12"
                            fill="#ef4444"
                            className="cursor-pointer pointer-events-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConnection(conn.id);
                            }}
                          />
                          <path
                            d={`M ${(sourceX + targetX) / 2 - 4} ${(sourceY + targetY) / 2 - 4} L ${(sourceX + targetX) / 2 + 4} ${(sourceY + targetY) / 2 + 4} M ${(sourceX + targetX) / 2 + 4} ${(sourceY + targetY) / 2 - 4} L ${(sourceX + targetX) / 2 - 4} ${(sourceY + targetY) / 2 + 4}`}
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="pointer-events-none"
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
                <defs>
                  {/* Blue arrowhead for normal connections */}
                  <marker 
                    id="arrowhead" 
                    markerWidth="20" 
                    markerHeight="20" 
                    refX="18" 
                    refY="6" 
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path 
                      d="M 0 0 L 12 6 L 0 12 L 3 6 Z" 
                      fill="#3b82f6"
                      stroke="#3b82f6"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                  </marker>
                  
                  {/* Red arrowhead for selected connections */}
                  <marker 
                    id="arrowhead-selected" 
                    markerWidth="20" 
                    markerHeight="20" 
                    refX="18" 
                    refY="6" 
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path 
                      d="M 0 0 L 12 6 L 0 12 L 3 6 Z" 
                      fill="#ef4444"
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          {/* Canvas toolbar */}
          <div className="absolute bottom-4 left-4 flex gap-2 items-center">
            {isConnecting && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg text-sm font-medium">
                <span className="animate-pulse">● Connecting from node...</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelConnection();
                  }}
                  className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs"
                >
                  Cancel (ESC)
                </button>
              </div>
            )}
            <button className="px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-sm font-medium text-slate-700">
              Zoom Out
            </button>
            <button className="px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-sm font-medium text-slate-700">
              Reset
            </button>
            <button className="px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-sm font-medium text-slate-700">
              Zoom In
            </button>
          </div>

          {/* Delete button when node selected */}
          {selectedNode && (
            <div className="absolute top-4 right-4">
              <button
                onClick={deleteSelectedNode}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-lg"
              >
                Delete Node
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        <div className="w-80 bg-white border-l border-slate-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Properties</h2>
          </div>
          <NodePropertiesPanel
            selectedNode={selectedNode}
            onUpdateNode={updateNodeConfig}
          />
        </div>

      </div>

    </div>
  );
}