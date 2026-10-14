import nodemailer from "nodemailer";
import type { Config } from "../config.js";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
}

export interface Mailer {
  readonly enabled: boolean;
  send(msg: EmailMessage): Promise<void>;
}

/** Envio via SMTP (qualquer provedor: Gmail/Workspace, SES, Mailgun, Brevo...). Desligado se não configurado. */
export function createMailer(cfg: Config): Mailer {
  if (!cfg.SMTP_HOST || !cfg.SMTP_FROM) {
    return {
      enabled: false,
      async send() {
        throw new Error("SMTP não configurado");
      },
    };
  }
  const transport = nodemailer.createTransport({
    host: cfg.SMTP_HOST,
    port: cfg.SMTP_PORT ?? (cfg.SMTP_SECURE ? 465 : 587),
    secure: cfg.SMTP_SECURE,
    auth: cfg.SMTP_USER ? { user: cfg.SMTP_USER, pass: cfg.SMTP_PASS ?? "" } : undefined,
  });
  return {
    enabled: true,
    async send(msg) {
      await transport.sendMail({ from: cfg.SMTP_FROM, ...msg });
    },
  };
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
