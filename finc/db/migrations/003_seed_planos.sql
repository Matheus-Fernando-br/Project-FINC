-- Planos BÁSICO e BLACK (herdados da FINC original).
-- Os valores e limites originais ficavam apenas no banco Supabase (não versionado);
-- os números abaixo são o padrão da FINC 2.0 e podem ser ajustados via SQL.
-- Limite NULL = ilimitado.

INSERT INTO planos (codigo, nome, valor, limite_clientes, limite_produtos, limite_servicos, limite_contadores, limite_notas_mes, detalhes, ordem)
VALUES
  ('basico', 'BÁSICO', 29.90, 100, 100, 50, 1, 30,
   '["Até 30 documentos fiscais por mês", "Até 100 clientes", "Até 100 produtos e 50 serviços", "1 contador vinculado", "Financeiro (contas a pagar e receber)", "Suporte por chamados"]'::jsonb, 1),
  ('black', 'BLACK', 79.90, NULL, NULL, NULL, 5, NULL,
   '["Documentos fiscais ilimitados", "Clientes, produtos e serviços ilimitados", "Até 5 contadores vinculados", "Todos os recursos do BÁSICO, sem limites de cadastro"]'::jsonb, 2)
ON CONFLICT (codigo) DO NOTHING;
