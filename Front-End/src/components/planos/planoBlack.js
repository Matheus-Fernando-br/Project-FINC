// planoBlack.jsx
import PlanoPadrao from "./planoPadrao";

function PlanoBlack({ ativo, onClick }) {
  return (
    <PlanoPadrao
      id="plano-black"
      titulo="BLACK"
      preco="R$ 185,60"
      descricao="emissões ilimitadas"
      detalhes={[
        "Tudo do Premium +",
        "Emissões ilimitadas",
        "Armazenamento ampliado"
      ]}
      ativo={ativo}
      onClick={onClick}
    />
  );
}

export default PlanoBlack;
