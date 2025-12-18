import { useState, useCallback } from 'react';

export function useTranscription() {
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const transcribe = useCallback(async (audioBlob) => {
    setIsTranscribing(true);
    setError(null);

    try {
      setIsTranscribing(false);
    } catch (err) {
      setError(err.message);
      setIsTranscribing(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
  }, []);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      return true;
    } catch (err) {
      setError('Failed to copy to clipboard');
      return false;
    }
  }, [transcript]);

  return {
    transcript,
    confidence,
    isTranscribing,
    error,
    history,
    transcribe,
    clearTranscript,
    copyToClipboard,
    setTranscript,
    setConfidence,
    setHistory,
  };
}

export default useTranscription;
