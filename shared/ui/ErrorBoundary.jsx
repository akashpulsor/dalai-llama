import React from "react";

/**
 * @typedef {object} ErrorBoundaryState
 * @property {boolean} hasError
 * @property {Error | null} error
 */

/**
 * @typedef {object} ErrorBoundaryProps
 * @property {React.ReactNode} children
 */

/**
 * A React Error Boundary that gracefully handles runtime errors
 * and shows a fallback UI with a reload option.
 *
 * @extends {React.Component<ErrorBoundaryProps, ErrorBoundaryState>}
 */
export class ErrorBoundary extends React.Component {
  /**
   * @param {ErrorBoundaryProps} props
   */
  constructor(props) {
    super(props);
    /** @type {ErrorBoundaryState} */
    this.state = { hasError: false, error: null };
  }

  /**
   * Updates component state when an error is thrown.
   * @param {Error} error
   * @returns {ErrorBoundaryState}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Logs error details for debugging or reporting.
   * @param {Error} error
   * @param {React.ErrorInfo} info
   */
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-2">Something went wrong</h1>
          <p className="text-gray-700 mb-4">
            {this.state.error?.message || "Unexpected application error."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
