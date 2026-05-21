'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Camara, Usuario } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const FRONTEND_URL = BACKEND_URL.replace(':3001', ':3000');

type Analysis = {
  tipoVehiculo: string;
  marca: string;
  modelo: string;
  color: string;
  caracteristicas: string;
  evidenceUrl: string;
};

type EntryResult = { placa: string; evidenceUrl: string | null; sanctioned: boolean; estado: string };
type ExitResult  = { placa: string; evidenceUrl: string | null };

/* ─────────────────────────────────────────── */
function Panel({ camera, socket, accessType }: {
  camera: Camara;
  socket: Socket | null;
  accessType: 'entry' | 'exit';
}) {
  const isEntry = accessType === 'entry';

  const imgRef      = useRef<HTMLImageElement>(null);
  const lastFrameRef = useRef<string | null>(null);   // base64 data URL from stream

  const [live,          setLive]          = useState(false);
  const [plate,         setPlate]         = useState('');
  const [ocrConf,       setOcrConf]       = useState(0);
  const [vehicleExists, setVehicleExists] = useState<boolean | null>(null);
  const [analysis,      setAnalysis]      = useState<Analysis | null>(null);

  const [scanLoading,     setScanLoading]     = useState(false);
  const [analyzeLoading,  setAnalyzeLoading]  = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [entryResult, setEntryResult] = useState<EntryResult | null>(null);
  const [exitResult,  setExitResult]  = useState<ExitResult | null>(null);
  const [error,       setError]       = useState('');

  /* recibir frames del stream */
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { cameraId: string; frame: string }) => {
      if (Number(payload.cameraId) !== camera.id) return;
      setLive(true);
      lastFrameRef.current = payload.frame;
      if (imgRef.current) imgRef.current.src = payload.frame;
    };
    socket.on('stream:frame', handler);
    return () => { socket.off('stream:frame', handler); };
  }, [socket, camera.id]);

  /* convierte el data URL del frame actual a Blob */
  async function frameToBlob(): Promise<Blob> {
    if (!lastFrameRef.current) throw new Error('Sin frame de camara disponible');
    const res = await fetch(lastFrameRef.current);
    return res.blob();
  }

  async function scanPlate() {
    setScanLoading(true); setError('');
    try {
      const blob = await frameToBlob();
      const form = new FormData();
      form.set('image', blob, 'frame.jpg');
      const ocr = await api<{ plate: string; confidence: number }>('/detections/ocr-frame', { method: 'POST', body: form });
      setVehicleExists(null); setAnalysis(null);
      if (ocr.plate) {
        setPlate(ocr.plate);
        setOcrConf(ocr.confidence);
        try {
          await api(`/vehicles/history/${ocr.plate}`);
          setVehicleExists(true);
        } catch {
          setVehicleExists(false);
        }
      } else {
        setError('No se detectó placa — escríbela manualmente');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al escanear');
    } finally { setScanLoading(false); }
  }

  async function analyzeVehicle() {
    setAnalyzeLoading(true); setError('');
    try {
      const blob = await frameToBlob();
      const form = new FormData();
      form.set('image', blob, 'frame.jpg');
      const res = await api<Analysis>('/detections/analyze-vehicle', { method: 'POST', body: form });
      setAnalysis(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar');
    } finally { setAnalyzeLoading(false); }
  }

  async function registerEntry() {
    setRegisterLoading(true); setError('');
    try {
      const form = new FormData();
      form.set('placa', plate);
      form.set('cameraId', String(camera.id));
      if (analysis) {
        form.set('marca',           analysis.marca);
        form.set('modelo',          analysis.modelo);
        form.set('color',           analysis.color);
        form.set('tipoVehiculo',    analysis.tipoVehiculo);
        form.set('caracteristicas', analysis.caracteristicas);
        if (analysis.evidenceUrl) form.set('evidenceUrl', analysis.evidenceUrl);
      }
      // Always try to capture current frame as evidence (overrides evidenceUrl in backend)
      try {
        const blob = await frameToBlob();
        form.set('image', blob, 'frame.jpg');
      } catch { /* no live frame — use evidenceUrl fallback if available */ }
      const res = await api<EntryResult>('/detections/entry', { method: 'POST', body: form });
      setEntryResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally { setRegisterLoading(false); }
  }

  async function registerExit() {
    setRegisterLoading(true); setError('');
    try {
      const form = new FormData();
      form.set('placa',    plate);
      form.set('cameraId', String(camera.id));
      try {
        const blob = await frameToBlob();
        form.set('image', blob, 'frame.jpg');
      } catch { /* no live frame */ }
      const res = await api<ExitResult>('/detections/exit', { method: 'POST', body: form });
      setExitResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally { setRegisterLoading(false); }
  }

  function reset() {
    setPlate(''); setOcrConf(0); setVehicleExists(null); setAnalysis(null);
    setEntryResult(null); setExitResult(null); setError('');
  }

  const streamUrl   = `${FRONTEND_URL}/stream/${camera.id}`;
  const accentBtn   = isEntry ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700';
  const accentLight = isEntry ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200';
  const label       = isEntry ? 'Ingreso' : 'Salida';

  const hasPlate          = plate.length >= 5;
  const canRegisterEntry  = hasPlate && (vehicleExists === true || analysis !== null);
  const canRegisterExit   = hasPlate;

  /* ── resultado final ── */
  if (entryResult || exitResult) {
    const r      = entryResult ?? exitResult!;
    const denied = entryResult?.sanctioned && entryResult.estado === 'denegado';
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={`px-4 py-3 border-b shrink-0 ${isEntry ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-sm font-bold text-slate-900">{camera.nombre}</p>
        </div>
        <div className="flex-1 p-5 space-y-4 overflow-auto">
          {denied ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-center">
              <p className="text-3xl mb-1">⛔</p>
              <p className="font-bold text-rose-700 text-lg">ACCESO DENEGADO</p>
              <p className="text-sm text-rose-600 mt-1">Vehiculo con sancion activa</p>
              <p className="font-mono text-xl font-bold mt-2">{r.placa}</p>
            </div>
          ) : (
            <div className={`rounded-2xl border p-4 text-center ${accentLight}`}>
              <p className="text-3xl mb-1">{isEntry ? '✅' : '🚗'}</p>
              <p className="font-bold text-lg">{isEntry ? 'INGRESO REGISTRADO' : 'SALIDA REGISTRADA'}</p>
              <p className="font-mono text-xl font-bold mt-2">{r.placa}</p>
            </div>
          )}
          {r.evidenceUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.evidenceUrl} alt="evidencia" className="w-full rounded-xl object-cover max-h-44" />
          )}
          <button onClick={reset} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
            Nuevo registro
          </button>
        </div>
      </div>
    );
  }

  /* ── flujo principal ── */
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b shrink-0 ${isEntry ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
        <div className={`h-2.5 w-2.5 rounded-full ${live ? (isEntry ? 'bg-emerald-500' : 'bg-blue-500') + ' animate-pulse' : 'bg-slate-300'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-sm font-bold text-slate-900 truncate">{camera.nombre}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${live ? accentLight : 'bg-slate-100 text-slate-400'}`}>
          {live ? 'En vivo' : 'Sin señal'}
        </span>
      </div>

      {/* Video */}
      <div className="relative bg-slate-950 flex-1 min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          alt="feed"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${live ? 'opacity-100' : 'opacity-0'}`}
        />
        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-white font-semibold text-base mb-2">Esperando camara</p>
            <p className="text-slate-400 text-xs mb-4">Abre esta URL en tu celular:</p>
            <div className="bg-slate-800 rounded-xl px-4 py-3 max-w-sm w-full break-all">
              <a href={streamUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-mono text-sm font-semibold no-underline">
                {streamUrl}
              </a>
            </div>
          </div>
        )}
        {plate && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-black/70 backdrop-blur-sm px-4 py-2">
            <span className="font-mono text-2xl font-bold tracking-widest text-white">{plate}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ocrConf >= 0.8 ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'}`}>
              {Math.round(ocrConf * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="shrink-0 border-t border-slate-100 bg-white p-4 space-y-3">

        {/* ── PASO 1: Escanear + campo placa siempre visible ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={plate}
              onChange={(e) => {
                setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setVehicleExists(null); setAnalysis(null);
              }}
              placeholder="Placa — escanea o escribe"
              className="flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xl font-bold tracking-[0.25em] text-center focus:outline-none focus:border-emerald-400 transition-colors"
              maxLength={8}
            />
            <button
              onClick={scanPlate}
              disabled={!live || scanLoading}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${accentBtn}`}
            >
              {scanLoading ? '...' : '🔍 Escanear'}
            </button>
          </div>

          {vehicleExists === true && (
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              ✓ Vehiculo ya registrado en el sistema
            </p>
          )}
          {vehicleExists === false && !analysis && (
            <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
              ⚠ Placa no encontrada — analiza el vehiculo primero
            </p>
          )}
        </div>

        {/* ── PASO 3 (solo ingreso + vehiculo nuevo): Analizar ── */}
        {isEntry && vehicleExists === false && !analysis && (
          <button
            onClick={analyzeVehicle}
            disabled={analyzeLoading}
            className="w-full rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {analyzeLoading
              ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin inline-block" />Analizando con Gemini...</span>
              : '🤖 Analizar características del vehiculo'}
          </button>
        )}

        {/* ── PASO 3 resultado: cuadros con datos de Gemini ── */}
        {analysis && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 space-y-2">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Análisis Gemini</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white border border-amber-100 p-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Marca</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{analysis.marca}</p>
              </div>
              <div className="rounded-xl bg-white border border-amber-100 p-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Modelo</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{analysis.modelo}</p>
              </div>
              <div className="rounded-xl bg-white border border-amber-100 p-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Color</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{analysis.color}</p>
              </div>
              <div className="rounded-xl bg-white border border-amber-100 p-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Tipo</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5 capitalize">{analysis.tipoVehiculo}</p>
              </div>
            </div>
            {analysis.caracteristicas && (
              <div className="rounded-xl bg-white border border-amber-100 p-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Características</p>
                <p className="text-xs text-slate-700 mt-0.5">{analysis.caracteristicas}</p>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-rose-600 text-center">{error}</p>}

        {/* ── PASO FINAL: Registrar ── */}
        {isEntry ? (
          <button
            onClick={registerEntry}
            disabled={!canRegisterEntry || registerLoading}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${accentBtn}`}
          >
            {registerLoading ? 'Registrando...' : '✅ Registrar ingreso'}
          </button>
        ) : (
          <button
            onClick={registerExit}
            disabled={!canRegisterExit || registerLoading}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${accentBtn}`}
          >
            {registerLoading ? 'Registrando...' : '🚗 Registrar salida'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
export default function DetectionsPage() {
  const [user,    setUser]    = useState<Usuario | null>(null);
  const [socket,  setSocket]  = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored?.id) { setLoading(false); return; }

    api<Usuario>(`/users/${stored.id}`)
      .then((u) => {
        setUser(u);
        const sock = io(`${BACKEND_URL}/stream`, { transports: ['websocket'] });
        sock.on('connect', () => {
          const ids = [u.camaraIngresoId, u.camaraSalidaId].filter(Boolean);
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
        <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasEntry = !!user?.camaraIngreso;
  const hasExit  = !!user?.camaraSalida;

  if (!hasEntry && !hasExit) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-2xl bg-slate-100 p-5 text-4xl">📷</div>
        <div>
          <p className="font-semibold text-slate-700">Sin camaras asignadas</p>
          <p className="mt-1 text-sm text-slate-400">Asigna camaras desde Puntos de acceso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 h-full" style={{ gridTemplateColumns: hasEntry && hasExit ? '1fr 1fr' : '1fr' }}>
      {hasEntry && <Panel camera={user!.camaraIngreso!} socket={socket} accessType="entry" />}
      {hasExit  && <Panel camera={user!.camaraSalida!}  socket={socket} accessType="exit"  />}
    </div>
  );
}
