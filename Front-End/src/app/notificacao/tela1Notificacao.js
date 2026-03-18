import icons from "../../components/Icons";
import "./notificacao.css";
import { useState } from "react";

function Tela_1_notificacao() {
  const [aberto, setAberto] = useState({
    email: true,
    whatsapp: false,
    sms: false,
    telegram: false,
  });

  const [canais, setCanais] = useState({
    email: {
      titulo: "E-mail",
      ativo: true,
      configurado: true,
      remetente: "notificacoes@finc.com.br",
      destino: "",
      assunto: "Atualização do sistema FINC",
      mensagem: "Olá! Esta é uma notificação enviada pela plataforma FINC.",
      historico: [
        "Canal configurado com sucesso",
        "Último teste realizado com sucesso",
      ],
    },
    whatsapp: {
      titulo: "WhatsApp",
      ativo: false,
      configurado: false,
      remetente: "FINC Business",
      destino: "",
      assunto: "Mensagem via WhatsApp",
      mensagem: "Olá! Esta é uma mensagem enviada pelo canal WhatsApp.",
      historico: [
        "Canal criado",
        "Integração pendente",
      ],
    },
    sms: {
      titulo: "SMS",
      ativo: false,
      configurado: false,
      remetente: "FINC",
      destino: "",
      assunto: "Mensagem SMS",
      mensagem: "Sua notificação FINC foi processada com sucesso.",
      historico: [
        "Canal criado",
        "Aguardando configuração de provedor",
      ],
    },
    telegram: {
      titulo: "Telegram",
      ativo: false,
      configurado: false,
      remetente: "@finc_bot",
      destino: "",
      assunto: "Mensagem Telegram",
      mensagem: "Olá! Esta é uma mensagem enviada pelo canal Telegram.",
      historico: [
        "Canal criado",
        "Bot ainda não vinculado",
      ],
    },
  });

  const [texto, setTexto] = useState("");

  const toggleSecao = (tipo) => {
    setAberto((prev) => ({
      ...prev,
      [tipo]: !prev[tipo],
    }));
  };

  const alterarCampo = (tipo, campo, valor) => {
    setCanais((prev) => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [campo]: valor,
      },
    }));
  };

  const alternarStatus = (tipo) => {
    setCanais((prev) => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        ativo: !prev[tipo].ativo,
        historico: [
          `Canal ${!prev[tipo].ativo ? "ativado" : "desativado"} em ${new Date().toLocaleDateString("pt-BR")}`,
          ...prev[tipo].historico,
        ],
      },
    }));
  };

  const salvarCanal = (tipo) => {
    alert(`Configurações de ${canais[tipo].titulo} salvas com sucesso!`);
  };

  const excluirCanal = (tipo) => {
    const confirmar = window.confirm(
      `Deseja realmente limpar as configurações de ${canais[tipo].titulo}?`
    );

    if (!confirmar) return;

    setCanais((prev) => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        ativo: false,
        configurado: false,
        remetente: "",
        destino: "",
        assunto: "",
        mensagem: "",
        historico: [
          `Configurações excluídas em ${new Date().toLocaleDateString("pt-BR")}`,
        ],
      },
    }));

    alert(`Configurações de ${canais[tipo].titulo} removidas com sucesso.`);
  };

  const testarCanal = (tipo) => {
    alert(`Teste simulado realizado no canal ${canais[tipo].titulo}.`);
  };

  const verHistorico = (tipo) => {
    alert(
      `Histórico de ${canais[tipo].titulo}:\n\n${canais[tipo].historico.join("\n")}`
    );
  };

  const enviar = (e) => {
    e.preventDefault();

    if (texto.trim() === "") {
      alert("Preencha o campo antes de enviar!");
      return;
    }

    alert("Mensagem enviada com sucesso!");
    setTexto("");
  };

  const descricoes = {
    email:
      "Configure o canal de e-mail para envio de comunicados, atualizações do sistema, cobranças e mensagens formais aos usuários da plataforma.",
    whatsapp:
      "Defina o canal de WhatsApp para mensagens rápidas, avisos operacionais, confirmações e comunicações diretas com maior agilidade.",
    sms:
      "Gerencie o envio de SMS para alertas curtos, mensagens objetivas e comunicações de alta prioridade para seus usuários.",
    telegram:
      "Organize o canal Telegram para futuras automações, integrações com bot e notificações complementares dentro da plataforma.",
  };

  const listaCanais = [
    {
      chave: "email",
      titulo: "E-mail",
      icone: icons.email,
    },
    {
      chave: "whatsapp",
      titulo: "WhatsApp",
      icone: icons.whatsapp || icons.chat || "bi bi-whatsapp",
    },
    {
      chave: "sms",
      titulo: "SMS",
      icone: icons.sms || icons.chat || "bi bi-chat-dots",
    },
    {
      chave: "telegram",
      titulo: "Telegram",
      icone: icons.telegram || icons.chat || "bi bi-telegram",
    },
  ];

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1>
          <i className={icons.notificacoes}></i> Notificações
        </h1>
      </section>

      {listaCanais.map((item) => {
        const canal = canais[item.chave];

        return (
          <section className="form-section notificacao-card" key={item.chave}>
            <div className="section-header">
              <span className="icon">
                <i className={item.icone}></i>
              </span>
              <h3>{item.titulo}</h3>
            </div>

            <hr className="divider" />

            <p className="texto-canal">{descricoes[item.chave]}</p>

            <div className="status-topo">
              <span className={`status-tag ${canal.ativo ? "ativo" : "inativo"}`}>
                {canal.ativo ? "Canal ativo" : "Canal inativo"}
              </span>

              <span
                className={`status-tag ${canal.configurado ? "configurado" : "pendente"}`}
              >
                {canal.configurado ? "Configurado" : "Pendente"}
              </span>
            </div>

            <div className="botao_geral notificacao-toggle-area">
              <button
                type="button"
                className="btn-toggle-notificacao"
                onClick={() => toggleSecao(item.chave)}
              >
                <i className={aberto[item.chave] ? "bi bi-chevron-up" : "bi bi-chevron-down"}></i>
                {aberto[item.chave] ? "Ocultar configurações" : "Abrir configurações"}
              </button>
            </div>

            {aberto[item.chave] && (
              <div className="notificacao-dropdown">
                <div className="form-row">
                  <div className="form-group">
                    <label>Identificação do canal</label>
                    <input
                      type="text"
                      value={canal.titulo}
                      onChange={(e) =>
                        alterarCampo(item.chave, "titulo", e.target.value)
                      }
                      placeholder="Nome do canal"
                    />
                  </div>

                  <div className="form-group">
                    <label>Remetente / origem</label>
                    <input
                      type="text"
                      value={canal.remetente}
                      onChange={(e) =>
                        alterarCampo(item.chave, "remetente", e.target.value)
                      }
                      placeholder="Origem do envio"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Destino padrão</label>
                    <input
                      type="text"
                      value={canal.destino}
                      onChange={(e) =>
                        alterarCampo(item.chave, "destino", e.target.value)
                      }
                      placeholder="Informe um destino padrão"
                    />
                  </div>

                  <div className="form-group">
                    <label>Assunto / título</label>
                    <input
                      type="text"
                      value={canal.assunto}
                      onChange={(e) =>
                        alterarCampo(item.chave, "assunto", e.target.value)
                      }
                      placeholder="Digite o assunto da notificação"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mensagem padrão</label>
                    <textarea
                      className="textarea-notificacao"
                      value={canal.mensagem}
                      onChange={(e) =>
                        alterarCampo(item.chave, "mensagem", e.target.value)
                      }
                      placeholder="Digite aqui a mensagem padrão do canal"
                    />
                  </div>
                </div>

                <div className="botao_geral notificacao-acoes">
                  <button
                    type="button"
                    className={canal.ativo ? "btn-status-desativar" : "btn-status-ativar"}
                    onClick={() => alternarStatus(item.chave)}
                  >
                    {canal.ativo ? "Desativar" : "Ativar"}
                  </button>

                  <button type="button" onClick={() => salvarCanal(item.chave)}>
                    Editar
                  </button>

                  <button
                    type="button"
                    className="btn-excluir-notificacao"
                    onClick={() => excluirCanal(item.chave)}
                  >
                    Excluir
                  </button>

                  <button type="button" onClick={() => testarCanal(item.chave)}>
                    Testar
                  </button>

                  <button type="button" onClick={() => verHistorico(item.chave)}>
                    Ver histórico
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}

      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.feedback}></i>
          </span>
          <h3>Fale Conosco</h3>
        </div>

        <hr className="divider" />

        <p className="texto-canal">
          Utilize este campo para enviar dúvidas, sugestões, solicitações ou relatar qualquer problema relacionado ao módulo de notificações.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>Digite aqui sua dúvida ou mensagem para o suporte</label>
            <textarea
              className="textarea-notificacao"
              placeholder="Comentários, dúvidas e reclamações."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>
        </div>

        <div className="botao_geral">
          <button className="btn" onClick={enviar}>
            Enviar
          </button>
        </div>
      </section>
    </main>
  );
}

export default Tela_1_notificacao;