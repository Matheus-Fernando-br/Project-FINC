// Back-End/ImportSheet/importConfig.js
const validators = {
  required: v => v !== undefined && v !== null && String(v).trim() !== "",
  isEmail: v => /\S+@\S+\.\S+/.test(String(v)),
  isNumber: v => !isNaN(Number(String(v).replace(",", "."))),
};

const configs = {
  clientes: {
    headers: [
      "nome_social","tipo_pessoa","cpf","cnpj","cep","uf","cidade","logradouro",
      "bairro","numero","complemento","email","telefone","whatsapp","observacoes"
    ],
    required: {
      nome_social: true,
      tipo_pessoa: true,
      cep: true,
      uf: true,
      cidade: true,
      logradouro: true,
      bairro: true,
      numero: true,
      email: validators.isEmail,
      telefone: true,
    },
    conditional: [
      { when: r => r.tipo_pessoa === "PFisica", field: "cpf", test: validators.required },
      { when: r => r.tipo_pessoa === "PJuridica", field: "cnpj", test: validators.required }
    ]
  },

  produtos: {
    headers: [
      "nome","marca_fabricante","categoria","tipo_nota","descricao","sku",
      "unidade_medida","preco_unitario","ncm","cfop","cst_csosn_icms","cst_ipi",
      "ecst_pis_cofins","aliquotas_impostos","origem_produto"
    ],
    required: {
      nome: true,
      categoria: true,
      tipo_nota: true,
      sku: true,
      unidade_medida: true,
      preco_unitario: validators.isNumber,
      ncm: true,
      cfop: true,
      cst_csosn_icms: true,
      ecst_pis_cofins: true,
      aliquotas_impostos: true,
      origem_produto: true,
    }
  },

  servicos: {
    headers: [
      "nome_servico","tipo_nota","categoria","codigo_interno","descricao_detalhada",
      "preco","unidade_medida","cnae","codigo_servico","item_lista_servicos",
      "aliquota_iss","cst_pis_cofins","regime_especial_tributacao"
    ],
    required: {
      nome_servico: true,
      categoria: true,
      preco: validators.isNumber,
      unidade_medida: true,
      cnae: true,
      codigo_servico: true,
      item_lista_servicos: true,
      aliquota_iss: validators.isNumber,
      cst_pis_cofins: true
    }
  }
};

module.exports = { configs, validators };
