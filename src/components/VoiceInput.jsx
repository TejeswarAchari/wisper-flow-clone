import React, { useState, useCallback } from 'react';
import useAudioRecorder from '../hooks/useAudioRecorder';
import { transcribeAudio } from '../services/deepgramService';
import RecordingIndicator from './RecordingIndicator';
import TranscriptionDisplay from './TranscriptionDisplay';
import '../styles/VoiceInput.css';

function VoiceInput() {
  const { isRecording, recordingTime, error, startRecording, stopRecording } = useAudioRecorder();
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [model, setModel] = useState('nova-2');
  const [language, setLanguage] = useState('en');
  const [history, setHistory] = useState([]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleMouseDown = async () => {
    setTranscriptionError(null);
    const success = await startRecording();
    if (!success) {
      setTranscriptionError('Failed to start recording');
    }
  };

  const handleMouseUp = async () => {
    const audioBlob = await stopRecording();
    
    if (audioBlob) {
      setIsTranscribing(true);
      
      try {
        const result = await transcribeAudio(audioBlob, {
          model,
          language,
          punctuate: true,
          smart_format: true,
        });

        if (result.success) {
          setTranscript(result.transcript);
          setConfidence(result.confidence);
          setTranscriptionError(null);
          
          setHistory(prev => [{
            timestamp: new Date(),
            transcript: result.transcript,
            confidence: result.confidence,
          }, ...prev].slice(0, 10));
        } else {
          setTranscriptionError(result.error);
        }
      } catch (err) {
        setTranscriptionError('Transcription failed: ' + err.message);
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  const handleMouseLeave = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        setIsTranscribing(true);
        try {
          const result = await transcribeAudio(audioBlob, {
            model,
            language,
            punctuate: true,
            smart_format: true,
          });

          if (result.success) {
            setTranscript(result.transcript);
            setConfidence(result.confidence);
          }
        } finally {
          setIsTranscribing(false);
        }
      }
    }
  };

  const handleClear = () => {
    setTranscript('');
    setConfidence(0);
    setTranscriptionError(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      alert('Transcript copied to clipboard!');
    } catch (err) {
      setTranscriptionError('Failed to copy to clipboard');
    }
  };

  return (
    <div className="voice-input-container">
      <div className="voice-input-card">
        <div className="voice-header">
          <h1>🎙️ Wispr Flow</h1>
          <p className="subtitle">Voice-to-Text Transcription</p>
        </div>

        <div className="settings-section">
          <div className="setting-group">
            <label htmlFor="model">Model</label>
            <select 
              id="model"
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              disabled={isRecording || isTranscribing}
            >
              <option value="nova-2">Nova 2 (Latest)</option>
              <option value="nova">Nova</option>
              <option value="enhanced">Enhanced</option>
              <option value="base">Base</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="language">Language</label>
            <select 
              id="language"
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isRecording || isTranscribing}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="nl">Dutch</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>

        <RecordingIndicator 
          isRecording={isRecording}
          recordingTime={formatTime(recordingTime)}
        />

        <div className="button-section">
          <button
            className={`voice-button ${isRecording ? 'recording' : ''} ${isTranscribing ? 'disabled' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            disabled={isTranscribing}
            title="Press and hold to record"
          >
            <span className="button-icon">🎙️</span>
            <span className="button-text">
              {isTranscribing 
                ? 'Transcribing...' 
                : isRecording 
                  ? `Recording... ${formatTime(recordingTime)}` 
                  : 'Press & Hold to Record'}
            </span>
          </button>
        </div>

        {(error || transcriptionError) && (
          <div className="error-message">
            ⚠️ {error || transcriptionError}
          </div>
        )}

        <TranscriptionDisplay
          transcript={transcript}
          confidence={confidence}
          onClear={handleClear}
          onCopy={handleCopy}
        />

        {history.length > 0 && (
          <div className="history-section">
            <h3>📝 Recent Transcriptions</h3>
            <div className="history-list">
              {history.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-text">{item.transcript}</div>
                  <div className="history-meta">
                    <span className="history-time">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="history-confidence">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceInput;
