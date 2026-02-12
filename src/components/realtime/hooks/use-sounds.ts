import { useCallback, useRef } from "react";

export const useSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return null;
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  const playTone = useCallback((startFreq: number, endFreq: number, duration: number, vol: number) => {
    try {
      const ctx = getContext();
      if (!ctx) return;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      const startTime = ctx.currentTime;

      oscillator.frequency.setValueAtTime(startFreq, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(vol, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (error) {
      console.error("Failed to play notification sound", error);
    }
  }, [getContext]);

  const playKeyboardClick = useCallback((variant: "press" | "release") => {
    try {
      const ctx = getContext();
      if (!ctx) return;

      const duration = variant === "press" ? 0.055 : 0.04;
      const volume = variant === "press" ? 0.18 : 0.14;
      const bufferSize = Math.ceil(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Short noise burst to mimic a key click.
      for (let i = 0; i < bufferSize; i += 1) {
        const fade = 1 - i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * fade;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const highPass = ctx.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = variant === "press" ? 650 : 900;

      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 8000;

      const gainNode = ctx.createGain();
      const startTime = ctx.currentTime;
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.003);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      source.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(startTime);
      source.stop(startTime + duration);
    } catch (err) {
      console.error(err);
    }
  }, [getContext]);

  const playPressSound = useCallback(() => {
    playKeyboardClick("press");
  }, [playKeyboardClick]);

  const playReleaseSound = useCallback(() => {
    playKeyboardClick("release");
  }, [playKeyboardClick]);

  // Send: Clear, slightly higher pitch, quick
  const playSendSound = useCallback(() => {
    playTone(600, 300, 0.25, 0.08);
  }, [playTone]);

  // Receive: Lower pitch, bubble-like, slightly longer
  const playReceiveSound = useCallback(() => {
    playTone(800, 400, 0.35, 0.1);
  }, [playTone]);

  return { playSendSound, playReceiveSound, playPressSound, playReleaseSound };
};
