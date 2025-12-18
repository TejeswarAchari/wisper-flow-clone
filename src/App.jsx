import React, { useEffect, useState } from 'react';
import VoiceInput from './components/VoiceInput';
import audioService from './services/audioService';
import './App.css';

function App() {
  const [isSupported, setIsSupported] = useState(true);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  useEffect(() => {
    if (!audioService.isSupported()) {
      setIsSupported(false);
    }

    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    if (apiKey && apiKey.length > 0) {
      setApiKeyConfigured(true);
    }
  }, []);

  if (!isSupported) {
    return (
      <div className="error-container">
        <h1>⚠️ Browser Not Supported</h1>
        <p>Your browser doesn't support the required APIs for audio recording.</p>
        <p>Please use a modern browser like Chrome, Firefox, or Edge.</p>
      </div>
    );
  }

  if (!apiKeyConfigured) {
    return (
      <div className="error-container">
        <h1>⚠️ Configuration Error</h1>
        <p>Deepgram API key is not configured.</p>
        <p>Please set the <code>VITE_DEEPGRAM_API_KEY</code> environment variable.</p>
        <ol>
          <li>Create a <code>.env</code> file in the project root</li>
          <li>Add: <code>VITE_DEEPGRAM_API_KEY=your_api_key_here</code></li>
          <li>Restart the development server</li>
        </ol>
      </div>
    );
  }

  return (
    <div className="app">
      <VoiceInput />
    </div>
  );
}

export default App;
