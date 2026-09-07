import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

/** Los frames de video se muestrean chicos por velocidad; las fotos aguantan más detalle. */
const LADO_VIDEO = 640;
const LADO_FOTO = 1280;

function aImageData(canvas, source, ancho, alto, ladoMaximo) {
  const escala = Math.min(1, ladoMaximo / Math.max(ancho, alto));
  const w = Math.max(1, Math.round(ancho * escala));
  const h = Math.max(1, Math.round(alto * escala));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function decodificar(imageData) {
  const encontrado = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return encontrado?.data ?? null;
}

export function QrScanner({ onDetect, manualLabel = 'O escriba el código del activo', manualHint = 'slc-act-001' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(0);
  const onDetectRef = useRef(onDetect);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [manual, setManual] = useState('');

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  const detener = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }, []);

  useEffect(() => detener, [detener]);

  async function abrirCamara() {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no permite usar la cámara. Suba una foto del código o escríbalo.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScanning(true);
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const leerFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!streamRef.current || !video || !canvas) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
          const valor = decodificar(aImageData(canvas, video, video.videoWidth, video.videoHeight, LADO_VIDEO));
          if (valor) {
            detener();
            onDetectRef.current?.(valor);
            return;
          }
        }

        frameRef.current = requestAnimationFrame(leerFrame);
      };

      frameRef.current = requestAnimationFrame(leerFrame);
    } catch {
      detener();
      setError('No se pudo abrir la cámara. Revise los permisos del navegador o suba una foto.');
    }
  }

  async function leerFoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    detener();

    try {
      const bitmap = await createImageBitmap(file);
      const imageData = aImageData(canvasRef.current, bitmap, bitmap.width, bitmap.height, LADO_FOTO);
      bitmap.close?.();

      const valor = decodificar(imageData);
      if (valor) {
        onDetectRef.current?.(valor);
        return;
      }
      setError('No se encontró un código QR en la imagen. Pruebe con una foto más nítida o más de cerca.');
    } catch {
      setError('No se pudo leer la imagen seleccionada.');
    }
  }

  function enviarManual(event) {
    event.preventDefault();
    const valor = manual.trim();
    if (!valor) {
      setError('Escriba el código del activo.');
      return;
    }
    detener();
    onDetectRef.current?.(valor);
  }

  return (
    <div className="app-scanner">
      <div className="app-scanner-stage">
        <video ref={videoRef} className="app-scanner-video" muted playsInline />
        {scanning ? (
          <div className="app-scanner-target" aria-hidden="true" />
        ) : (
          <div className="app-scanner-idle">
            <i className="pi pi-qrcode" aria-hidden="true" />
            <span>Abra la cámara o suba una foto del código</span>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} hidden />

      {error ? (
        <div className="app-feedback app-feedback--error mt-4" role="alert">
          {error}
        </div>
      ) : null}

      <div className="app-scanner-actions">
        {scanning ? (
          <button type="button" className="app-btn app-btn--ghost" onClick={detener}>
            <i className="pi pi-times" aria-hidden="true" />
            Detener cámara
          </button>
        ) : (
          <button type="button" className="app-btn app-btn--primary" onClick={abrirCamara}>
            <i className="pi pi-camera" aria-hidden="true" />
            Cámara en vivo
          </button>
        )}
        <label className="app-btn app-btn--ghost app-scanner-upload">
          <i className="pi pi-image" aria-hidden="true" />
          Subir foto
          <input type="file" accept="image/*" onChange={leerFoto} />
        </label>
      </div>

      <form className="app-scanner-manual" onSubmit={enviarManual}>
        <label className="app-label" htmlFor="qr-codigo-manual">
          {manualLabel}
        </label>
        <div className="app-scanner-manual-row">
          <input
            id="qr-codigo-manual"
            className="app-input"
            value={manual}
            placeholder={manualHint}
            onChange={(event) => setManual(event.target.value)}
          />
          <button type="submit" className="app-btn app-btn--ghost">
            Buscar
          </button>
        </div>
      </form>
    </div>
  );
}
