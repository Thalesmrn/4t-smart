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
  const [capacidadeEmp, setCapacidadeEmp] = useState("2500");

  // Form Lote
  const [produtoLote, setProdutoLote] = useState("Café comum");
  const [qualidadeLote, setQualidadeLote] = useState("Tipo 2");
  const [proprietarioLote, setProprietarioLote] = useState("Fazenda União");
  const [sacasLote, setSacasLote] = useState("1000");

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
      const nova = await api.criarEmpilhadeira({
        nome: nomeEmp,
        operador: operadorEmp || "Operador Responsável",
        capacidadeKg: parseInt(capacidadeEmp, 10) || 2500
      });
      setEmpilhadeiras((prev) => [...prev, nova]);
      setNomeEmp("");
      setOperadorEmp("");
      setMensagem({ tipo: "sucesso", texto: "Empilhadeira cadastrada com sucesso!" });
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message || "Erro ao cadastrar empilhadeira." });
    }
  }

  async function handleCriarLote(e) {
    e.preventDefault();
    try {
      setMensagem(null);
      const payload = {
        produto: produtoLote || "Café comum",
        qualidade: qualidadeLote || "Tipo 2",
        proprietario: proprietarioLote || "Fazenda União",
        quantidadeSacas: parseInt(sacasLote, 10) || 1000
      };

      const novoLote = await api.criarLote(payload);

      // Adiciona o novo lote retornado diretamente na lista do estado do React
      if (novoLote) {
        setLotes((prev) => [novoLote, ...prev]);
      } else {
        await carregarDados();
      }

      // Limpa os campos do formulário
      setProdutoLote("Café comum");
      setQualidadeLote("Tipo 2");
      setProprietarioLote("Fazenda União");
      setSacasLote("1000");

      setMensagem({ tipo: "sucesso", texto: "Lote de café cadastrado com sucesso!" });
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message || "Erro ao cadastrar lote de café." });
    }
  }

  if (carregando) return <Loading label="A carregar cadastros..." />;
  if (erro) return <ErrorBox message={erro} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cadastros do Armazém</h2>
        <p className="text-slate-500 text-sm mt-1">
          Registo de novos lotes de café e empilhadeiras da frota.
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
        {/* FORMULÁRIO EMPILHADEIRA */}
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
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Operador responsável
              </label>
              <input
                type="text"
                placeholder="Nome do operador"
                value={operadorEmp}
                onChange={(e) => setOperadorEmp(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Capacidade (kg)
              </label>
              <input
                type="number"
                value={capacidadeEmp}
                onChange={(e) => setCapacidadeEmp(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50"
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
            {empilhadeiras.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm">
                <span className="font-medium text-slate-700">{e.nome || e.id}</span>
                <Badge type={e.status || "DISPONIVEL"}>{e.status || "DISPONIVEL"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* FORMULÁRIO LOTE DE CAFÉ */}
        <Card title="☕ Novo Lote de Café">
          <form onSubmit={handleCriarLote} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Produto
              </label>
              <input
                type="text"
                value={produtoLote}
                onChange={(e) => setProdutoLote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Qualidade / Classificação
              </label>
              <input
                type="text"
                value={qualidadeLote}
                onChange={(e) => setQualidadeLote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Proprietário
              </label>
              <input
                type="text"
                value={proprietarioLote}
                onChange={(e) => setProprietarioLote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Quantidade de sacas
              </label>
              <input
                type="number"
                value={sacasLote}
                onChange={(e) => setSacasLote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50"
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
            {lotes.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm">
                <span className="font-medium text-slate-700">
                  {l.codigo || l.id} — {l.produto}
                </span>
                <Badge type={l.status || "DISPONIVEL"}>{l.status || "DISPONIVEL"}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
