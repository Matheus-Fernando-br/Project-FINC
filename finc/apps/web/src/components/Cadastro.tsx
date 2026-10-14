import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ZodTypeAny } from "zod";
import { api, qs } from "../api/client";
import type { Pagina, Registro } from "../api/types";
import { useApi } from "../hooks/useApi";
import { useForm } from "../hooks/useForm";
import {
  Alert,
  Button,
  Card,
  Empty,
  ErrorBox,
  Field,
  Loading,
  PageHeader,
  Pagination,
  useConfirm,
  useToast,
} from "./ui";

export interface Campo {
  name: string;
  label: string;
  tipo?: "text" | "email" | "tel" | "number" | "select" | "textarea" | "checkbox" | "date";
  opcoes?: readonly (string | { value: string; label: string })[];
  required?: boolean;
  col?: "c3" | "c4" | "c6" | "c8" | "c9";
  hint?: string;
  placeholder?: string;
  prefixo?: string;
  step?: string;
  mostrarSe?: (v: Record<string, unknown>) => boolean;
  /** Ao sair do campo CEP, consulta o endereço no servidor. */
  cep?: boolean;
  somenteCriacao?: boolean;
}

export interface Secao {
  titulo: string;
  icon?: string;
  campos: Campo[];
}

function CampoInput({
  c,
  f,
}: {
  c: Campo;
  f: ReturnType<typeof useForm<Record<string, unknown>>>;
}) {
  const b = f.bind(c.name);
  if (c.tipo === "checkbox") {
    return (
      <label className={`check ${c.col ?? ""}`} style={{ alignSelf: "end", paddingBottom: 8 }}>
        <input
          type="checkbox"
          id={c.name}
          checked={Boolean(f.values[c.name])}
          onChange={(e) => f.set(c.name, e.target.checked)}
        />{" "}
        {c.label}
      </label>
    );
  }
  let control: ReactNode;
  if (c.tipo === "select") {
    control = (
      <select {...b}>
        <option value="">Selecione</option>
        {c.opcoes?.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          return (
            <option key={v} value={v}>
              {typeof o === "string" ? o : o.label}
            </option>
          );
        })}
      </select>
    );
  } else if (c.tipo === "textarea") control = <textarea {...b} placeholder={c.placeholder} />;
  else
    control = (
      <input
        {...b}
        type={c.tipo ?? "text"}
        step={c.step}
        placeholder={c.placeholder ?? (c.prefixo ? c.prefixo : undefined)}
        inputMode={c.tipo === "number" ? "decimal" : undefined}
      />
    );
  return (
    <Field
      label={c.label}
      required={c.required}
      error={f.errors[c.name]}
      hint={c.hint}
      className={c.col}
      htmlFor={c.name}
    >
      {control}
    </Field>
  );
}

export function CadastroForm({
  titulo,
  icon,
  endpoint,
  voltar,
  secoes,
  inicial,
  schema,
  saida,
  aviso,
}: {
  titulo: string;
  icon: string;
  endpoint: string;
  voltar: string;
  secoes: Secao[];
  inicial: Record<string, unknown>;
  schema?: ZodTypeAny;
  saida?: (v: Record<string, unknown>) => Record<string, unknown>;
  aviso?: ReactNode;
}) {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const f = useForm<Record<string, unknown>>(inicial);
  const [carregando, setCarregando] = useState(editando);
  const [erroCarga, setErroCarga] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<Registro>(`${endpoint}/${id}`)
      .then((r) => {
        const v: Record<string, unknown> = { ...inicial };
        for (const k of Object.keys(inicial)) if (r[k] !== undefined && r[k] !== null) v[k] = r[k];
        f.setValues(v);
      })
      .catch(setErroCarga)
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, endpoint]);

  const buscarCep = async (cep: string) => {
    const d = cep.replace(/\D/g, "");
    if (d.length !== 8) return;
    try {
      const r = await api.get<Record<string, string>>(`/util/cep/${d}`);
      f.setValues((v) => ({
        ...v,
        uf: r.uf ?? v.uf,
        cidade: r.cidade || v.cidade,
        logradouro: r.logradouro || v.logradouro,
        bairro: r.bairro || v.bairro,
      }));
    } catch (e) {
      toast.erro(e);
    }
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    const body = saida ? saida(f.values) : f.values;
    if (schema) {
      const r = schema.safeParse(body);
      if (!r.success) {
        const errs: Record<string, string> = {};
        for (const i of r.error.issues) {
          const k = String(i.path[0] ?? "");
          if (k && !errs[k]) errs[k] = i.message;
        }
        f.setErrors(errs);
        f.setErroGeral("Verifique os campos destacados.");
        return;
      }
    }
    void f.enviar(async () => {
      if (editando) await api.put(`${endpoint}/${id}`, body);
      else await api.post(endpoint, body);
      toast.sucesso(editando ? "Alterações salvas." : "Cadastro realizado.");
      navigate(voltar);
    });
  };

  if (carregando) return <Loading />;
  if (erroCarga) return <ErrorBox error={erroCarga} />;

  return (
    <form onSubmit={salvar} noValidate>
      <PageHeader
        title={`${editando ? "Editar" : "Novo"} ${titulo}`}
        icon={icon}
        actions={
          <Link to={voltar} className="btn secondary">
            <i className="bi bi-arrow-left" /> Voltar
          </Link>
        }
      />
      {aviso}
      {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
      {secoes.map((s) => (
        <Card key={s.titulo} title={s.titulo} icon={s.icon} className="mt">
          <div className="form-grid">
            {s.campos
              .filter(
                (c) => (!c.mostrarSe || c.mostrarSe(f.values)) && !(c.somenteCriacao && editando),
              )
              .map((c) =>
                c.cep ? (
                  <div
                    key={c.name}
                    className={c.col}
                    onBlur={() => buscarCep(String(f.values[c.name] ?? ""))}
                  >
                    <CampoInput
                      c={{
                        ...c,
                        col: undefined,
                        hint: c.hint ?? "Preenche o endereço automaticamente.",
                      }}
                      f={f}
                    />
                  </div>
                ) : (
                  <CampoInput key={c.name} c={c} f={f} />
                ),
              )}
          </div>
        </Card>
      ))}
      <div className="form-actions">
        <Link to={voltar} className="btn secondary">
          Cancelar
        </Link>
        <Button type="submit" loading={f.enviando} icon="bi-check-lg">
          {editando ? "Salvar alterações" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}

export interface Coluna<T> {
  titulo: string;
  render: (r: T) => ReactNode;
  className?: string;
}

export function CadastroLista<T extends Registro>({
  titulo,
  icon,
  endpoint,
  rotaBase,
  colunas,
  entidadeImportacao,
  filtrosExtra,
  vazio,
  sub,
  acoesExtra,
}: {
  titulo: string;
  icon: string;
  endpoint: string;
  rotaBase: string;
  colunas: Coluna<T>[];
  entidadeImportacao?: string;
  filtrosExtra?: Record<string, string>;
  vazio: string;
  sub?: ReactNode;
  acoesExtra?: (r: T, recarregar: () => void) => ReactNode;
}) {
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmar, dialog } = useConfirm();
  const { data, error, loading, reload } = useApi(
    () => api.get<Pagina<T>>(`${endpoint}${qs({ q: termo, page, pageSize: 20, ...filtrosExtra })}`),
    [termo, page, JSON.stringify(filtrosExtra)],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setTermo(busca);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  const excluir = async (r: T) => {
    if (
      !(await confirmar(
        `Excluir ${titulo.toLowerCase()}`,
        "Esta ação não pode ser desfeita. Deseja continuar?",
      ))
    )
      return;
    try {
      await api.del(`${endpoint}/${r.id}`);
      toast.sucesso("Registro excluído.");
      void reload();
    } catch (e) {
      toast.erro(e);
    }
  };

  return (
    <>
      <PageHeader
        title={titulo}
        icon={icon}
        sub={sub}
        actions={
          <>
            <Button
              variant="secondary"
              icon="bi-download"
              onClick={() =>
                api
                  .download(
                    `${endpoint}/exportar.csv${qs({ q: termo, ...filtrosExtra })}`,
                    "exportacao.csv",
                  )
                  .catch(toast.erro)
              }
            >
              Exportar CSV
            </Button>
            {entidadeImportacao && (
              <Link to={`/importar/${entidadeImportacao}`} className="btn secondary">
                <i className="bi bi-upload" /> Importar planilha
              </Link>
            )}
            <Link to={`${rotaBase}/novo`} className="btn">
              <i className="bi bi-plus-lg" /> Novo
            </Link>
          </>
        }
      />
      <div className="toolbar">
        <div className="search">
          <i className="bi bi-search" aria-hidden />
          <input
            className="input"
            placeholder="Buscar..."
            aria-label={`Buscar ${titulo.toLowerCase()}`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : data && data.items.length === 0 ? (
        <Card>
          <Empty>{termo ? "Nenhum resultado para a busca." : vazio}</Empty>
        </Card>
      ) : data ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {colunas.map((c) => (
                    <th key={c.titulo} className={c.className}>
                      {c.titulo}
                    </th>
                  ))}
                  <th className="acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr
                    key={r.id}
                    className="clickable"
                    onClick={() => navigate(`${rotaBase}/${r.id}`)}
                  >
                    {colunas.map((c) => (
                      <td key={c.titulo} className={c.className}>
                        {c.render(r)}
                      </td>
                    ))}
                    <td className="acoes" onClick={(e) => e.stopPropagation()}>
                      {acoesExtra?.(r, reload)}
                      <Link to={`${rotaBase}/${r.id}`} className="btn ghost sm" aria-label="Editar">
                        <i className="bi bi-pencil" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="bi-trash"
                        aria-label="Excluir"
                        onClick={() => excluir(r)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPage={setPage}
          />
        </>
      ) : null}
      {dialog}
    </>
  );
}
