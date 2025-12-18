let mediaStream = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let audioContext = null;
let processor = null;
let sourceNode = null;

export async function startRecording(onAudioChunk = null) {
  try {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      return false;
    }

    stopMediaStream();

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: { ideal: 16000 },
      },
    });

    audioChunks = [];
    recordingStartTime = Date.now();

    if (onAudioChunk) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        await audioContext.audioWorklet.addModule('/audio-processor.js');
        
        sourceNode = audioContext.createMediaStreamSource(mediaStream);
        processor = new AudioWorkletNode(audioContext, 'audio-processor');
        
        processor.port.onmessage = (event) => {
          if (event.data.type === 'debug') return;
          onAudioChunk(event.data);
        };
        
        sourceNode.connect(processor);
        processor.connect(audioContext.destination);
      } catch (e) {
        console.error('Audio worklet setup failed:', e);
        stopMediaStream();
        return false;
      }
    } else {
      let mimeType = 'audio/webm';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      
      for (const type of supportedTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      try {
        mediaRecorder = new MediaRecorder(mediaStream, {
          mimeType: mimeType,
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event.error);
        };

        mediaRecorder.start();
      } catch (e) {
        console.error('MediaRecorder not available, using AudioWorklet only');
      }
    }

    return true;
  } catch (error) {
    console.error('Microphone access error:', error.name);
    stopMediaStream();
    return false;
  }
}

export async function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || !mediaRecorder.state || mediaRecorder.state === 'inactive') {
      stopMediaStream();
      resolve(null);
      return;
    }

    const recordingTime = recordingStartTime ? Date.now() - recordingStartTime : 0;

    let stopHandled = false;

    mediaRecorder.onstop = () => {
      if (stopHandled) return;
      stopHandled = true;

      try {
        if (audioChunks.length === 0) {
          resolve(null);
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        if (audioBlob.size === 0) {
          resolve(null);
          return;
        }

        audioChunks = [];
        resolve(audioBlob);
      } catch (error) {
        console.error('Error creating audio blob:', error);
        reject(error);
      } finally {
        stopMediaStream();
      }
    };

    if (mediaRecorder.state === 'recording') {
      try {
        mediaRecorder.stop();
      } catch (e) {
        console.error('Error stopping mediaRecorder:', e);
        stopHandled = true;
        stopMediaStream();
        resolve(null);
      }
    }
  });
}

export function stopMediaStream() {
  if (processor) {
    try {
      processor.port.close();
      processor.disconnect();
    } catch (e) {
      console.warn('Error closing processor:', e);
    }
    processor = null;
  }
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      track.stop();
    });
    mediaStream = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch (e) {
      console.warn('Error stopping recorder:', e);
    }
  }
  mediaRecorder = null;
}

export function isSupported() {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  );
}

export function getRecordingState() {
  return mediaRecorder ? mediaRecorder.state : null;
}

export async function getAudioDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('❌ Error enumerating audio devices:', error);
    return [];
  }
}

export default {
  startRecording,
  stopRecording,
  stopMediaStream,
  isSupported,
  getRecordingState,
  getAudioDevices,
};
