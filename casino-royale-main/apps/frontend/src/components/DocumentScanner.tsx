import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Camera, CameraOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ScannedIdentity {
  documentNumber: string;
  fullName?: string;
  sex?: string;
  country?: string;
  birthDate?: string;
  nationality?: string;
  documentIssuedAt?: string;
  documentExpiresAt?: string;
  rawValue: string;
}

function parseCompactDate(value?: string) {
  if (!value || !/^\d{8}$/.test(value)) return undefined;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

export function parseScannedIdentity(rawValue: string): ScannedIdentity {
  const value = rawValue.trim();
  const pipeFields = value.split("|");
  if (pipeFields.length >= 10) {
    return {
      documentNumber: pipeFields[0]?.trim() ?? "",
      fullName: [pipeFields[1], pipeFields[2]].filter(Boolean).join(" ").trim(),
      sex: pipeFields[4]?.trim(),
      country: pipeFields[5]?.trim(),
      birthDate: parseCompactDate(pipeFields[6]?.trim()),
      nationality: pipeFields[7]?.trim(),
      documentIssuedAt: parseCompactDate(pipeFields[8]?.trim()),
      documentExpiresAt: parseCompactDate(pipeFields[9]?.trim()),
      rawValue: value
    };
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const candidate = parsed.cedula ?? parsed.documento ?? parsed.documentNumber ?? parsed.id;
    if (typeof candidate === "string" && candidate.trim()) {
      return { documentNumber: candidate.trim(), rawValue: value };
    }
  } catch {
    // El contenido de muchos documentos no es JSON.
  }

  const labeledMatch = value.match(/(?:CEDULA|C[EÉ]DULA|DOCUMENTO|ID)[:=\s]+([A-Z0-9-]{4,30})/i);
  if (labeledMatch?.[1]) return { documentNumber: labeledMatch[1], rawValue: value };

  const panamaIdMatch = value.match(/\b(?:PE|E|N|[A-Z]{1,2})?-?\d{1,4}-\d{1,6}-\d{1,6}\b/i);
  return { documentNumber: panamaIdMatch?.[0] ?? value.slice(0, 120), rawValue: value };
}

export function DocumentScanner({
  onDetected
}: {
  readonly onDetected: (identity: ScannedIdentity) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("También puedes usar un lector USB/Bluetooth: enfoca el campo de cédula y escanea.");

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  };

  useEffect(() => stop, []);

  const start = async () => {
    if (!videoRef.current) return;

    setMessage("Solicitando acceso a la cámara...");
    try {
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        videoRef.current,
        (result) => {
          if (!result) return;
          onDetected(parseScannedIdentity(result.getText()));
          setMessage("Documento leído. Verifica el número antes de continuar.");
          stop();
        }
      );
      setActive(true);
      setMessage("Apunta la cámara al QR o código de barras de la cédula.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `No se pudo abrir la cámara: ${error.message}`
          : "No se pudo abrir la cámara. Verifica los permisos del navegador."
      );
      stop();
    }
  };

  return (
    <div className="document-scanner">
      <div className={`document-scanner__preview ${active ? "is-active" : ""}`}>
        <video ref={videoRef} autoPlay muted playsInline />
        {!active ? <span>Vista previa de cámara</span> : null}
      </div>
      <div className="toolbar">
        <p className="form-hint" role="status">{message}</p>
        {active ? (
          <button className="btn btn--secondary" onClick={stop} type="button">
            <CameraOff size={16} /> Cerrar cámara
          </button>
        ) : (
          <button className="btn btn--secondary" onClick={start} type="button">
            <Camera size={16} /> Abrir cámara
          </button>
        )}
      </div>
    </div>
  );
}
