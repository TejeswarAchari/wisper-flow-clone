class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input && input[0]) {
      const inputData = input[0];
      const pcm16 = new Int16Array(inputData.length);
      
      for (let i = 0; i < inputData.length; i++) {
        const sample = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }
      
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }
    
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
