import axios from "axios";

export async function enviarTelegram(texto) {

  await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
    {
      chat_id: process.env.TELEGRAM_CHAT,
      text: texto
    }
  );
}
