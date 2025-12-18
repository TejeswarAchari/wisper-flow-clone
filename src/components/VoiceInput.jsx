import React, { useState, useCallback, useEffect, useRef } from 'react';
import useAudioRecorder from '../hooks/useAudioRecorder';
import { createStreamingConnection, sendAudioChunk, closeStream } from '../services/deepgramService';
import RecordingIndicator from './RecordingIndicator';
import TranscriptionDisplay from './TranscriptionDisplay';
import '../styles/VoiceInput.css';

function VoiceInput() {
  const { isRecording, recordingTime, error, startRecording, stopRecording } = useAudioRecorder();
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [model, setModel] = useState('nova-2');
  const [language, setLanguage] = useState('en');
  const [history, setHistory] = useState([]);
  const recordingTimeoutRef = useRef(null);
  const streamRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleRecordingStop = useCallback(async () => {
    setIsTranscribing(false);
    closeStream();
    streamRef.current = null;

    if (finalTranscript.trim()) {
      setHistory(prev => [{
        timestamp: new Date(),
        transcript: finalTranscript,
        confidence: confidence,
      }, ...prev].slice(0, 10));
    }
  }, [finalTranscript, confidence]);

  const handleMouseDown = async () => {
    setTranscriptionError(null);
    setLiveTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setIsTranscribing(true);

    try {
      const micSuccess = await startRecording((pcmData) => {
        sendAudioChunk(pcmData);
      });

      if (!micSuccess) {
        setTranscriptionError('Microphone access denied. Please allow microphone permissions.');
        setIsTranscribing(false);
        return;
      }

      await createStreamingConnection(
        { model, language, punctuate: true, smart_format: true },
        (result) => {
          if (result.isFinal) {
            setFinalTranscript(prev => prev + (prev ? ' ' : '') + result.transcript);
            setLiveTranscript('');
            setConfidence(result.confidence);
          } else {
            setLiveTranscript(result.transcript);
          }
        }
      );
    } catch (err) {
      setTranscriptionError(err.message || 'Failed to start recording');
      closeStream();
      await stopRecording();
      setIsTranscribing(false);
    }
  };

  const handleMouseUp = async () => {
    try {
      await stopRecording();
      await handleRecordingStop();
    } catch (err) {
      setTranscriptionError('Recording error: ' + err.message);
    }
  };

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if ((e.code === 'Space' || e.code === 'KeyX') && !isRecording && !isTranscribing) {
        e.preventDefault();
        await handleMouseDown();
      }
    };

    const handleKeyUp = async (e) => {
      if ((e.code === 'Space' || e.code === 'KeyX') && isRecording) {
        e.preventDefault();
        await handleMouseUp();
      }
    };

    const handleGlobalMouseUp = async (e) => {
      if (isRecording) {
        await handleMouseUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isRecording, isTranscribing]);

  const handleClear = () => {
    setFinalTranscript('');
    setLiveTranscript('');
    setConfidence(0);
    setTranscriptionError(null);
  };

  const handleCopy = async () => {
    try {
      const text = finalTranscript || liveTranscript;
      await navigator.clipboard.writeText(text);
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
            className={`voice-button ${isRecording ? 'recording' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            disabled={false}
            title="Press and hold to record (release anywhere to stop)"
          >
            <span className="button-icon">🎙️</span>
            <span className="button-text">
              {isRecording 
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

        {(liveTranscript || finalTranscript) && (
          <div className="live-transcript">
            <div className="transcript-content">
              <span className="final">{finalTranscript}</span>
              {liveTranscript && <span className="interim">{liveTranscript}</span>}
            </div>
          </div>
        )}

        <TranscriptionDisplay
          transcript={finalTranscript}
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
