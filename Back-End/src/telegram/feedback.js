import { enviarTelegram } from "./telegram.js";

export async function enviarFeedback(req, res) {

  try {

    const { mensagem, user } = req.body;

    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ erro: "Mensagem vazia" });
    }

    await enviarTelegram(
`FEEDBACK DO SISTEMA:
-------
Usuário: ${user.nome}
E-mail: ${user.email}

Mensagem:
${mensagem}`
    );

    res.sendStatus(200);

  } catch (err) {
    console.log(err);
    res.status(500).json({ erro: "Erro ao enviar feedback" });
  }
}
