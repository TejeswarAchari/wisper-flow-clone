import React from 'react';
import '../styles/TranscriptionDisplay.css';

function TranscriptionDisplay({ transcript, confidence, onClear, onCopy }) {
  if (!transcript) {
    return null;
  }

  return (
    <div className="transcription-display fade-in">
      <div className="transcription-header">
        <h3>📄 Transcribed Text</h3>
        <div className="transcription-meta">
          <span className="confidence-badge">
            Confidence: {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>

      <div className="transcription-text">
        {transcript}
      </div>

      <div className="transcription-actions">
        <button 
          className="btn btn-primary"
          onClick={onCopy}
          title="Copy to clipboard"
        >
          📋 Copy
        </button>
        <button 
          className="btn btn-secondary"
          onClick={onClear}
          title="Clear transcript"
        >
          ✕ Clear
        </button>
      </div>
    </div>
  );
}

export default TranscriptionDisplay;
