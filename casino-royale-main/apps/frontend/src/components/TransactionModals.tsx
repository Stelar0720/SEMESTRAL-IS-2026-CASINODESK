import { useEffect, useId, useMemo, useRef, useState } from "react";
import { addDemoWatchlist, addProspectEvidence, runScreening, saveProspect } from "../app/api";
import { useAppStore } from "../app/store";
import type { RiskLevel } from "../app/types";
import { DocumentScanner, parseScannedIdentity } from "./DocumentScanner";
import { RiskBadge } from "./RiskBadge";

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function ModalShell({
  isOpen,
  title,
  maxWidth,
  onClose,
  children,
  footer
}: {
  readonly isOpen: boolean;
  readonly title: string;
  readonly maxWidth?: number;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
  readonly footer?: React.ReactNode;
}) {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    modalRef.current?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div ref={modalRef} className="modal" style={{ maxWidth }} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="modal__header">
          <h2 className="modal__title text-gold" id={titleId}>{title}</h2>
          <button className="modal__close" aria-label="Cerrar ventana" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

interface BuyInFormState {
  step: number;
  amount: number;
  paymentMethod: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "CHEQUE";
  documentNumber: string;
  name: string;
  nationality: string;
  residenceCountry: string;
  originOfFunds: string;
  captureMode: "QR" | "MANUAL";
  proportionality: "PROPORCIONAL" | "NO_PROPORCIONAL";
  riskLevel: RiskLevel;
}

interface ProspectDetailsState {
  documentType: "CEDULA" | "PASAPORTE";
  issuingCountry: string;
  documentIssuedAt: string;
  documentExpiresAt: string;
  birthDate: string;
  birthPlace: string;
  sex: string;
  address: string;
  phone: string;
  email: string;
  occupation: string;
  employer: string;
  economicActivity: string;
  monthlyIncomeRange: string;
  expectedGamingFrequency: string;
  relationshipPurpose: string;
  sourceOfWealth: string;
  actsOnOwnBehalf: boolean;
  thirdPartyDetails: string;
  isPep: boolean;
  pepRelationship: string;
  clientDeclarationAccepted: boolean;
}

const INITIAL_PROSPECT_DETAILS: ProspectDetailsState = {
  documentType: "CEDULA",
  issuingCountry: "PANAMA",
  documentIssuedAt: "2023-04-21",
  documentExpiresAt: "2038-04-21",
  birthDate: "2000-07-20",
  birthPlace: "Panama",
  sex: "M",
  address: "Ciudad de Panama",
  phone: "6000-0000",
  email: "prospecto@example.test",
  occupation: "Comerciante",
  employer: "Actividad independiente",
  economicActivity: "Comercio",
  monthlyIncomeRange: "2000-5000",
  expectedGamingFrequency: "Mensual",
  relationshipPurpose: "Entretenimiento",
  sourceOfWealth: "Ahorros y actividad comercial declarada",
  actsOnOwnBehalf: true,
  thirdPartyDetails: "",
  isPep: false,
  pepRelationship: "",
  clientDeclarationAccepted: false
};

const INITIAL_STATE: BuyInFormState = {
  step: 1,
  amount: 2500,
  paymentMethod: "EFECTIVO",
  documentNumber: "8-712-2241",
  name: "Carlos Andres Nunez Pinilla",
  nationality: "Panameña",
  residenceCountry: "Panamá",
  originOfFunds: "Actividad comercial y disponibilidad de fondos declarada.",
  captureMode: "QR",
  proportionality: "PROPORCIONAL",
  riskLevel: "VERDE"
};

function useBuyInForm() {
  const [step, setStep] = useState(INITIAL_STATE.step);
  const [amount, setAmount] = useState(INITIAL_STATE.amount);
  const [paymentMethod, setPaymentMethod] = useState(INITIAL_STATE.paymentMethod);
  const [documentNumber, setDocumentNumber] = useState(INITIAL_STATE.documentNumber);
  const [name, setName] = useState(INITIAL_STATE.name);
  const [nationality, setNationality] = useState(INITIAL_STATE.nationality);
  const [residenceCountry, setResidenceCountry] = useState(INITIAL_STATE.residenceCountry);
  const [originOfFunds, setOriginOfFunds] = useState(INITIAL_STATE.originOfFunds);
  const [captureMode, setCaptureMode] = useState(INITIAL_STATE.captureMode);
  const [proportionality, setProportionality] = useState(INITIAL_STATE.proportionality);
  const [riskLevel, setRiskLevel] = useState(INITIAL_STATE.riskLevel);
  const [details, setDetails] = useState<ProspectDetailsState>(INITIAL_PROSPECT_DETAILS);

  const reset = () => {
    setStep(INITIAL_STATE.step);
    setAmount(INITIAL_STATE.amount);
    setPaymentMethod(INITIAL_STATE.paymentMethod);
    setDocumentNumber(INITIAL_STATE.documentNumber);
    setName(INITIAL_STATE.name);
    setNationality(INITIAL_STATE.nationality);
    setResidenceCountry(INITIAL_STATE.residenceCountry);
    setOriginOfFunds(INITIAL_STATE.originOfFunds);
    setCaptureMode(INITIAL_STATE.captureMode);
    setProportionality(INITIAL_STATE.proportionality);
    setRiskLevel(INITIAL_STATE.riskLevel);
    setDetails(INITIAL_PROSPECT_DETAILS);
  };

  return {
    step, setStep,
    amount, setAmount,
    paymentMethod, setPaymentMethod,
    documentNumber, setDocumentNumber,
    name, setName,
    nationality, setNationality,
    residenceCountry, setResidenceCountry,
    originOfFunds, setOriginOfFunds,
    captureMode, setCaptureMode,
    proportionality, setProportionality,
    riskLevel, setRiskLevel,
    details, setDetails,
    reset
  };
}

function Step1Content({
  amount, setAmount,
  paymentMethod, setPaymentMethod,
  captureMode, setCaptureMode,
  requiresKyc
}: {
  readonly amount: number;
  readonly setAmount: (v: number) => void;
  readonly paymentMethod: string;
  readonly setPaymentMethod: (v: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "CHEQUE") => void;
  readonly captureMode: "QR" | "MANUAL";
  readonly setCaptureMode: (v: "QR" | "MANUAL") => void;
  readonly requiresKyc: boolean;
}) {
  return (
    <div>
      <h4 className="modal__section-title">1. Umbral y canal operativo</h4>

      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label" htmlFor="bi-amount">MONTO DE LA TRANSACCIÓN</label>
          <input className="form-input form-input--large" id="bi-amount" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="bi-capture">CAPTURA DEL DOCUMENTO</label>
          <div className="radio-group">
            {(["QR", "MANUAL"] as const).map((mode) => (
              <label className="radio-option" key={mode}>
                <input checked={captureMode === mode} name="capture-mode" onChange={() => setCaptureMode(mode)} type="radio" />
                <span className="radio-option__label">{mode === "QR" ? "Escaneo QR" : "Entrada manual"}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="bi-payment">INSTRUMENTO DE PAGO</label>
        <div className="radio-group">
          {(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CHEQUE"] as const).map((method) => (
            <label className="radio-option" key={method}>
              <input checked={paymentMethod === method} name="buyin-method" onChange={() => setPaymentMethod(method)} type="radio" />
              <span className="radio-option__label">{method}</span>
            </label>
          ))}
        </div>
      </div>

      {requiresKyc ? (
        <div className="kyc-warning">
          <strong className="text-gold">KYC ACTIVADO</strong>
          <p>Art. 27 Ley 23/2015 · Documento, nacionalidad, residencia y screening AML/PEP.</p>
        </div>
      ) : null}
    </div>
  );
}

function Step2Content({
  documentNumber, setDocumentNumber,
  nationality, setNationality,
  name, setName,
  residenceCountry, setResidenceCountry,
  proportionality, setProportionality,
  computedRisk,
  requiresRte,
  originOfFunds, setOriginOfFunds,
  captureMode,
  screeningMessage,
  screeningMatches,
  screeningBusy,
  onMarkSuspicious,
  details,
  setDetails
}: {
  readonly documentNumber: string; readonly setDocumentNumber: (v: string) => void;
  readonly nationality: string; readonly setNationality: (v: string) => void;
  readonly name: string; readonly setName: (v: string) => void;
  readonly residenceCountry: string; readonly setResidenceCountry: (v: string) => void;
  readonly proportionality: string; readonly setProportionality: (v: "PROPORCIONAL" | "NO_PROPORCIONAL") => void;
  readonly computedRisk: string;
  readonly requiresRte: boolean;
  readonly originOfFunds: string; readonly setOriginOfFunds: (v: string) => void;
  readonly captureMode: "QR" | "MANUAL";
  readonly screeningMessage: string;
  readonly screeningMatches: string[];
  readonly screeningBusy: boolean;
  readonly onMarkSuspicious: () => void;
  readonly details: ProspectDetailsState;
  readonly setDetails: React.Dispatch<React.SetStateAction<ProspectDetailsState>>;
}) {
  const updateDetail = <K extends keyof ProspectDetailsState>(key: K, value: ProspectDetailsState[K]) =>
    setDetails((current) => ({ ...current, [key]: value }));

  const applyScannedIdentity = (identity: ReturnType<typeof parseScannedIdentity>) => {
    setDocumentNumber(identity.documentNumber);
    if (identity.fullName) setName(identity.fullName);
    if (identity.nationality) setNationality(identity.nationality);
    if (identity.country) {
      setResidenceCountry(identity.country);
      updateDetail("issuingCountry", identity.country);
    }
    if (identity.birthDate) updateDetail("birthDate", identity.birthDate);
    if (identity.sex) updateDetail("sex", identity.sex);
    if (identity.documentIssuedAt) updateDetail("documentIssuedAt", identity.documentIssuedAt);
    if (identity.documentExpiresAt) updateDetail("documentExpiresAt", identity.documentExpiresAt);
  };

  return (
    <div>
      {captureMode === "QR" ? (
        <DocumentScanner
          onDetected={applyScannedIdentity}
        />
      ) : null}
      <h4 className="modal__section-title">2. Identificación del cliente</h4>
      <p className="form-hint">QR preferido. Si no es legible, se admite ingreso manual conforme al criterio del PDF.</p>

      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label" htmlFor="bi-doc">CÉDULA / PASAPORTE</label>
          <input
            className="form-input"
            id="bi-doc"
            value={documentNumber}
            onChange={(event) => {
              const value = event.target.value;
              if (value.includes("|")) {
                const identity = parseScannedIdentity(value);
                applyScannedIdentity(identity);
                return;
              }
              setDocumentNumber(value);
            }}
          />
          <p className="form-hint">Un lector USB/Bluetooth puede escribir directamente en este campo.</p>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="bi-nat">NACIONALIDAD</label>
          <input className="form-input" id="bi-nat" value={nationality} onChange={(event) => setNationality(event.target.value)} />
        </div>
      </div>

      <h4 className="modal__section-title">Documento y datos biograficos</h4>
      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label" htmlFor="bi-doc-type">TIPO DE DOCUMENTO</label>
          <select className="form-input" id="bi-doc-type" value={details.documentType} onChange={(event) => updateDetail("documentType", event.target.value as "CEDULA" | "PASAPORTE")}>
            <option value="CEDULA">Cedula</option><option value="PASAPORTE">Pasaporte</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label" htmlFor="bi-issuer">PAIS EMISOR</label><input className="form-input" id="bi-issuer" value={details.issuingCountry} onChange={(event) => updateDetail("issuingCountry", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-issued">FECHA DE EMISION</label><input className="form-input" id="bi-issued" type="date" value={details.documentIssuedAt} onChange={(event) => updateDetail("documentIssuedAt", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-expires">FECHA DE VENCIMIENTO</label><input className="form-input" id="bi-expires" type="date" value={details.documentExpiresAt} onChange={(event) => updateDetail("documentExpiresAt", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-birth">FECHA DE NACIMIENTO</label><input className="form-input" id="bi-birth" type="date" value={details.birthDate} onChange={(event) => updateDetail("birthDate", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-birth-place">LUGAR DE NACIMIENTO</label><input className="form-input" id="bi-birth-place" value={details.birthPlace} onChange={(event) => updateDetail("birthPlace", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-sex">SEXO</label><select className="form-input" id="bi-sex" value={details.sex} onChange={(event) => updateDetail("sex", event.target.value)}><option value="">Seleccione</option><option value="F">F</option><option value="M">M</option><option value="X">Otro / no especificado</option></select></div>
      </div>

      <h4 className="modal__section-title">Contacto y perfil economico</h4>
      <div className="grid grid--2col mb-lg">
        <div className="form-group"><label className="form-label" htmlFor="bi-address">DIRECCION RESIDENCIAL</label><input className="form-input" id="bi-address" value={details.address} onChange={(event) => updateDetail("address", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-phone">TELEFONO</label><input className="form-input" id="bi-phone" value={details.phone} onChange={(event) => updateDetail("phone", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-email">CORREO ELECTRONICO</label><input className="form-input" id="bi-email" type="email" value={details.email} onChange={(event) => updateDetail("email", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-occupation">OCUPACION / PROFESION</label><input className="form-input" id="bi-occupation" value={details.occupation} onChange={(event) => updateDetail("occupation", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-employer">EMPLEADOR O NEGOCIO</label><input className="form-input" id="bi-employer" value={details.employer} onChange={(event) => updateDetail("employer", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-activity">ACTIVIDAD ECONOMICA</label><input className="form-input" id="bi-activity" value={details.economicActivity} onChange={(event) => updateDetail("economicActivity", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-income">INGRESO MENSUAL</label><select className="form-input" id="bi-income" value={details.monthlyIncomeRange} onChange={(event) => updateDetail("monthlyIncomeRange", event.target.value)}><option value="0-2000">Hasta 2,000</option><option value="2000-5000">2,000 - 5,000</option><option value="5000-10000">5,000 - 10,000</option><option value="10000+">Mas de 10,000</option></select></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-frequency">FRECUENCIA ESPERADA</label><select className="form-input" id="bi-frequency" value={details.expectedGamingFrequency} onChange={(event) => updateDetail("expectedGamingFrequency", event.target.value)}><option value="Ocasional">Ocasional</option><option value="Mensual">Mensual</option><option value="Semanal">Semanal</option><option value="Frecuente">Frecuente</option></select></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-purpose">PROPOSITO DE LA RELACION</label><input className="form-input" id="bi-purpose" value={details.relationshipPurpose} onChange={(event) => updateDetail("relationshipPurpose", event.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="bi-wealth">ORIGEN DEL PATRIMONIO</label><input className="form-input" id="bi-wealth" placeholder="Ahorros, herencia, venta de bienes, negocios..." value={details.sourceOfWealth} onChange={(event) => updateDetail("sourceOfWealth", event.target.value)} /></div>
      </div>

      <div className="form-group">
        <label className="radio-option"><input type="checkbox" checked={details.actsOnOwnBehalf} onChange={(event) => updateDetail("actsOnOwnBehalf", event.target.checked)} /><span className="radio-option__label">El cliente declara actuar en nombre y por cuenta propia (beneficiario final)</span></label>
        {!details.actsOnOwnBehalf ? <input className="form-input" aria-label="Detalle del tercero o beneficiario final" placeholder="Nombre, documento y relacion del tercero o beneficiario final" value={details.thirdPartyDetails} onChange={(event) => updateDetail("thirdPartyDetails", event.target.value)} /> : null}
      </div>

      <div className="form-group">
        <label className="radio-option"><input type="checkbox" checked={details.isPep} onChange={(event) => updateDetail("isPep", event.target.checked)} /><span className="radio-option__label">Declara condicion PEP, familiar cercano o estrecho colaborador</span></label>
        {details.isPep ? <input className="form-input" aria-label="Detalle de condicion PEP" placeholder="Cargo, institucion, pais o relacion" value={details.pepRelationship} onChange={(event) => updateDetail("pepRelationship", event.target.value)} /> : null}
      </div>

      {requiresRte ? (
        <div className="form-group">
          <label className="radio-option"><input type="checkbox" checked={details.clientDeclarationAccepted} onChange={(event) => updateDetail("clientDeclarationAccepted", event.target.checked)} /><span className="radio-option__label">El cliente confirma la declaracion de origen de fondos y firma el RTE</span></label>
        </div>
      ) : null}

      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label" htmlFor="bi-name">NOMBRE COMPLETO</label>
          <input className="form-input" id="bi-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="bi-res">PAÍS DE RESIDENCIA</label>
          <input className="form-input" id="bi-res" value={residenceCountry} onChange={(event) => setResidenceCountry(event.target.value)} />
        </div>
      </div>

      {computedRisk === "AMARILLO" ? (
        <div className="form-group">
          <label className="form-label" htmlFor="bi-prop">PROPORCIONALIDAD PEP / PERFIL ECONÓMICO</label>
          <div className="radio-group">
            {(["PROPORCIONAL", "NO_PROPORCIONAL"] as const).map((value) => (
              <label className="radio-option" key={value}>
                <input checked={proportionality === value} name="proportionality" onChange={() => setProportionality(value)} type="radio" />
                <span className="radio-option__label">{value === "PROPORCIONAL" ? "Proporcional" : "No proporcional"}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="form-group">
        <label className="form-label" htmlFor="bi-funds">ORIGEN DE FONDOS / JUSTIFICACIÓN</label>
        <textarea className="form-input form-textarea" id="bi-funds" value={originOfFunds} onChange={(event) => setOriginOfFunds(event.target.value)} />
      </div>

      <div className="screening-result">
        <h5>Screening AML/PEP</h5>
        {computedRisk === "ROJO" && screeningMatches.length ? (
          <div className="screening-findings">
            <strong>Coincidencias encontradas</strong>
            <ul>
              {screeningMatches.map((match) => <li key={match}>{match}</li>)}
            </ul>
          </div>
        ) : (
          <div className="screening-badges">
            <span className="badge badge--green">OFAC</span>
            <span className="badge badge--green">ONU</span>
            <span className="badge badge--green">UE</span>
            <span className="badge badge--green">PEP</span>
          </div>
        )}
        <div className="screening-summary">
          <RiskBadge risk={computedRisk as "VERDE" | "AMARILLO" | "ROJO"} />
          <p className="text-secondary">
            {computedRisk === "VERDE" && "Sin coincidencias. Puede avanzar."}
            {computedRisk === "AMARILLO" && "Caso PEP o riesgo geográfico. Requiere evaluación privada."}
            {computedRisk === "ROJO" && "Coincidencia AML. La transacción quedará bloqueada."}
          </p>
        </div>
        <div className="demo-screening-actions">
          <button
            className="btn btn--secondary"
            disabled={screeningBusy || documentNumber.trim().length < 4}
            onClick={onMarkSuspicious}
            type="button"
          >
            {screeningBusy ? "Procesando..." : "Marcar esta cédula como sospechosa"}
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              const identity = parseScannedIdentity(
                "8-958-2038|Jack Robert|Garcia Gonzalez||M|PANAMÁ|20000720|PANAMEÑA|20230421|20380421|A01161427"
              );
              applyScannedIdentity(identity);
            }}
            type="button"
          >
            Cargar cédula de prueba
          </button>
          {screeningMessage ? <p className="form-hint" role="status">{screeningMessage}</p> : null}
        </div>
      </div>
    </div>
  );
}

function Step3Content({
  session,
  amount,
  captureMode,
  name,
  residenceCountry,
  riskLevel,
  requiresRte,
  proportionality,
  screeningMatches
}: {
  readonly session: { readonly role?: string } | null;
  readonly amount: number;
  readonly captureMode: string;
  readonly name: string;
  readonly residenceCountry: string;
  readonly riskLevel: string;
  readonly requiresRte: boolean;
  readonly proportionality: string;
  readonly screeningMatches: string[];
}) {
  return (
    <div>
      <h4 className="modal__section-title">3. Expediente y semáforo</h4>
      <div className="receipt">
        <div className="receipt__header">
          <div className="receipt__title text-gold">EXPEDIENTE DE BUY-IN</div>
          <div className="receipt__id">TX-{new Date().getFullYear()}-{Date.now().toString().slice(-5)}</div>
        </div>
        <div className="receipt__row">
          <span>Canal</span>
          <span>{session?.role === "Supervisor" ? "Mesa" : "Caja"}</span>
        </div>
        <div className="receipt__row">
          <span>Monto</span>
          <span className="text-gold">{formatCurrency(amount)}</span>
        </div>
        <div className="receipt__row">
          <span>Documento</span>
          <span>{captureMode === "QR" ? "Escaneo QR" : "Entrada manual"}</span>
        </div>
        <div className="receipt__row">
          <span>Cliente</span>
          <span>{name}</span>
        </div>
        <div className="receipt__row">
          <span>Residencia</span>
          <span>{residenceCountry}</span>
        </div>
        <div className="modal-risk-line">
          <RiskBadge risk={riskLevel as "VERDE" | "AMARILLO" | "ROJO"} />
          {requiresRte ? <span className="badge badge--yellow">RTE requerido</span> : null}
          {proportionality === "NO_PROPORCIONAL" ? <span className="badge badge--yellow">Escalar PEP</span> : null}
        </div>
        {screeningMatches.length ? (
          <div className="screening-findings">
            <strong>Motivos de la coincidencia</strong>
            <ul>
              {screeningMatches.map((match) => <li key={match}>{match}</li>)}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="trace-panel">
        <strong>Trazabilidad</strong>
        <p>Hash+salt para documento, expediente inmutable y retención mínima de 5 años.</p>
      </div>
    </div>
  );
}

export function BuyInModal({
  isOpen,
  onClose,
  onSuccess
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}) {
  const submitTransaction = useAppStore((state) => state.submitTransaction);
  const session = useAppStore((state) => state.session);
  const form = useBuyInForm();
  const [screeningMessage, setScreeningMessage] = useState("");
  const [screeningBusy, setScreeningBusy] = useState(false);
  const [screeningMatches, setScreeningMatches] = useState<string[]>([]);

  const requiresKyc = form.amount >= 2000;
  const requiresRte = form.amount >= 10000 && form.paymentMethod === "EFECTIVO";

  const computedRisk = useMemo(() => {
    const upper = form.name.toUpperCase();
    const country = form.residenceCountry.toUpperCase();
    if (upper.includes("OFAC") || upper.includes("SANCIONADO")) return "ROJO" as const;
    if (form.details.isPep || upper.includes("PEP") || upper.includes("ALCALDE") || form.amount >= 8000 || country.includes("RIESGO")) return "AMARILLO" as const;
    return "VERDE" as const;
  }, [form.amount, form.name, form.residenceCountry, form.details.isPep]);

  const handleSubmit = async () => {
    if (form.step === 1) {
      form.setStep(requiresKyc ? 2 : 3);
      return;
    }

    if (form.step === 2) {
      const requiredValues = [
        form.documentNumber, form.name, form.nationality, form.residenceCountry,
        form.details.issuingCountry, form.details.birthDate, form.details.documentExpiresAt,
        form.details.address, form.details.phone, form.details.occupation,
        form.details.economicActivity, form.details.monthlyIncomeRange, form.details.sourceOfWealth, form.originOfFunds
      ];
      if (requiredValues.some((value) => !value.trim())) {
        setScreeningMessage("Completa los campos obligatorios de identidad, contacto y perfil economico.");
        return;
      }
      if (new Date(form.details.documentExpiresAt) < new Date()) {
        setScreeningMessage("El documento esta vencido y no permite continuar.");
        return;
      }
      if (form.details.isPep && !form.details.pepRelationship.trim()) {
        setScreeningMessage("Documenta el cargo, institucion o relacion que origina la condicion PEP.");
        return;
      }
      if (!form.details.actsOnOwnBehalf && !form.details.thirdPartyDetails.trim()) {
        setScreeningMessage("Identifica al tercero o beneficiario final por el que actua el cliente.");
        return;
      }
      if (requiresRte && !form.details.clientDeclarationAccepted) {
        setScreeningMessage("El RTE requiere la confirmacion y firma del cliente antes de continuar.");
        return;
      }
      setScreeningBusy(true);
      setScreeningMessage("Consultando listas AML/PEP...");
      try {
        const result = await runScreening({
          clientName: form.name,
          documentNumber: form.documentNumber,
          amount: form.amount
        });
        form.setRiskLevel(result.level);
        setScreeningMatches(result.amlMatches);
        setScreeningMessage(
          result.level === "ROJO"
            ? "Coincidencia encontrada. La operación será bloqueada y generará una alerta."
            : "Screening completado."
        );
      } catch (error) {
        form.setRiskLevel(computedRisk);
        setScreeningMessage(error instanceof Error ? error.message : "No fue posible completar el screening.");
      } finally {
        setScreeningBusy(false);
      }
      form.setStep(3);
      return;
    }

    setScreeningBusy(true);
    setScreeningMessage("Guardando expediente KYC y evidencia...");
    try {
      if (requiresKyc) {
        const nameParts = form.name.trim().split(/\s+/);
        const splitAt = Math.max(1, Math.ceil(nameParts.length / 2));
        const riskMap = { VERDE: "Verde", AMARILLO: "Amarillo", ROJO: "Rojo" } as const;
        const prospect = await saveProspect({
          documentNumber: form.documentNumber,
          documentType: form.details.documentType,
          issuingCountry: form.details.issuingCountry,
          documentIssuedAt: form.details.documentIssuedAt || undefined,
          documentExpiresAt: form.details.documentExpiresAt || undefined,
          firstNames: nameParts.slice(0, splitAt).join(" "),
          lastNames: nameParts.slice(splitAt).join(" ") || "No indicado",
          birthDate: form.details.birthDate || undefined,
          birthPlace: form.details.birthPlace,
          sex: form.details.sex,
          nationality: form.nationality,
          residenceCountry: form.residenceCountry,
          address: form.details.address,
          phone: form.details.phone,
          email: form.details.email,
          occupation: form.details.occupation,
          employer: form.details.employer,
          economicActivity: form.details.economicActivity,
          monthlyIncomeRange: form.details.monthlyIncomeRange,
          expectedGamingAmount: form.amount,
          expectedGamingFrequency: form.details.expectedGamingFrequency,
          sourceOfFunds: form.originOfFunds,
          sourceOfWealth: form.details.sourceOfWealth,
          relationshipPurpose: form.details.relationshipPurpose,
          actsOnOwnBehalf: form.details.actsOnOwnBehalf,
          thirdPartyDetails: form.details.thirdPartyDetails,
          isPep: form.details.isPep,
          pepRelationship: form.details.pepRelationship,
          riskLevel: riskMap[form.riskLevel],
          riskScore: form.riskLevel === "ROJO" ? 100 : form.riskLevel === "AMARILLO" ? 60 : 15,
          status: form.riskLevel === "ROJO" ? "RECHAZADO" : form.riskLevel === "AMARILLO" ? "PENDIENTE_REVISION" : "APROBADO"
        });
        await addProspectEvidence(prospect.id, {
          evidenceType: "DOCUMENTO_IDENTIDAD",
          source: form.captureMode === "QR" ? "LECTOR_QR_PDF417" : "CAPTURA_MANUAL",
          reference: `${form.captureMode}-${Date.now()}`,
          result: screeningMatches.length ? screeningMatches.join("; ") : "Documento capturado y screening completado sin coincidencias.",
          isSimulated: true
        });
      }

      const result = await submitTransaction({
      type: "BUY_IN",
      clientDisplayName: form.name,
      documentNumber: form.documentNumber,
      amount: form.amount,
      paymentMethod: form.paymentMethod,
      originOfFunds: requiresRte || form.proportionality === "NO_PROPORCIONAL" ? form.originOfFunds : undefined,
      justification: form.proportionality === "NO_PROPORCIONAL" ? form.originOfFunds : undefined,
      nationality: form.nationality,
      residenceCountry: form.residenceCountry,
      sourceChannel: session?.role === "Supervisor" ? "MESA" : "CAJA",
      documentCaptureMode: form.captureMode,
      signedByClient: form.details.clientDeclarationAccepted
      });
      form.setRiskLevel(result.level);
      onClose();
      form.reset();
      onSuccess();
    } catch (error) {
      setScreeningMessage(error instanceof Error ? error.message : "No fue posible guardar el expediente KYC.");
    } finally {
      setScreeningBusy(false);
    }
  };

  const markDocumentAsSuspicious = async () => {
    if (form.documentNumber.trim().length < 4) return;
    setScreeningBusy(true);
    setScreeningMessage("Generando hash y agregando a la lista AML de demostración...");

    try {
      const watchlist = await addDemoWatchlist(form.documentNumber);
      const result = await runScreening({
        clientName: form.name,
        documentNumber: form.documentNumber,
        amount: form.amount
      });
      form.setRiskLevel(result.level);
      setScreeningMatches(result.amlMatches);
      setScreeningMessage(`${watchlist.message} Hash: ${watchlist.maskedHash}`);
    } catch (error) {
      setScreeningMessage(error instanceof Error ? error.message : "No fue posible preparar la demostración.");
    } finally {
      setScreeningBusy(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={() => {
        onClose();
        form.reset();
      }}
      title={session?.role === "Supervisor" ? "Buy-in — Mesa de juego" : "Buy-in — Compra de fichas"}
      maxWidth={760}
      footer={
        <>
          <button
            className="btn btn--secondary"
            onClick={() => form.setStep((current: number) => Math.max(1, current - 1))}
            style={{ visibility: form.step === 1 ? "hidden" : "visible" }}
            type="button"
          >
            Volver
          </button>
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Pausar y atender siguiente
          </button>
          <button className="btn btn--primary" onClick={handleSubmit} type="button">
            {form.step === 3 ? "Registrar expediente" : "Continuar"}
          </button>
        </>
      }
    >
      <p className="modal__intro">
        Menor a <strong>$2,000</strong>: sin KYC. Igual o mayor: escaneo de documento, screening AML/PEP y control de trazabilidad.
      </p>

      {form.step === 1 ? (
        <Step1Content
          amount={form.amount} setAmount={form.setAmount}
          paymentMethod={form.paymentMethod} setPaymentMethod={form.setPaymentMethod}
          captureMode={form.captureMode} setCaptureMode={form.setCaptureMode}
          requiresKyc={requiresKyc}
        />
      ) : null}

      {form.step === 2 ? (
        <Step2Content
          documentNumber={form.documentNumber} setDocumentNumber={form.setDocumentNumber}
          nationality={form.nationality} setNationality={form.setNationality}
          name={form.name} setName={form.setName}
          residenceCountry={form.residenceCountry} setResidenceCountry={form.setResidenceCountry}
          proportionality={form.proportionality} setProportionality={form.setProportionality}
          computedRisk={form.riskLevel === "ROJO" ? "ROJO" : computedRisk}
          requiresRte={requiresRte}
          originOfFunds={form.originOfFunds} setOriginOfFunds={form.setOriginOfFunds}
          captureMode={form.captureMode}
          screeningMessage={screeningMessage}
          screeningMatches={screeningMatches}
          screeningBusy={screeningBusy}
          onMarkSuspicious={markDocumentAsSuspicious}
          details={form.details}
          setDetails={form.setDetails}
        />
      ) : null}

      {form.step === 3 ? (
        <Step3Content
          session={session}
          amount={form.amount}
          captureMode={form.captureMode}
          name={form.name}
          residenceCountry={form.residenceCountry}
          riskLevel={form.riskLevel}
          requiresRte={requiresRte}
          proportionality={form.proportionality}
          screeningMatches={screeningMatches}
        />
      ) : null}
    </ModalShell>
  );
}

export function CashOutModal({ isOpen, onClose }: { readonly isOpen: boolean; readonly onClose: () => void }) {
  const submitTransaction = useAppStore((state) => state.submitTransaction);
  const [amount] = useState(3000);
  const [documentNumber, setDocumentNumber] = useState("8-902-1547");
  const [name, setName] = useState("Luis Fernando Espinosa Quintero");
  const [nationality, setNationality] = useState("Panameña");
  const [residenceCountry, setResidenceCountry] = useState("Panamá");
  const [chipsPlayedRatio, setChipsPlayedRatio] = useState(0.18);
  const [captureMode, setCaptureMode] = useState<"QR" | "MANUAL">("QR");
  const netAmount = Math.round(amount * 0.985);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Cash-out — Canje de tickets"
      maxWidth={700}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="btn btn--primary"
            onClick={async () => {
              await submitTransaction({
                type: "CASH_OUT",
                clientDisplayName: name,
                documentNumber,
                amount,
                paymentMethod: "EFECTIVO",
                originOfFunds: "Canje validado contra tickets autenticados.",
                chipsPlayedRatio,
                nationality,
                residenceCountry,
                sourceChannel: "CAJA",
                documentCaptureMode: captureMode
              });
              onClose();
            }}
            type="button"
          >
            Confirmar — Entregar {formatCurrency(netAmount)}
          </button>
        </>
      }
    >
      <p className="modal__intro">
        Validación de autenticidad obligatoria antes de pagar. Si el total alcanza <strong>$2,000</strong>, se activa KYC.
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="co-tickets">TICKETS RECIBIDOS</label>
        <ul className="ticket-list" id="co-tickets">
          <li className="ticket-item">
            <span className="ticket-item__code">TKT-A47-2218</span>
            <span className="ticket-item__value">$1,800</span>
          </li>
          <li className="ticket-item">
            <span className="ticket-item__code">TKT-A47-2241</span>
            <span className="ticket-item__value">$950</span>
          </li>
          <li className="ticket-item">
            <span className="ticket-item__code">TKT-A47-2253</span>
            <span className="ticket-item__value">$250</span>
          </li>
        </ul>
      </div>

      <div className="receipt mb-lg">
        <div className="receipt__row">
          <span>Subtotal</span>
          <span className="font-mono">{formatCurrency(amount)}</span>
        </div>
        <div className="receipt__row">
          <span>Comisión (1.5%)</span>
          <span className="font-mono">-{formatCurrency(Math.round(amount * 0.015))}</span>
        </div>
        <div className="receipt__row receipt__row--total">
          <strong>Neto a entregar</strong>
          <strong className="text-gold">{formatCurrency(netAmount)}</strong>
        </div>
      </div>

      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label" htmlFor="co-doc">IDENTIFICACIÓN</label>
          <input className="form-input" id="co-doc" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="co-capture">CAPTURA</label>
          <div className="radio-group">
            {(["QR", "MANUAL"] as const).map((mode) => (
              <label className="radio-option" key={mode}>
                <input checked={captureMode === mode} name="cashout-capture" onChange={() => setCaptureMode(mode)} type="radio" />
                <span className="radio-option__label">{mode}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label" htmlFor="co-name">CLIENTE</label>
          <input className="form-input" id="co-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="co-ratio">RATIO FICHAS APOSTADAS</label>
          <input className="form-input" id="co-ratio" max="1" min="0" step="0.01" type="number" value={chipsPlayedRatio} onChange={(event) => setChipsPlayedRatio(Number(event.target.value))} />
        </div>
      </div>

      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label" htmlFor="co-nat">NACIONALIDAD</label>
          <input className="form-input" id="co-nat" value={nationality} onChange={(event) => setNationality(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="co-res">PAÍS DE RESIDENCIA</label>
          <input className="form-input" id="co-res" value={residenceCountry} onChange={(event) => setResidenceCountry(event.target.value)} />
        </div>
      </div>

      <div className="screening-result">
        <h5>Verificaciones</h5>
        <ul className="verification-list">
          <li>Tickets autenticados antes del pago.</li>
          <li>KYC obligatorio desde $2,000.</li>
          <li>Si el jugador apostó menos del 20%, se genera alerta automática al oficial.</li>
        </ul>
      </div>
    </ModalShell>
  );
}

export function ManualAlertModal({ isOpen, onClose }: { readonly isOpen: boolean; readonly onClose: () => void }) {
  const createManualAlert = useAppStore((state) => state.createManualAlert);
  const session = useAppStore((state) => state.session);
  const [title, setTitle] = useState("Comportamiento sospechoso en sala");
  const [description, setDescription] = useState(
    "Jugador cambia su patron de juego, evita interacción y solicita dispersar operaciones entre mesa y caja."
  );
  const [clientHash, setClientHash] = useState("b88e...2741");
  const [amount, setAmount] = useState(1800);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Alerta discreta"
      maxWidth={620}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="btn btn--primary"
            onClick={async () => {
              await createManualAlert({ title, description, clientHash, amount });
              onClose();
            }}
            type="button"
          >
            Registrar sin alertar al cliente
          </button>
        </>
      }
    >
      <p className="modal__intro">
        {session?.role === "Supervisor" ? "Escala el caso al oficial" : "Deja constancia interna"} sin interrumpir la operación en
        sala.
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="ma-title">MOTIVO</label>
        <input className="form-input" id="ma-title" value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>
      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label" htmlFor="ma-hash">HASH DEL CLIENTE</label>
          <input className="form-input" id="ma-hash" value={clientHash} onChange={(event) => setClientHash(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ma-amount">MONTO REFERENCIAL</label>
          <input className="form-input" id="ma-amount" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="ma-desc">DETALLE INTERNO</label>
        <textarea className="form-input form-textarea" id="ma-desc" value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
    </ModalShell>
  );
}

export function ReceiptModal({ isOpen, onClose }: { readonly isOpen: boolean; readonly onClose: () => void }) {
  const session = useAppStore((state) => state.session);

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Comprobante" maxWidth={420}>
      <div className="receipt">
        <div className="receipt__header">
          <div className="receipt__title text-gold">CASINODESK · EXPEDIENTE AML</div>
          <div className="receipt__id">EXP-{new Date().getFullYear()}-{Date.now().toString().slice(-6)}</div>
        </div>
        <div className="receipt__row">
          <span>Estación</span>
          <span>{session?.station} · {session?.initials}</span>
        </div>
        <div className="receipt__row">
          <span>Cliente</span>
          <span>Registro completado</span>
        </div>
        <div className="receipt__row">
          <span>Semáforo</span>
          <span className="badge badge--green">VERDE</span>
        </div>
        <div className="receipt__row receipt__row--total">
          <strong>ESTADO</strong>
          <strong className="text-gold">Expediente generado</strong>
        </div>
        <div className="receipt__footer">Trazabilidad obligatoria por 5 años conforme a la Ley 23/2015.</div>
      </div>
    </ModalShell>
  );
}
