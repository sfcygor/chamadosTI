import { useCallback, useRef } from 'react';

/**
 * Hook para gerenciar notificações sonoras e push do browser.
 * Pede permissão de Push Notification na primeira chamada.
 */
export function useNotifications() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  /**
   * Toca um som de notificação usando a Web Audio API (sem arquivos externos).
   * Dois bipes curtos com timbre agradável.
   */
  const playSound = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      const playBeep = (startTime: number, freq: number, duration: number, gain: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playBeep(now, 880, 0.15, 0.3);       // Lá5 — primeiro bip
      playBeep(now + 0.2, 1046, 0.15, 0.25); // Dó6 — segundo bip
    } catch {
      // Navegador sem suporte ou bloqueado — silencioso
    }
  }, []);

  /**
   * Envia uma notificação do browser (Push Notification).
   * Solicita permissão se ainda não foi concedida.
   */
  const sendPushNotification = useCallback(
    async (title: string, body: string, options?: { icon?: string; tag?: string }) => {
      if (!('Notification' in window)) return;

      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') return;

      try {
        new Notification(title, {
          body,
          icon: options?.icon ?? '/icons/atendeti.png',
          tag: options?.tag,
          badge: '/icons/atendeti.png',
        });
      } catch {
        // Service Worker pode lidar com isso no futuro
      }
    },
    [],
  );

  /**
   * Dispara som + notificação push juntos.
   */
  const notify = useCallback(
    (title: string, body: string, tag?: string) => {
      playSound();
      sendPushNotification(title, body, { tag });
    },
    [playSound, sendPushNotification],
  );

  return { notify, playSound, sendPushNotification };
}
