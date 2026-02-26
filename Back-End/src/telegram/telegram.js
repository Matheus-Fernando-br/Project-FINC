// Back-End/src/telegram/telegram.js
import axios from "axios";

function getToken() {
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) throw new Error("TELEGRAM_TOKEN não configurado");
  return token;
}

function getChatIdPadrao() {
  const chatId = process.env.TELEGRAM_CHAT;
  if (!chatId) throw new Error("TELEGRAM_CHAT não configurado");
  return chatId;
}

/**
 * Envia mensagem no Telegram (chat padrão do sistema)
 */
export async function enviarTelegram(texto, options = {}) {
  const token = getToken();
  const chatId = getChatIdPadrao();

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: texto,
    ...options,
  });
}

/**
 * Edita o teclado inline de uma mensagem existente
 */
export async function editarTecladoTelegram(chat_id, message_id, reply_markup) {
  const token = getToken();

  await axios.post(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
    chat_id,
    message_id,
    reply_markup,
  });
}

/**
 * Mostra um "toast" quando clica no botão (sem mandar mensagem no chat)
 */
export async function responderCallbackQuery(callback_query_id, text = "") {
  const token = getToken();

  await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    callback_query_id,
    text,
    show_alert: false,
  });
}