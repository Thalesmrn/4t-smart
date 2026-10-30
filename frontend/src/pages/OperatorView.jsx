import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Badge, Card } from "../components/Common.jsx";

export default function OperatorView() {
  const [empilhadeiras, setEmpilhadeiras] = useState([]);
  const [empilhadeiraSel, setEmpilhadeiraSel] = useState("");
  const [tarefaAtual, setTarefaAtual] = useState(null);
  
  const [codigoLeitura, setCodigoLeitura] = useState("");
  const [validado, setValidado] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [carregandoTarefa, setCarregandoTarefa] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    carregarEmpilhadeiras();
  }, []);

  async function carregarEmpilhadeiras() {
    setCarregando(true);
    setErro(null);
    try {
      const listEmp = await api.empilhadeiras().catch(() => []);
      const emps = Array.isArray(listEmp) ? listEmp : [];
      setEmpilhadeiras(emps);

      if (emps.length > 0) {
        const idInicial = emps[0].id;
        setEmpilhadeiraSel(idInicial);
        buscarTarefaOperador(idInicial);
      }
    } catch (e) {
      setErro(e.message || "Erro ao carregar lista de empilhadeiras.");
    } finally {
      setCarregando(false);
    }
  }

  async function buscarTarefaOperador(empId) {
    if (!empId) return;
    setCarregandoTarefa(true);
    setMensagem(null);
    setValidado(false);
    setCodigoLeitura("");

    try {
      const res = await api.proximaTarefaOperador(empId);
      if (res && res.tarefa) {
        setTarefaAtual(res.tarefa);
      } else {
        setTarefaAtual(null);
      }
    } catch (err) {
      console.error(err);
      setTarefaAtual(null);
    } finally {
      setCarregandoTarefa(false);
    }
  }

  function handleTrocaEmpilhadeira(id) {
    setEmpilhadeiraSel(id);
    buscarTarefaOperador(id);
  }

  async function handleValidarCodigo(e) {
    e.preventDefault();
    if (!codigoLeitura.trim()) return;

    try {
      setMensagem(null);
      await api.lerCodigo(empilhadeiraSel, { codigoLote: codigoLeitura.trim() });
      setValidado(true);
      setMensagem({ tipo: "sucesso", texto: "✅ Código lido com sucesso! Posição/Lote confirmado." });
    } catch (err) {
      setMensagem({ tipo: "erro", texto: "❌ Falha ao ler código: " + err.message });
    }
  }

  async function handleConfirmarConclusao() {
    if (!tarefaAtual) return;
    try {
      setMensagem(null);
      await api.confirmarConclusao(empilhadeiraSel, tarefaAtual.id);
      setMensagem({ tipo: "sucesso", texto: "🎉 Movimentação finalizada pelo operador com sucesso!" });
      setTarefaAtual(null);
      setValidado(false);
      setCodigoLeitura("");

      // Atualiza após 2 segundos para checar se há mais tarefas
      setTimeout(() => {
        buscarTarefaOperador(empilhadeiraSel);
      }, 1500);
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message || "Erro ao concluir movimentação." });
    }
  }

  if (carregando) return <Loading label="A carregar Monitor do Operador..." />;
  if (erro) return <ErrorBox message={erro} onRetry={carregarEmpilhadeiras} />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* SELEÇÃO DO OPERADOR / EMPILHADEIRA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">📱 Monitor do Operador</h2>
          <p className="text-slate-500 text-xs mt-0.5">Interface simplificada para o coletor de dados/tablet da empilhadeira.</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase">Empilhadeira:</label>
          <select
            value={empilhadeiraSel}
            onChange={(e) => handleTrocaEmpilhadeira(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm font-bold bg-slate-50 text-slate-800 focus:bg-white"
          >
            {empilhadeiras.map((e, idx) => (
              <option key={e.id} value={e.id}>
                {e.nome || e.modelo || `EMP-0${idx + 1}`} ({e.operador || "Operador"})
              </option>
            ))}
          </select>
        </div>
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

      {/* EXIBIÇÃO DA TAREFA VINCULADA */}
      {carregandoTarefa ? (
        <Loading label="Buscando atribuição para a empilhadeira..." />
      ) : tarefaAtual ? (
        <div className="space-y-6">
          <Card title="🚜 Movimentação Solicitada">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-2xl font-extrabold text-slate-900">{tarefaAtual.loteCodigo}</span>
                  <p className="text-xs text-slate-500">{tarefaAtual.produto}</p>
                </div>
                <Badge type={tarefaAtual.tipo}>{tarefaAtual.tipo}</Badge>
              </div>

              {/* ROTA DE MOVIMENTAÇÃO */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">1. Origem (Retirar de)</p>
                  <p className="text-base font-extrabold text-slate-800 mt-1">📍 {tarefaAtual.origem}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">2. Destino (Levar para)</p>
                  <p className="text-base font-extrabold text-emerald-700 mt-1">🎯 {tarefaAtual.destino}</p>
                </div>
              </div>

              {/* VALIDAÇÃO DE CÓDIGO/QR CODE */}
              <form onSubmit={handleValidarCodigo} className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase">
                  Bipar / Confirmar Código da Sacaria ou Posição
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cole ou bipe o código aqui..."
                    value={codigoLeitura}
                    onChange={(e) => setCodigoLeitura(e.target.value)}
                    className="flex-1 border rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-colors"
                  >
                    Bipar / Validar
                  </button>
                </div>
              </form>

              {/* BOTÃO DE CONFIRMAR CONCLUSÃO */}
              <div className="pt-4 border-t">
                <button
                  type="button"
                  onClick={handleConfirmarConclusao}
                  className="w-full py-4 bg-emerald-700 text-white font-black text-base rounded-xl hover:bg-emerald-800 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <span>✓</span> CONFIRMAR CONCLUSÃO DA MOVIMENTAÇÃO
                </button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
          <p className="text-3xl">☕</p>
          <h3 className="text-lg font-bold text-slate-800">Nenhuma tarefa no momento!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Esta empilhadeira está livre. Assim que uma nova Ordem de Movimentação for criada para ela na tela de Tarefas, ela aparecerá aqui automaticamente.
          </p>
          <button
            type="button"
            onClick={() => buscarTarefaOperador(empilhadeiraSel)}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors mt-2"
          >
            🔄 Atualizar busca
          </button>
        </div>
      )}
    </div>
  );
}
