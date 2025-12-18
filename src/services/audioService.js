let mediaStream = null;
let mediaRecorder = null;
let audioChunks = [];

export async function startRecording() {
  try {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.warn('Already recording');
      return false;
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
      },
    });

    audioChunks = [];

    // Find supported MIME type
    let mimeType = 'audio/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/mp4';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';  // Use browser default
    }

    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: mimeType,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder Error:', event.error);
    };

    mediaRecorder.start();
    console.log('🎙️ Recording started with MIME type:', mimeType);
    return true;
  } catch (error) {
    console.error('Microphone Access Error:', error);
    
    if (error.name === 'NotAllowedError') {
      console.error('Microphone permission denied by user');
    } else if (error.name === 'NotFoundError') {
      console.error('No microphone device found');
    } else if (error.name === 'NotSupportedError') {
      console.error('getUserMedia not supported on this browser');
    }
    
    return false;
  }
}

export async function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('No recording in progress'));
      return;
    }

    mediaRecorder.onstop = () => {
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        audioChunks = [];
        stopMediaStream();
        
        console.log('🎙️ Recording stopped, blob created:', audioBlob.size, 'bytes');
        resolve(audioBlob);
      } catch (error) {
        reject(error);
      }
    };

    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });
}

export function stopMediaStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
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
    console.error('Error enumerating audio devices:', error);
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
