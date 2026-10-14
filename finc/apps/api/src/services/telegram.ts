import type { Config } from "../config.js";

export interface InlineKeyboard {
  inline_keyboard: { text: string; callback_data: string }[][];
}

export interface Telegram {
  readonly enabled: boolean;
  sendMessage(text: string, keyboard?: InlineKeyboard): Promise<void>;
  editKeyboard(chatId: number | string, messageId: number, keyboard: InlineKeyboard): Promise<void>;
  answerCallback(callbackId: string, text?: string): Promise<void>;
}

/** Integração com a Bot API do Telegram (canal da equipe de suporte, herdado da FINC original). */
export function createTelegram(cfg: Config): Telegram {
  const token = cfg.TELEGRAM_BOT_TOKEN;
  const chatId = cfg.TELEGRAM_CHAT_ID;
  const call = async (method: string, body: unknown) => {
    if (!token) throw new Error("Telegram não configurado");
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Telegram respondeu HTTP ${res.status}`);
  };
  return {
    enabled: Boolean(token && chatId),
    sendMessage: (text, keyboard) =>
      call("sendMessage", {
        chat_id: chatId,
        text,
        ...(keyboard ? { reply_markup: keyboard } : {}),
      }),
    editKeyboard: (chat, messageId, keyboard) =>
      call("editMessageReplyMarkup", {
        chat_id: chat,
        message_id: messageId,
        reply_markup: keyboard,
      }),
    answerCallback: (callbackId, text = "") =>
      call("answerCallbackQuery", { callback_query_id: callbackId, text }),
  };
}
