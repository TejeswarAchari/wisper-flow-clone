import { useState, useEffect, useCallback, useRef } from 'react';
import audioService from '../services/audioService';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    const success = await audioService.startRecording();
    
    if (success) {
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setError('Failed to access microphone. Check permissions.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
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
