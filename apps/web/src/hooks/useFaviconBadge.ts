import { useEffect, useCallback } from 'react';

/**
 * Hook para atualizar dinamicamente o título da aba do browser e o favicon
 * com um badge numérico de notificações não lidas.
 * 
 * Feature #22: Badge pulsante no título da aba do browser.
 */
export function useFaviconBadge() {
  // Desenha o favicon com badge numérico usando Canvas API
  const setBadge = useCallback((count: number) => {
    if (typeof window === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw base favicon (green circle with headset)
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#059669'; // emerald-600
    ctx.fill();

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TI', 16, 17);

    if (count > 0) {
      // Red badge
      const badgeX = 26;
      const badgeY = 6;
      const badgeR = 8;

      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(count > 9 ? '9+' : String(count), badgeX, badgeY);
    }

    // Replace favicon
    const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const link = existing || document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = canvas.toDataURL('image/png');
    if (!existing) document.head.appendChild(link);
  }, []);

  const setTitle = useCallback((count: number, baseTitle = 'AtendeTI — Sistema de Chamados de TI') => {
    if (typeof window === 'undefined') return;
    document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
  }, []);

  const notify = useCallback((count: number) => {
    setBadge(count);
    setTitle(count);
  }, [setBadge, setTitle]);

  const clear = useCallback(() => {
    setBadge(0);
    setTitle(0);
  }, [setBadge, setTitle]);

  return { notify, clear };
}
