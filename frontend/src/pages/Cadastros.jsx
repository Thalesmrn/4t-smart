import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, Badge, ErrorBox } from "../components/Common.jsx";

function Field({ label, children }) {
  return (
    <label className="block text-sm mb-3">
      <span className="text-xs text-slate-500 block mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full border rounded-lg px-3 py-2 text-sm";

export default function Cadastros() {
  const [empilhadeiras, setEmpilhadeiras] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [erro, setErro] = useState(null);

  // formulário empilhadeira
  const [nomeEmp, setNomeEmp] = useState("");
  const [operadorEmp, setOperadorEmp] = useState("");
  const [capacidadeEmp, setCapacidadeEmp] = useState("2500");
  const [salvandoEmp, setSalvandoEmp] = useState(false);
  const [sucessoEmp, setSucessoEmp] = useState(null);

  // formulário lote
  const [produtoLote, setProdutoLote] = useState("");
  const [qualidadeLote, setQualidadeLote] = useState("");
  const [proprietarioLote, setProprietarioLote] = useState("");
  const [sacasLote, setSacasLote] = useState("");
  const [salvandoLote, setSalvandoLote] = useState(false);
  const [sucessoLote, setSucessoLote] = useState(null);
  const [registrandoId, setRegistrandoId] = useState(null);

  async function carregar() {
    try {
      const [emps, lts] = await Promise.all([api.empilhadeiras(), api.lotes()]);
      setEmpilhadeiras(emps);
      setLotes(lts);
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function cadastrarEmpilhadeira(e) {
    e.preventDefault();
    setSalvandoEmp(true);
    setSucessoEmp(null);
    try {
      const nova = await api.criarEmpilhadeira({
        nome: nomeEmp,
        operador: operadorEmp,
        capacidadeKg: capacidadeEmp,
      });
      setSucessoEmp(`${nova.nome} cadastrada com sucesso (${nova.id}).`);
      setNomeEmp("");
      setOperadorEmp("");
      setCapacidadeEmp("2500");
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvandoEmp(false);
    }
  }

  async function cadastrarLote(e) {
    e.preventDefault();
    setSalvandoLote(true);
    setSucessoLote(null);
    try {
      const novo = await api.criarLote({
        produto: produtoLote,
        qualidade: qualidadeLote,
        proprietario: proprietarioLote,
        sacas: sacasLote,
      });
      setSucessoLote(`${novo.id} — ${novo.produto} cadastrado como "aguardando descarga".`);
      setProdutoLote("");
      setQualidadeLote("");
      setProprietarioLote("");
      setSacasLote("");
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvandoLote(false);
    }
  }

  async function registrarRecebimento(loteId) {
    setRegistrandoId(loteId);
    setSucessoLote(null);
    try {
      await api.registrarRecebimento(loteId);
      setSucessoLote(
        `Tarefa de recebimento criada para ${loteId} — vá em "Tarefas & Empilhadeiras" para atribuir e concluir.`
      );
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setRegistrandoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cadastros</h2>
        <p className="text-slate-500 text-sm mt-1">
          Adicione novas empilhadeiras à frota ou registre novos lotes de café.
        </p>
      </div>

      {erro && <ErrorBox message={erro} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nova empilhadeira */}
        <Card title="🚜 Nova Empilhadeira">
          <form onSubmit={cadastrarEmpilhadeira}>
            <Field label="Nome / identificação">
              <input
                required
                className={inputCls}
                placeholder="Ex: Empilhadeira 04 (Elétrica 3.0t)"
                value={nomeEmp}
                onChange={(e) => setNomeEmp(e.target.value)}
              />
            </Field>
            <Field label="Operador responsável">
              <input
                required
                className={inputCls}
                placeholder="Nome do operador"
                value={operadorEmp}
                onChange={(e) => setOperadorEmp(e.target.value)}
              />
            </Field>
            <Field label="Capacidade (kg)">
              <input
                type="number"
                min="1"
                className={inputCls}
                value={capacidadeEmp}
                onChange={(e) => setCapacidadeEmp(e.target.value)}
              />
            </Field>
            <p className="text-[11px] text-slate-400 mb-3">
              Entra na frota como <strong>disponível</strong>, posicionada na doca de recebimento.
            </p>
            <button
              type="submit"
              disabled={salvandoEmp}
              className="w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {salvandoEmp ? "Cadastrando..." : "+ Cadastrar empilhadeira"}
            </button>
            {sucessoEmp && (
              <p className="text-xs text-emerald-700 bg-emerald-50 rounded p-2 mt-3">{sucessoEmp}</p>
            )}
          </form>

          <div className="mt-5 pt-4 border-t">
            <p className="text-xs font-semibold text-slate-500 mb-2">Frota atual ({empilhadeiras.length})</p>
            <ul className="space-y-1.5 text-sm max-h-40 overflow-y-auto scrollbar-thin">
              {empilhadeiras.map((e) => (
                <li key={e.id} className="flex items-center justify-between border rounded-lg px-3 py-1.5">
                  <span>{e.nome}</span>
                  <Badge type={e.status}>{e.status.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Novo lote */}
        <Card title="☕ Novo Lote de Café">
          <form onSubmit={cadastrarLote}>
            <Field label="Produto">
              <input
                required
                className={inputCls}
                placeholder="Ex: Café Arábica Cereja Descascado"
                value={produtoLote}
                onChange={(e) => setProdutoLote(e.target.value)}
              />
            </Field>
            <Field label="Qualidade / classificação">
              <input
                className={inputCls}
                placeholder="Ex: Tipo 4, Bica Corrida"
                value={qualidadeLote}
                onChange={(e) => setQualidadeLote(e.target.value)}
              />
            </Field>
            <Field label="Proprietário">
              <input
                required
                className={inputCls}
                placeholder="Ex: Fazenda Santa Rita"
                value={proprietarioLote}
                onChange={(e) => setProprietarioLote(e.target.value)}
              />
            </Field>
            <Field label="Quantidade de sacas">
              <input
                type="number"
                min="1"
                className={inputCls}
                placeholder="Ex: 240"
                value={sacasLote}
                onChange={(e) => setSacasLote(e.target.value)}
              />
            </Field>
            <p className="text-[11px] text-slate-400 mb-3">
              Entra como <strong>aguardando descarga</strong> — ainda sem big bags/posições, até o
              recebimento físico ser registrado como tarefa.
            </p>
            <button
              type="submit"
              disabled={salvandoLote}
              className="w-full py-2 rounded-lg bg-coffee-600 text-white text-sm font-semibold hover:bg-coffee-700 disabled:opacity-50 transition-colors"
            >
              {salvandoLote ? "Cadastrando..." : "+ Cadastrar lote"}
            </button>
            {sucessoLote && (
              <p className="text-xs text-emerald-700 bg-emerald-50 rounded p-2 mt-3">{sucessoLote}</p>
            )}
          </form>

          <div className="mt-5 pt-4 border-t">
            <p className="text-xs font-semibold text-slate-500 mb-2">Lotes cadastrados ({lotes.length})</p>
            <ul className="space-y-1.5 text-sm max-h-52 overflow-y-auto scrollbar-thin">
              {lotes.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 border rounded-lg px-3 py-1.5">
                  <span className="truncate">
                    {l.id} — {l.produto}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge type={l.status === "aguardando_descarga" ? "atencao" : "ocupada"}>
                      {l.status.replace(/_/g, " ")}
                    </Badge>
                    {l.status === "aguardando_descarga" && (
                      <button
                        onClick={() => registrarRecebimento(l.id)}
                        disabled={registrandoId === l.id}
                        className="text-[11px] px-2 py-1 rounded bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
                      >
                        {registrandoId === l.id ? "..." : "Registrar recebimento"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
