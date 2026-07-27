import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

let globalSocket: Socket | null = null;

export function useSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(globalSocket);

  useEffect(() => {
    if (!user) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        setSocket(null);
      }
      return;
    }

    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
      setSocket(globalSocket);
    }

    return () => {
      // Opcional: Não desconectar imediatamente se quiser manter a conexão viva
      // ao navegar entre páginas, pois é uma single page application (SPA).
    };
  }, [user]);

  return socket;
}
