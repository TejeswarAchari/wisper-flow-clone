const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

if (!DEEPGRAM_API_KEY) {
  console.error('⚠️ DEEPGRAM_API_KEY not found in environment variables');
}

let ws = null;
let isStreaming = false;

export function createStreamingConnection(options = {}, onTranscript) {
  return new Promise((resolve, reject) => {
    try {
      if (!DEEPGRAM_API_KEY) {
        reject(new Error('Deepgram API key is missing. Check .env file.'));
        return;
      }

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }

      const {
        model = 'nova-2',
        language = 'en',
        punctuate = true,
        smart_format = true,
      } = options;

      const params = new URLSearchParams({
        model,
        language,
        punctuate: punctuate.toString(),
        smart_format: smart_format.toString(),
        interim_results: 'true',
        encoding: 'linear16',
        sample_rate: 16000,
        channels: 1,
      });

      const url = `${DEEPGRAM_WS_URL}?${params}`;
      ws = new WebSocket(url, ['token', DEEPGRAM_API_KEY]);

      ws.binaryType = 'arraybuffer';

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          isStreaming = false;
          reject(new Error('Connection timeout. Check your internet connection.'));
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        isStreaming = true;
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'Results') {
            const transcript = data.channel?.alternatives?.[0]?.transcript || '';
            const confidence = data.channel?.alternatives?.[0]?.confidence || 0;
            const isFinal = data.is_final || false;

            if (transcript) {
              onTranscript({
                transcript,
                confidence,
                isFinal,
              });
            }
          }

          if (data.type === 'Error') {
            console.error('Deepgram Error:', data.error);
            reject(new Error(`Deepgram: ${data.error}`));
          }
        } catch (e) {
          console.error('Error parsing Deepgram message:', e);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error);
        isStreaming = false;
        reject(new Error('Cannot connect to Deepgram. Check API key and internet.'));
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        isStreaming = false;
        if (event.code !== 1000 && event.code !== 1005) {
          console.error('WebSocket closed unexpectedly:', event.code, event.reason);
        }
      };
    } catch (error) {
      reject(error);
    }
  });
}

export function sendAudioChunk(data) {
  if (ws && isStreaming && ws.readyState === WebSocket.OPEN) {
    ws.send(data);
  }
}

export function closeStream() {
  if (ws) {
    ws.close();
    ws = null;
    isStreaming = false;
  }
}

export function isStreamActive() {
  return isStreaming && ws && ws.readyState === WebSocket.OPEN;
}

export function getSupportedModels() {
  return [
    { id: 'nova-2', name: 'Nova 2 (Latest)', accuracy: 'Highest' },
    { id: 'nova', name: 'Nova', accuracy: 'High' },
    { id: 'enhanced', name: 'Enhanced', accuracy: 'Medium' },
    { id: 'base', name: 'Base', accuracy: 'Medium' },
  ];
}

export function getSupportedLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese (Mandarin)' },
    { code: 'hi', name: 'Hindi' },
  ];
}

export default {
  createStreamingConnection,
  sendAudioChunk,
  closeStream,
  isStreamActive,
  getSupportedModels,
  getSupportedLanguages,
};
