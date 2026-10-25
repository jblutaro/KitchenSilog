export class Audio {
  constructor() { this.enabled = false; this.voices = []; }
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) { this.context ||= new AudioContext(); this.context.resume(); }
    else this.sizzle(0);
    return this.enabled;
  }
  play(name) {
    if (!this.enabled) return;
    const tones = { open: 180, close: 130, flip: 550, plate: 800, trash: 95, serve: 1046, coin: 1568, pick: 460 };
    const context = this.context, oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = name === 'trash' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(tones[name] || 400, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime((tones[name] || 400) * 0.6, context.currentTime + 0.18);
    gain.gain.setValueAtTime(0.07, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.23);
    oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.24);
  }
  sizzle(count) {
    const wanted = this.enabled ? count : 0;
    while (this.voices.length > wanted) this.voices.pop().stop();
    while (this.voices.length < wanted) {
      const context = this.context, buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      const source = context.createBufferSource(), gain = context.createGain(), filter = context.createBiquadFilter();
      source.buffer = buffer; source.loop = true; gain.gain.value = 0.008;
      filter.type = 'highpass'; filter.frequency.value = 2000;
      source.connect(filter).connect(gain).connect(context.destination); source.start(); this.voices.push(source);
    }
  }
}
