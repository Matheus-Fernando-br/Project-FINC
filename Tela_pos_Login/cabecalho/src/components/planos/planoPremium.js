// planoPremium.jsx
import PlanoPadrao from "./planoPadrao";

function PlanoPremium({ ativo, onClick }) {
  return (
    <PlanoPadrao
      id="plano-premium"
      titulo="PREMIUM"
      preco="R$ 45,50"
      descricao="até 1.500 notas/boletos mensais"
      detalhes={[
        "Tudo do Básico +",
        "Maior limite de emissão",
        "Mais espaço de armazenamento"
      ]}
      ativo={ativo}
      onClick={onClick}
    />
  );
}

export default PlanoPremium;
