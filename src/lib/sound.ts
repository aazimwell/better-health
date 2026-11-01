import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

/** Soft UI click: short tick sound + light haptic. Never throws — a missing sound must not break a tap. */
let player: ReturnType<typeof createAudioPlayer> | null = null;
let enabled = true;

export function setClickSoundEnabled(on: boolean) { enabled = on; }

export function playClick() {
  if (!enabled) return;
  try { Haptics.selectionAsync(); } catch {}
  try {
    if (!player) {
      player = createAudioPlayer(require('../assets/click.wav'));
      player.volume = 0.6;
    }
    player.seekTo(0);
    player.play();
  } catch {}
}
