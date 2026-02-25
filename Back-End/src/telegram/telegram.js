// Back-End/src/telegram/telegram.js
import axios from "axios";

/**
 * Envia mensagem no Telegram.
 * - texto: string obrigatória
 * - options: opcional (reply_markup, parse_mode, disable_web_page_preview etc)
 */
export async function enviarTelegram(texto, options = {}) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT;

  if (!token) throw new Error("TELEGRAM_TOKEN não configurado");
  if (!chatId) throw new Error("TELEGRAM_CHAT não configurado");

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: texto,
    ...options,
  });
}