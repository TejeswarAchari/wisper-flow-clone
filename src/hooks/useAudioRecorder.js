import { useState, useEffect, useCallback, useRef } from 'react';
import audioService from '../services/audioService';
import { requestTauriMicrophonePermission } from '../services/tauriMicrophone';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const startRecording = useCallback(async (onAudioChunk = null) => {
    setError(null);
    
    try {
      await requestTauriMicrophonePermission();
    } catch (err) {
      // Tauri permission check - fallback to browser permissions
    }

    try {
      const success = await audioService.startRecording(onAudioChunk);
      if (success) {
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        return true;
      } else {
        setError('Failed to access microphone. Check permissions.');
        return false;
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Allow access in system settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Your browser does not support microphone access.');
      } else {
        setError(err.message || 'Failed to access microphone.');
      }
      return false;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    
    try {
      const audioBlob = await audioService.stopRecording();
      return audioBlob;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      audioService.stopMediaStream();
    };
  }, []);

  return {
    isRecording,
    recordingTime,
    error,
    startRecording,
    stopRecording,
  };
}

export default useAudioRecorder;
