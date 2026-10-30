import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Badge, Card } from "../components/Common.jsx";

export default function Cadastros() {
  const [empilhadeiras, setEmpilhadeiras] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  // Form Empilhadeira
  const [nomeEmp, setNomeEmp] = useState("");
  const [operadorEmp, setOperadorEmp] = useState("");
  const [capacidadeEmp, setCapacidadeEmp] = useState("");

  // Form Lote
  const [produtoLote, setProdutoLote] = useState("");
  const [qualidadeLote, setQualidadeLote] = useState("");
  const [proprietarioLote, setProprietarioLote] = useState("");
  const [sacasLote, setSacasLote] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);
    try {
      const [listEmp, listLotes] = await Promise.all([
        api.empilhadeiras().catch(() => []),
        api.lotes().catch(() => [])
      ]);
      setEmpilhadeiras(Array.isArray(listEmp) ? listEmp : []);
      setLotes(Array.isArray(listLotes) ? listLotes : []);
    } catch (e) {
      setErro(e.message || "Erro ao carregar dados.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleCriarEmpilhadeira(e) {
    e.preventDefault();
    if (!nomeEmp.trim()) return;
    try {
      setMensagem(null);
      await api.criarEmpilhadeira({
        nome: nomeEmp.trim(),
        modelo: nomeEmp.trim(),
        operador: operadorEmp.trim() || "Operador Responsável",
        capacidadeKg: parseInt(capacidadeEmp, 10) || 2500,
        capacidade: parseInt(capacidadeEmp, 10) || 2500
      });
      
      setNomeEmp("");
      setOperadorEmp("");
      setCapacidadeEmp("");
      setMensagem({ tipo: "sucesso", texto: "Empilhadeira cadastrada com sucesso!" });
      await carregarDados();
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message || "Erro ao cadastrar empilhadeira." });
    }
  }

  async function handleDeletarEmpilhadeira(id) {
    if (!id) return;
    if (!window.confirm("Tem certeza que deseja excluir esta empilhadeira?")) return;
    try {
      setMensagem(null);
      await api.deletarEmpilhadeira(id);
      setMensagem({ tipo: "sucesso", texto: "Empilhadeira excluída com sucesso!" });
      setEmpilhadeiras((prev) => prev.filter((e) => String(e.id) !== String(id)));
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message || "Erro ao excluir empilhadeira." });
      await carregarDados();
    }
  }

  async function handleCriarLote(e) {
    e.preventDefault();
    if (!produtoLote.trim()) {
      setMensagem({ tipo: "erro", texto: "Por favor, informe o nome do produto." });
      return;
    }

    try {
      setMensagem(null);
      const payload = {
        produto: produtoLote.trim(),
        qualidade: qualidadeLote.trim() || "Tipo 2",
        proprietario: proprietarioLote.trim() || "Fazenda União",
        quantidadeSacas: parseInt(sacasLote, 10) || 1000,
        quantidade: parseInt(sacasLote, 10) || 1000
      };

      await api.criarLote(payload);

      setProdutoLote("");
      setQualidadeLote("");
      setProprietarioLote("");
      setSacasLote("");

      setMensagem({ tipo: "sucesso", texto: "Lote de café cadastrado com sucesso!" });
      await carregarDados();
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message || "Erro ao cadastrar lote de café." });
    }
  }

  async function handleDeletarLote(id) {
    if (!id) return;
    if (!window.confirm("Tem certeza que deseja excluir este lote?")) return;
    try {
      setMensagem(null);
      await api.deletarLote(id);
      setMensagem({ tipo: "sucesso", texto: "Lote excluído com sucesso!" });
      setLotes((prev) => prev.filter((l) => String(l.id) !== String(id)));
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message || "Erro ao excluir lote." });
      await carregarDados();
    }
  }

  // Função helper para obter um nome limpo para a empilhadeira
  function obterNomeEmpilhadeira(e, index) {
    if (e.nome && !e.nome.includes("-") && e.nome.length < 20) return e.nome;
    if (e.modelo && !e.modelo.includes("-") && e.modelo.length < 20) return e.modelo;
    return `EMP-0${index + 1}`;
  }

  if (carregando) return <Loading label="A carregar cadastros..." />;
  if (erro) return <ErrorBox message={erro} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cadastros do Armazém</h2>
        <p className="text-slate-500 text-sm mt-1">
          Registo e remoção de lotes de café e empilhadeiras da frota.
        </p>
      </div>

      {mensagem && (
        <div
          className={`p-4 rounded-xl text-sm font-medium transition-all ${
            mensagem.tipo === "sucesso"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FORMULÁRIO E LISTA DE EMPILHADEIRAS */}
        <Card title="🚜 Nova Empilhadeira">
          <form onSubmit={handleCriarEmpilhadeira} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Nome / Identificação
              </label>
              <input
                type="text"
                placeholder="Ex: EMP-05 (Elétrica 3.0t)"
                value={nomeEmp}
                onChange={(e) => setNomeEmp(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Operador responsável
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos Silva"
                value={operadorEmp}
                onChange={(e) => setOperadorEmp(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Capacidade (kg)
              </label>
              <input
                type="number"
                placeholder="Ex: 2500"
                value={capacidadeEmp}
                onChange={(e) => setCapacidadeEmp(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-colors"
            >
              + Cadastrar empilhadeira
            </button>
          </form>

          <div className="mt-6 border-t pt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500">Frota atual ({empilhadeiras.length})</p>
            {empilhadeiras.map((e, index) => (
              <div key={e.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <span className="font-medium text-slate-700 truncate">
                    {obterNomeEmpilhadeira(e, index)}
                  </span>
                  <Badge type={e.status || "DISPONIVEL"}>{e.status || "DISPONIVEL"}</Badge>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletarEmpilhadeira(e.id)}
                  className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shrink-0"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* FORMULÁRIO E LISTA DE LOTES DE CAFÉ */}
        <Card title="☕ Novo Lote de Café">
          <form onSubmit={handleCriarLote} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Produto
              </label>
              <input
                type="text"
                placeholder="Ex: Café Arábica Especial"
                value={produtoLote}
                onChange={(e) => setProdutoLote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Qualidade / Classificação
              </label>
              <input
                type="text"
                placeholder="Ex: Tipo 2 / Bebida Mole"
                value={qualidadeLote}
                onChange={(e) => setQualidadeLote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Proprietário
              </label>
              <input
                type="text"
                placeholder="Ex: Fazenda União"
                value={proprietarioLote}
                onChange={(e) => setProprietarioLote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Quantidade de sacas
              </label>
              <input
                type="number"
                placeholder="Ex: 1000"
                value={sacasLote}
                onChange={(e) => setSacasLote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-amber-800 text-white font-bold text-sm hover:bg-amber-900 transition-colors"
            >
              + Cadastrar lote
            </button>
          </form>

          <div className="mt-6 border-t pt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500">Lotes cadastrados ({lotes.length})</p>
            {lotes.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Nenhum lote cadastrado.</p>
            ) : (
              lotes.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <span className="font-medium text-slate-700 truncate">
                      {l.codigo || l.id} — {l.produto || "Café Comum"}
                    </span>
                    <Badge type={l.status || "AGUARDANDO_DESCARGA"}>
                      {l.status || "AGUARDANDO_DESCARGA"}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletarLote(l.id)}
                    className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shrink-0"
                  >
                    Excluir
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
