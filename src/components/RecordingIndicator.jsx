import React from 'react';
import '../styles/RecordingIndicator.css';

function RecordingIndicator({ isRecording, recordingTime }) {
  return (
    <div className={`recording-indicator ${isRecording ? 'active' : ''}`}>
      <div className="pulse-dot"></div>
      <span className="recording-status">
        {isRecording ? `Recording: ${recordingTime}` : 'Ready to record'}
      </span>
    </div>
  );
}

export default RecordingIndicator;
