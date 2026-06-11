import { Vibration } from "react-native";
import { createAudioPlayer } from "expo-audio";

let soundPlayer: any = null;
let vibTimer: any = null;
let starting = false;
let running = false;

function getSoletoAsset() {
  return require("../assets/sound/Soleto.mp3");
}

function ensureSoundPlayer() {
  if (soundPlayer) return soundPlayer;

  soundPlayer = createAudioPlayer(getSoletoAsset());
  soundPlayer.loop = true;
  soundPlayer.volume = 1.0;
  return soundPlayer;
}

function startVibrationLoop() {
  if (vibTimer) return;

  try {
    Vibration.vibrate([0, 500, 500], true);
    vibTimer = setInterval(() => {
      try {
        Vibration.vibrate(500);
      } catch {}
    }, 1500);
  } catch (error) {
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

function playOneShot(asset: any) {
  try {
    const player = createAudioPlayer(asset);
    player.volume = 1.0;
    player.loop = false;
    player.play();

    const subscription = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        subscription.remove();
        player.release();
      }
    });
  } catch (error) {
    console.log("[SoundEffects] Erro ao reproduzir som de efeito:", error);
  }
}

class DriverAlertService {
  async playOnlineSound() {
    playOneShot(require("../assets/sound/pluckOn.mp3"));
  }

  async playOfflineSound() {
    playOneShot(require("../assets/sound/pluckOff.mp3"));
  }

  async playCounterProposalSound() {
    playOneShot(require("../assets/sound/pedidoAceito.mp3"));
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
        const player = ensureSoundPlayer();
        player.play();
      } catch (error) {
        console.log("[DriverAlert] Falha ao tocar som, mantendo vibracao:", error);
      }

      running = true;
    } finally {
      starting = false;
    }
  }

  async stop() {
    stopVibrationLoop();

    if (!soundPlayer) {
      running = false;
      return;
    }

    try {
      soundPlayer.pause();
    } catch {}

    running = false;
  }

  async dispose() {
    stopVibrationLoop();

    if (!soundPlayer) {
      running = false;
      return;
    }

    try {
      soundPlayer.pause();
      soundPlayer.release();
    } catch {}

    soundPlayer = null;
    running = false;
  }
}

export default new DriverAlertService();
