import { Vibration } from "react-native";
import { Audio } from "expo-av";

let sound: any = null;
let vibTimer: any = null;
let starting = false;
let running = false;

function getSoletoAsset() {
  // path: src/services -> src/assets/sound/Soleto.mp3
  return require("../assets/sound/Soleto.mp3");
}

async function ensureSound() {
  if (sound) return sound;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });

  const created = await Audio.Sound.createAsync(getSoletoAsset(), {
    shouldPlay: false,
    isLooping: true,
    volume: 1,
  });

  sound = created.sound;
  return sound;
}

function startVibrationLoop() {
  if (vibTimer) return;

  // Pattern: vibrate 500ms, pause 500ms (repeat)
  // On Android, Vibration.vibrate(pattern, true) repeats. On iOS, repeat may be ignored,
  // so we fallback to a timer.
  try {
    Vibration.vibrate([0, 500, 500], true);
    // also keep a timer for safety
    vibTimer = setInterval(() => {
      try {
        Vibration.vibrate(500);
      } catch {}
    }, 1500);
  } catch {
    vibTimer = setInterval(() => {
      try {
        Vibration.vibrate(500);
      } catch {}
    }, 1500);
  }
}

function stopVibrationLoop() {
  try {
    Vibration.cancel();
  } catch {}

  if (vibTimer) {
    clearInterval(vibTimer);
    vibTimer = null;
  }
}

async function playOneShot(asset: any) {
  try {
    const { sound: shotSound } = await Audio.Sound.createAsync(asset, {
      shouldPlay: true,
      volume: 1,
    });
    // Auto-unload after playback to avoid memory leaks
    shotSound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        shotSound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    console.log("[SoundEffects] Erro ao reproduzir som de efeito:", error);
  }
}

class DriverAlertService {
  async playOnlineSound() {
    await playOneShot(require("../assets/sound/pluckOn.mp3"));
  }

  async playOfflineSound() {
    await playOneShot(require("../assets/sound/pluckOff.mp3"));
  }

  isRunning() {
    return running;
  }

  async start() {
    if (running || starting) return;
    starting = true;

    try {
      startVibrationLoop();

      try {
        const s = await ensureSound();
        await s.setIsLoopingAsync(true);
        await s.playAsync();
      } catch (error) {
        // Mantem somente vibracao quando o audio falha (ex.: modulo ausente, foco de audio indisponivel).
        console.log("[DriverAlert] Falha ao tocar som, mantendo vibracao:", error);
      }

      running = true;
    } finally {
      starting = false;
    }
  }

  async stop() {
    stopVibrationLoop();

    if (!sound) {
      running = false;
      return;
    }

    try {
      await sound.stopAsync();
    } catch {}

    running = false;
  }

  async dispose() {
    stopVibrationLoop();

    if (!sound) {
      running = false;
      return;
    }

    try {
      await sound.stopAsync();
    } catch {}

    try {
      await sound.unloadAsync();
    } catch {}

    sound = null;
    running = false;
  }
}

export default new DriverAlertService();
