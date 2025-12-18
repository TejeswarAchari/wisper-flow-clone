const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
const DEEPGRAM_URL = 'https://api.deepgram.com/v1/listen';

if (!DEEPGRAM_API_KEY) {
  console.error('⚠️ DEEPGRAM_API_KEY not found in environment variables');
}

export async function transcribeAudio(audioBlob, options = {}) {
  try {
    // Log for debugging
    console.log('🎵 Sending audio to Deepgram:', {
      size: audioBlob.size,
      type: audioBlob.type,
    });

    if (audioBlob.size < 100) {
      return {
        success: false,
        error: 'Audio too short. Please speak for at least 1 second.',
        transcript: '',
        confidence: 0,
      };
    }

    const {
      model = 'nova-2',
      language = 'en',
      punctuate = true,
      smart_format = true,
      diarize = false,
      utterances = true,
    } = options;

    const params = new URLSearchParams({
      model,
      language,
      punctuate: punctuate.toString(),
      smart_format: smart_format.toString(),
      diarize: diarize.toString(),
      utterances: utterances.toString(),
    });

    console.log('📡 API URL:', `${DEEPGRAM_URL}?${params}`);

    const response = await fetch(`${DEEPGRAM_URL}?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: audioBlob,
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const error = await response.json();
        errorMsg = error.msg || error.message || response.statusText;
      } catch (e) {
        const text = await response.text();
        errorMsg = text || response.statusText;
      }
      throw new Error(`Deepgram API Error (${response.status}): ${errorMsg}`);
    }

    const result = await response.json();
    console.log('✅ Deepgram Response:', result);
    
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    return {
      success: true,
      transcript,
      confidence,
      raw: result,
    };
  } catch (error) {
    console.error('Transcription Error:', error);
    return {
      success: false,
      error: error.message,
      transcript: '',
      confidence: 0,
    };
  }
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
  transcribeAudio,
  getSupportedModels,
  getSupportedLanguages,
};
