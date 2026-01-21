import {useNavigate } from "react-router-dom";
import "../../../styles/telaInicial.css";

function Termos() {
      const navigate = useNavigate();
      
  return (
    <div className="termos-container">
      <div className="Fundo">
        <img src="/Images/Tela-preta.jpg" alt="Fundo" />
      </div>

      <div className="Voltar">
            <button
            className="btn-geral"
            onClick={() =>
                navigate("/TelaInicial/Login/Cadastro", {
                state: { direction: "left" }
                })
            }
            >
            Voltar
            </button>
      </div>

      <h1>Termos e Condições de Uso – FINC</h1>

      <p className="intro">
        Antes de realizar seu cadastro na plataforma FINC, o usuário deve ler
        atentamente os Termos e Condições descritos abaixo. Ao prosseguir com o
        cadastro, o usuário declara que compreende e concorda integralmente com
        todas as regras, responsabilidades e permissões aqui estabelecidas.
      </p>

      <h2>1. Aceitação dos Termos</h2>
      <p>
        O uso da plataforma FINC está condicionado à aceitação total destes
        Termos e Condições. Caso o usuário não concorde com qualquer item, o
        cadastro não deverá ser concluído.
      </p>

      <h2>2. Finalidade da Plataforma</h2>
      <p>
        A FINC é uma plataforma digital desenvolvida para facilitar a emissão de
        notas fiscais eletrônicas e a gestão fiscal básica de
        microempreendedores individuais (MEIs), prestadores de serviços e
        pequenos negócios, por meio de processos automatizados e simplificados.
      </p>

      <h2>3. Tipos de Usuário e Permissões</h2>
      <p>
        De acordo com o perfil cadastrado, o usuário poderá ter diferentes níveis
        de acesso dentro da plataforma:
      </p>

      <ul>
        <li>
          <strong>Empresa:</strong> pode cadastrar clientes, emitir notas
          fiscais, visualizar dados financeiros e criar usuários do tipo
          Contador.
        </li>
        <li>
          <strong>Contador:</strong> usuário vinculado à Empresa, com acesso à
          visualização de informações financeiras e relatórios.
        </li>
        <li>
          <strong>Administrador:</strong> responsável pela administração geral
          da plataforma, incluindo usuários, planos e manutenção do sistema.
        </li>
      </ul>

      <h2>4. Responsabilidade pelas Informações</h2>
      <p>
        O usuário é o único responsável pela veracidade, legalidade e atualização
        de todas as informações fornecidas durante o cadastro e utilização da
        plataforma, incluindo dados pessoais, empresariais e fiscais.
      </p>

      <h2>5. Emissão de Notas Fiscais</h2>
      <p>
        A FINC atua exclusivamente como uma ferramenta tecnológica de apoio à
        emissão de notas fiscais. Toda responsabilidade legal, fiscal e
        tributária relacionada às notas emitidas é de responsabilidade do
        usuário emissor.
      </p>

      <h2>6. Permissões e Autorizações</h2>
      <p>
        Ao aceitar estes Termos, o usuário autoriza a FINC a realizar as ações
        necessárias para o funcionamento da plataforma, incluindo:
      </p>

      <ul>
        <li>Armazenamento e processamento de dados;</li>
        <li>Utilização de informações fiscais para emissão de notas;</li>
        <li>Compartilhamento de dados com usuários autorizados, como contadores;</li>
        <li>Integrações técnicas essenciais para a operação do sistema.</li>
      </ul>

      <h2>7. Uso Indevido da Plataforma</h2>
      <p>
        É proibido utilizar a plataforma para fins ilegais, fraudes fiscais,
        fornecimento de informações falsas ou qualquer atividade que viole a
        legislação vigente. O descumprimento poderá resultar na suspensão ou
        exclusão da conta.
      </p>

      <h2>8. Segurança e Proteção de Dados</h2>
      <p>
        A FINC adota medidas técnicas e organizacionais para proteger os dados
        dos usuários, em conformidade com a Lei Geral de Proteção de Dados
        (LGPD).
      </p>

      <h2>9. Disponibilidade do Sistema</h2>
      <p>
        A plataforma poderá passar por manutenções e atualizações periódicas,
        podendo ficar temporariamente indisponível, sem que isso gere direito a
        indenizações.
      </p>

      <h2>10. Alterações dos Termos</h2>
      <p>
        Estes Termos e Condições podem ser alterados a qualquer momento. O uso
        contínuo da plataforma após eventuais alterações implica na aceitação
        automática das novas condições.
      </p>

      <h2>11. Declaração Final</h2>
      <p className="final">
        Ao marcar a opção de aceite e concluir o cadastro, o usuário declara que
        leu, compreendeu e concorda integralmente com estes Termos e Condições de
        Uso da plataforma FINC.
      </p>
    </div>
  );
}

export default Termos;
