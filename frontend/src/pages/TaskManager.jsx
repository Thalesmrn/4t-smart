import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Badge, Card } from "../components/Common.jsx";

export default function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [empilhadeiras, setEmpilhadeiras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);
    try {
      const [listTarefas, listEmp] = await Promise.all([
        api.tarefas().catch(() => []),
        api.empilhadeiras().catch(() => [])
      ]);
      
      // Garante rigorosamente que sejam Arrays para evitar erro de .length
      setTarefas(Array.isArray(listTarefas) ? listTarefas : []);
      setEmpilhadeiras(Array.isArray(listEmp) ? listEmp : []);
    } catch (e) {
      setErro(e.message || "Erro ao carregar dados.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleAtribuirAutomatico() {
    try {
      setMensagem(null);
      const res = await api.atribuirAutomatico();

      if (res && Array.isArray(res.tarefas)) {
        setTarefas(res.tarefas);
      } else {
        await carregarDados();
      }

      setMensagem({
        tipo: res?.sucesso ? "sucesso" : "alerta",
        texto: res?.mensagem || "Processamento de atribuição concluído."
      });
    } catch (e) {
      setMensagem({
        tipo: "erro",
        texto: e.message || "Erro ao tentar atribuir tarefas automaticamente."
      });
    }
  }

  if (carregando) return <Loading label="A carregar tarefas e empilhadeiras..." />;
  if (erro) return <ErrorBox message={erro} />;

  // Defesa contra undefined para garantir que o .length nunca falhe
  const listaTarefas = Array.isArray(tarefas) ? tarefas : [];
  const listaEmpilhadeiras = Array.isArray(empilhadeiras) ? empilhadeiras : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tarefas & Empilhadeiras</h2>
          <p className="text-slate-500 text-sm mt-1">
            Gestão de ordens de movimentação e alocação da frota.
          </p>
        </div>
        <button
          onClick={handleAtribuirAutomatico}
          className="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm"
        >
          ⚡ Atribuir automaticamente
        </button>
      </div>

      {/* Caixa de Mensagem / Aviso */}
      {mensagem && (
        <div
          className={`p-4 rounded-xl text-sm font-medium transition-all ${
            mensagem.tipo === "sucesso"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : mensagem.tipo === "alerta"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <Card title="Tarefas Registradas">
        {listaTarefas.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            Nenhuma tarefa cadastrada no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {listaTarefas.map((t) => (
              <div
                key={t.id || Math.random()}
                className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50 flex-wrap gap-3"
              >
                <div>
                  <p className="font-semibold text-sm text-slate-800">{t.descricao || "Tarefa sem descrição"}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Origem: <span className="font-medium text-slate-600">{t.origem || "Doca"}</span> · 
                    Destino: <span className="font-medium text-slate-600">{t.destino || "A definir"}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge type={t.status || "PENDENTE"}>
                    {(t.status || "PENDENTE").replace("_", " ")}
                  </Badge>
                  {t.empilhadeiraId && (
                    <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-mono">
                      {t.empilhadeiraId}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
