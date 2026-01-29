import { useEffect } from "react";

export type UseSearchCountdownArgs = {
  visible: boolean;
  seconds: number;
  onTick: (nextSeconds: number) => void;
  onTimeout: () => void;
};

export default function useSearchCountdown(args: UseSearchCountdownArgs) {
  useEffect(() => {
    if (!args.visible) return;
    if (!args.seconds || args.seconds <= 0) return;

    let id = setInterval(function tick() {
      let next = args.seconds - 1;
      args.onTick(next);

      if (next <= 0) {
        clearInterval(id);
        args.onTimeout();
      }
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, [args.visible, args.seconds]);
}
