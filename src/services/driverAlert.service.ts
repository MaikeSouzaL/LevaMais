import { Vibration } from "react-native";

let SoundModule: any = null;
let sound: any = null;
let vibTimer: any = null;
let starting = false;
let running = false;

function getSoletoAsset() {
  // path: src/services -> src/assets/sound/Soleto.mp3
  return require("../assets/sound/Soleto.mp3");
}

async function ensureExpoAv() {
  if (SoundModule) return SoundModule;

  // Lazy import so the app still starts even if expo-av isn't installed yet.
  // If missing, we'll throw a helpful error.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    SoundModule = require("expo-av");
    return SoundModule;
  } catch (e) {
    throw new Error(
      "expo-av não está instalado. Rode: npx expo install expo-av",
    );
  }
}

async function ensureSound() {
  const { Audio } = await ensureExpoAv();

  if (sound) return sound;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    interruptionModeIOS: 1,
    interruptionModeAndroid: 1,
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

class DriverAlertService {
  isRunning() {
    return running;
  }

  async start() {
    if (running || starting) return;
    starting = true;

    try {
      const s = await ensureSound();
      await s.setIsLoopingAsync(true);
      await s.playAsync();
      startVibrationLoop();
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
