'use client';

import { useEffect, useRef, useState } from 'react';
import { use } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const FPS_INTERVAL = 200; // emit a frame every 200ms = ~5fps

export default function StreamPage({ params }: { params: Promise<{ cameraId: string }> }) {
  const { cameraId } = use(params);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<'connecting' | 'streaming' | 'error'>('connecting');
  const [error, setError] = useState('');
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    const socket = io(`${BACKEND_URL}/stream`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('stream:join', cameraId, () => {
        setStatus('streaming');
        startCamera();
      });
    });

    socket.on('disconnect', () => setStatus('connecting'));
    socket.on('connect_error', () => {
      setStatus('error');
      setError('No se pudo conectar al servidor. Verifica la URL.');
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.disconnect();
      stopCamera();
    };
  }, [cameraId]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.oncanplay = () => startEmitting();
      }
    } catch {
      setStatus('error');
      setError('No se pudo acceder a la camara. En Chrome Android: chrome://flags → Insecure origins → agrega la URL del servidor.');
    }
  }

  function stopCamera() {
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
  }

  function startEmitting() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const socket = socketRef.current;
      if (!video || !canvas || !socket || video.readyState < 2) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const frame = canvas.toDataURL('image/jpeg', 0.5);
      socket.emit('stream:frame', { cameraId, frame });
      setFrameCount((n) => n + 1);
    }, FPS_INTERVAL);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 gap-4">
      <div className="text-center">
        <p className="text-xs text-slate-500 uppercase tracking-widest">Camara</p>
        <p className="text-lg font-mono font-semibold text-white">{cameraId.slice(0, 8)}…</p>
      </div>

      {status === 'error' ? (
        <div className="rounded-2xl bg-rose-900/40 border border-rose-700 p-6 max-w-sm text-center">
          <p className="text-rose-300 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm text-white"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {status === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-slate-400 text-sm animate-pulse">Conectando...</p>
              </div>
            )}
            {status === 'streaming' && (
              <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-white font-medium">EN VIVO</span>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          {status === 'streaming' && (
            <p className="text-xs text-slate-500">{frameCount} frames enviados</p>
          )}
        </>
      )}
    </div>
  );
}
