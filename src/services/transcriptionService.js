import { startRecording, stopRecording, stopMediaStream } from './audioService';
import { transcribeAudio } from './deepgramService';

class TranscriptionService {
  constructor() {
    this.isRecording = false;
    this.currentTranscript = '';
    this.onTranscriptUpdate = null;
    this.onRecordingStateChange = null;
    this.transcriptionSettings = {
      model: 'nova-2',
      language: 'en',
      punctuate: true,
      smart_format: true,
    };
  }

  async begin() {
    try {
      const success = await startRecording();
      if (success) {
        this.isRecording = true;
        this.currentTranscript = '';
        this.emit('recordingStateChange', true);
        return { success: true };
      }
      return { success: false, error: 'Failed to start recording' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async end() {
    try {
      if (!this.isRecording) {
        return { success: false, error: 'No recording in progress' };
      }

      const audioBlob = await stopRecording();
      this.isRecording = false;
      this.emit('recordingStateChange', false);

      const result = await transcribeAudio(audioBlob, this.transcriptionSettings);
      
      if (result.success) {
        this.currentTranscript = result.transcript;
        this.emit('transcriptUpdate', {
          transcript: result.transcript,
          confidence: result.confidence,
        });
        return {
          success: true,
          transcript: result.transcript,
          confidence: result.confidence,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      this.isRecording = false;
      this.emit('recordingStateChange', false);
      return { success: false, error: error.message };
    }
  }

  setSettings(settings) {
    this.transcriptionSettings = {
      ...this.transcriptionSettings,
      ...settings,
    };
  }

  getSettings() {
    return this.transcriptionSettings;
  }

  emit(eventName, data) {
    if (eventName === 'transcriptUpdate' && this.onTranscriptUpdate) {
      this.onTranscriptUpdate(data);
    } else if (eventName === 'recordingStateChange' && this.onRecordingStateChange) {
      this.onRecordingStateChange(data);
    }
  }

  cleanup() {
    stopMediaStream();
    this.isRecording = false;
  }
}

export default new TranscriptionService();
