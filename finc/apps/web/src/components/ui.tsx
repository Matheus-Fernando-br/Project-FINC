import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { moduloDaRota } from "../nav";

/** Marca FINC: palavra "finc" + a bolinha verde. */
/**
 * Volta para a página anterior quando ela é da própria FINC; se a pessoa chegou direto pelo link,
 * leva para `fallback` (padrão: início).
 */
export function BotaoVoltar({
  fallback = "/",
  rotulo = "Voltar",
}: {
  fallback?: string;
  rotulo?: string;
}) {
  const navigate = useNavigate();
  const loc = useLocation();
  return (
    <button
      type="button"
      className="btn-voltar"
      onClick={() => (loc.key !== "default" ? navigate(-1) : navigate(fallback))}
    >
      <i className="bi bi-chevron-left" aria-hidden /> {rotulo}
    </button>
  );
}

export function Logo({ claro = false, altura = 26 }: { claro?: boolean; altura?: number }) {
  return (
    <span
      className="logo-finc"
      role="img"
      aria-label="FINC"
      style={{ display: "inline-flex", alignItems: "center", gap: altura * 0.14, height: altura }}
    >
      <span
        aria-hidden
        style={{
          fontWeight: 700,
          fontSize: altura * 0.92,
          letterSpacing: "-0.055em",
          color: claro ? "#fff" : "var(--ink)",
          lineHeight: 1,
        }}
      >
        finc
      </span>
      <span
        aria-hidden
        className="orb"
        style={{ width: altura * 0.5, height: altura * 0.5, boxShadow: "none" }}
      />
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: BtnProps) {
  return (
    <button
      type="button"
      className={`btn ${variant === "primary" ? "" : variant} ${size === "sm" ? "sm" : size === "lg" ? "lg" : ""} ${!children ? "icon" : ""} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="spinner" aria-hidden />
      ) : icon ? (
        <i className={`bi ${icon}`} aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

export function Field({
  label,
  required,
  error,
  hint,
  className = "",
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  // Associa rótulo e controle automaticamente quando o filho não tem id (acessibilidade).
  const autoId = useId();
  let controle = children;
  let alvo = htmlFor;
  if (!alvo && isValidElement(children)) {
    const el = children as ReactElement<{ id?: string }>;
    alvo = el.props.id ?? autoId;
    if (!el.props.id) controle = cloneElement(el, { id: alvo });
  }
  return (
    <div className={`field ${error ? "invalid" : ""} ${className}`}>
      <label htmlFor={alvo}>
        {label} {required && <span className="req">*</span>}
      </label>
      {controle}
      {error ? (
        <span className="err" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  icon,
  eyebrow,
  sub,
  actions,
}: {
  title: string;
  icon?: string;
  eyebrow?: string;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  const { pathname } = useLocation();
  const modulo = eyebrow ?? moduloDaRota(pathname)?.label;
  useEffect(() => {
    document.title = `${title} · FINC`;
  }, [title]);
  return (
    <div className="page-header" data-icon={icon}>
      <div>
        {modulo && (
          <div className="eyebrow">
            <span className="dot" />
            {modulo}
          </div>
        )}
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  icon,
  children,
  actions,
  className = "",
}: {
  title?: string;
  icon?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-title">
          {icon && <i className={`bi ${icon}`} aria-hidden />}
          {title && <h3 style={{ flex: 1 }}>{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export const Badge = ({
  tone,
  children,
}: {
  tone?: "success" | "danger" | "warning" | "info";
  children: ReactNode;
}) => <span className={`badge ${tone ?? ""}`}>{children}</span>;

export const Loading = ({ texto = "Carregando..." }: { texto?: string }) => (
  <div className="loading" role="status">
    <span className="pulso" /> {texto}
  </div>
);

export const Empty = ({ icon = "bi-inbox", children }: { icon?: string; children: ReactNode }) => (
  <div className="empty">
    <span className="orb" aria-hidden>
      <i className={`bi ${icon}`} />
    </span>
    {children}
  </div>
);

export function Alert({
  tone = "info",
  children,
  icon,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  children: ReactNode;
  icon?: string;
}) {
  const ic =
    icon ??
    {
      info: "bi-info-circle",
      warning: "bi-exclamation-triangle",
      danger: "bi-x-octagon",
      success: "bi-check-circle",
    }[tone];
  return (
    <div className={`alert ${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <i className={`bi ${ic}`} aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function ErrorBox({
  error,
  onRetry,
}: {
  error: ApiError | Error | null;
  onRetry?: () => void;
}) {
  if (!error) return null;
  return (
    <Alert tone="danger">
      {error.message}{" "}
      {onRetry && (
        <button className="btn sm secondary" onClick={onRetry} style={{ marginLeft: 8 }}>
          Tentar novamente
        </button>
      )}
    </Alert>
  );
}

export function Modal({
  title,
  open,
  onClose,
  children,
  footer,
  width,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={width ? { width: `min(${width}px, 100%)` } : undefined}
      >
        <header>
          <h3>{title}</h3>
          <Button variant="ghost" icon="bi-x-lg" aria-label="Fechar" onClick={onClose} />
        </header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pagination">
      <span>
        {total} registro{total === 1 ? "" : "s"}
      </span>
      <div className="row">
        <Button
          variant="secondary"
          size="sm"
          icon="bi-chevron-left"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Página anterior"
        />
        <span>
          {page} / {pages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon="bi-chevron-right"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Próxima página"
        />
      </div>
    </div>
  );
}

/* ============ Toasts ============ */
interface Toast {
  id: number;
  tipo: "success" | "error" | "info";
  texto: string;
}
const ToastCtx = createContext<(tipo: Toast["tipo"], texto: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const push = useCallback((tipo: Toast["tipo"], texto: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, tipo, texto }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tipo}`}>
            <i
              className={`bi ${t.tipo === "error" ? "bi-x-circle" : t.tipo === "success" ? "bi-check-circle" : "bi-info-circle"}`}
              aria-hidden
            />
            <span>{t.texto}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const push = useContext(ToastCtx);
  return {
    sucesso: (t: string) => push("success", t),
    erro: (e: unknown) => push("error", e instanceof Error ? e.message : String(e)),
    info: (t: string) => push("info", t),
  };
}

/* ============ Confirmação ============ */
export function useConfirm() {
  const [state, setState] = useState<{
    titulo: string;
    texto: ReactNode;
    perigo?: boolean;
    resolve: (ok: boolean) => void;
  } | null>(null);
  const confirmar = (titulo: string, texto: ReactNode, perigo = true) =>
    new Promise<boolean>((resolve) => setState({ titulo, texto, perigo, resolve }));
  const fechar = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };
  const dialog = (
    <Modal
      title={state?.titulo ?? ""}
      open={Boolean(state)}
      onClose={() => fechar(false)}
      footer={
        <>
          <Button variant="secondary" onClick={() => fechar(false)}>
            Cancelar
          </Button>
          <Button variant={state?.perigo ? "danger" : "primary"} onClick={() => fechar(true)}>
            Confirmar
          </Button>
        </>
      }
    >
      <p>{state?.texto}</p>
    </Modal>
  );
  return { confirmar, dialog };
}
