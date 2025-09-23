// planoBasico.jsx
import PlanoPadrao from "./planoPadrao";

function PlanoBasico({ ativo, onClick }) {
  return (
    <PlanoPadrao
      id="plano-basico"
      titulo="BÁSICO"
      preco="R$ 19,90"
      descricao="até 80 notas/boletos mensais"
      detalhes={[
        "Emissão MANUAL agilizada de notas e boletos",
        "Auxílio da IA para preenchimento",
        "Cobrança extra de R$1,50 por nota adicional",
        "300MB de armazenamento"
      ]}
      ativo={ativo}
      onClick={onClick}
    />
  );
}

export default PlanoBasico;
