'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Camera, DetectionResult, User } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const FRONTEND_URL = BACKEND_URL.replace(':3001', ':3000');

// ─── Camera panel ────────────────────────────────────────────────────────────

function CameraPanel({ camera, socket, accessType }: {
  camera: Camera;
  socket: Socket | null;
  accessType: 'entry' | 'exit';
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const scanningRef = useRef(false);
  const lastFrameRef = useRef<string | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [plate, setPlate] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { cameraId: string; frame: string }) => {
      if (payload.cameraId !== camera.id) return;
      setLive(true);
      lastFrameRef.current = payload.frame;
      if (imgRef.current) imgRef.current.src = payload.frame;
    };
    socket.on('stream:frame', handler);
    return () => { socket.off('stream:frame', handler); };
  }, [socket, camera.id]);

  const scanFrame = useCallback(async () => {
    if (scanningRef.current || !lastFrameRef.current) return;
    scanningRef.current = true;
    try {
      const res = await fetch(lastFrameRef.current);
      const blob = await res.blob();
      const form = new FormData();
      form.set('image', blob, 'frame.jpg');
      const ocr = await api<{ plate: string; confidence: number }>('/detections/ocr-frame', { method: 'POST', body: form });
      if (ocr.confidence >= 0.65) {
        setPlate(ocr.plate);
        setConfidence(ocr.confidence);
        if (ocr.confidence >= 0.8) stopScanning();
      }
    } catch { /* ignore */ }
    finally { scanningRef.current = false; }
  }, []);

  function startScanning() {
    setScanning(true);
    setPlate(''); setConfidence(0);
    scanFrame();
    scanTimerRef.current = setInterval(scanFrame, 2500);
  }

  function stopScanning() {
    setScanning(false);
    if (scanTimerRef.current) { clearInterval(scanTimerRef.current); scanTimerRef.current = null; }
  }

  useEffect(() => () => { if (scanTimerRef.current) clearInterval(scanTimerRef.current); }, []);

  async function onRegister() {
    if (!plate || !lastFrameRef.current) return;
    setLoading(true); setRegError('');
    try {
      const blob = await (await fetch(lastFrameRef.current)).blob();
      const form = new FormData();
      form.set('cameraId', camera.id);
      form.set('image', blob, 'frame.jpg');
      form.set('plateOverride', plate);
      const det = await api<DetectionResult>(`/detections/${accessType}`, { method: 'POST', body: form });
      setResult(det); setPlate(''); setConfidence(0);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Error al registrar');
    } finally { setLoading(false); }
  }

  const label = accessType === 'entry' ? 'Ingreso' : 'Salida';
  const isEntry = accessType === 'entry';
  const streamUrl = `${FRONTEND_URL}/stream/${camera.id}`;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 ${isEntry ? 'bg-emerald-50' : 'bg-blue-50'}`}>
        <div className={`h-2.5 w-2.5 rounded-full ${live ? (isEntry ? 'bg-emerald-500' : 'bg-blue-500') + ' animate-pulse' : 'bg-slate-300'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-sm font-bold text-slate-900 truncate">{camera.name}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${live ? (isEntry ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700') : 'bg-slate-100 text-slate-400'}`}>
          {live ? 'En vivo' : 'Sin señal'}
        </span>
      </div>

      {/* Video */}
      <div className="relative bg-slate-950 aspect-video">
        {live ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imgRef} alt="feed" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <p style={{ color: '#ffffff', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Esperando camara</p>
            <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>Abre esta URL en tu celular:</p>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 14px', maxWidth: 380, width: '100%', wordBreak: 'break-all' }}>
              <a
                href={streamUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#34d399', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
              >
                {streamUrl}
              </a>
            </div>
          </div>
        )}

        {/* Overlays */}
        {live && scanning && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white font-medium">Escaneando placa...</span>
          </div>
        )}
        {plate && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-black/70 backdrop-blur-sm px-4 py-2.5">
            <span className="font-mono text-xl font-bold tracking-widest text-white">{plate}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              confidence >= 0.8 ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
            }`}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        {scanning ? (
          <button onClick={stopScanning} className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            Pausar escaneo
          </button>
        ) : (
          <button onClick={startScanning} disabled={!live} className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isEntry ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            Escanear placa
          </button>
        )}
      </div>

      {/* Registration */}
      <div className="p-4 flex-1">
        {result ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Placa</p>
                <p className="mt-0.5 text-lg font-bold font-mono tracking-widest text-slate-900">{result.plate}</p>
                <p className="text-xs text-slate-400">{Math.round(result.confidence * 100)}% confianza</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Vehiculo</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{result.brand || '—'}</p>
                <p className="text-xs text-slate-500">{result.model} · {result.color}</p>
              </div>
            </div>
            {result.sanctioned && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5">
                <span className="text-rose-500 text-sm">⛔</span>
                <p className="text-xs font-semibold text-rose-700">Vehiculo con sancion activa</p>
              </div>
            )}
            {result.damageDetails && result.damageDetails !== 'sin danos visibles' && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                <p className="text-xs text-amber-700">{result.damageDetails}</p>
              </div>
            )}
            {result.evidenceUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.evidenceUrl} alt={result.plate} className="h-36 w-full rounded-xl object-cover" />
            )}
            <button
              onClick={() => { setResult(null); startScanning(); }}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Registrar otro
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 uppercase tracking-wide">Placa detectada</label>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="ABC123"
                className="font-mono text-2xl font-bold tracking-[0.25em] text-center"
                maxLength={8}
              />
              {plate && <p className="mt-1 text-xs text-slate-400 text-center">Verifica que coincida con el vehiculo real</p>}
            </div>
            {regError && <p className="text-sm text-rose-600 text-center">{regError}</p>}
            <button
              onClick={onRegister}
              disabled={!plate || loading}
              className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-colors disabled:opacity-40 ${
                isEntry ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Registrando...' : `Registrar ${label}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DetectionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored?.id) { setLoading(false); return; }

    api<User>(`/users/${stored.id}`)
      .then((u) => {
        setUser(u);
        const sock = io(`${BACKEND_URL}/stream`, { transports: ['websocket'] });
        sock.on('connect', () => {
          const ids = [u.entryCameraId, u.exitCameraId].filter(Boolean) as string[];
          if (ids.length) sock.emit('stream:watch', ids);
        });
        setSocket(sock);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => { socket?.disconnect(); }, [socket]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  const hasEntry = !!user?.entryCamera;
  const hasExit = !!user?.exitCamera;

  if (!hasEntry && !hasExit) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-2xl bg-slate-100 p-5 text-4xl">📷</div>
        <div>
          <p className="font-semibold text-slate-700">Sin camaras asignadas</p>
          <p className="mt-1 text-sm text-slate-400">Pide a un administrador que asigne tus camaras desde el modulo Usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid gap-5 ${hasEntry && hasExit ? 'lg:grid-cols-2' : 'max-w-2xl'}`}>
      {hasEntry && <CameraPanel camera={user!.entryCamera!} socket={socket} accessType="entry" />}
      {hasExit  && <CameraPanel camera={user!.exitCamera!}  socket={socket} accessType="exit"  />}
    </div>
  );
}
