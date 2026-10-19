import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Badge } from "../components/Common.jsx";

export default function OperatorView() {
  const [empilhadeiras, setEmpilhadeiras] = useState([]);
  const [empSelecionada, setEmpSelecionada] = useState("");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [leitura, setLeitura] = useState(null);
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    api.empilhadeiras().then((emps) => {
      const lista = Array.isArray(emps) ? emps : [];
      setEmpilhadeiras(lista);
      if (lista[0]) setEmpSelecionada(lista[0].id);
    }).catch(() => setEmpilhadeiras([]));
  }, []);

  useEffect(() => {
    if (!empSelecionada) return;
    carregar();
    const interval = setInterval(carregar, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empSelecionada]);

  async function carregar() {
    try {
      const res = await api.proximaTarefaOperador(empSelecionada);
      setDados(res);
      setLeitura(null);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function simularLeitura() {
    if (!dados?.tarefa) return;
    try {
      const codigoEsperado = dados.bigBag?.qrCode || "";
      const codigo = codigoDigitado || codigoEsperado;
      const res = await api.lerCodigo(empSelecionada, {
        codigoLido: codigo,
        tarefaId: dados.tarefa.id,
      });
      setLeitura(res);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function confirmarConclusao() {
    if (!dados?.tarefa) return;
    setProcessando(true);
    try {
      await api.confirmarConclusao(empSelecionada, dados.tarefa.id);
      
      // Limpa os dados visuais antes de recarregar
      setDados(null);
      setLeitura(null);
      setCodigoDigitado("");
      
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setProcessando(false);
    }
  }

  if (erro) return <ErrorBox message={erro} />;

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Monitor do Operador</h2>
        <p className="text-slate-500 text-xs mt-1">Interface simplificada para empilhadeiras</p>
      </div>

      <select
        value={empSelecionada}
        onChange={(e) => {
          setEmpSelecionada(e.target.value);
          setDados(null);
        }}
        className="w-full border rounded-lg px-3 py-2 text-sm mb-4 bg-white"
      >
        {(empilhadeiras || []).map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome || e.id} — {e.operador || "Operador"} ({e.status || "LIVRE"})
          </option>
        ))}
      </select>

      {!dados && <Loading label="A verificar tarefas..." />}

      {dados && !dados.tarefa && (
        <div className="bg-white rounded-2xl shadow-md p-6 text-center space-y-2">
          <p className="text-4xl">✅</p>
          <p className="text-sm font-semibold text-slate-700">Empilhadeira Livre / Tudo Concluído!</p>
          <p className="text-xs text-slate-500">
            {dados.mensagem || "Não há tarefas pendentes para esta empilhadeira."}
          </p>
        </div>
      )}

      {dados && dados.tarefa && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
          <div className="bg-brand-600 text-white px-5 py-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-wide opacity-80">Tarefa em Execução</p>
              <p className="text-lg font-bold">
                {(dados.tarefa.tipo || "MOVIMENTACAO").replace("_", " ")}
              </p>
            </div>
            <span className="text-xs font-mono bg-brand-700 px-2 py-1 rounded">
              #{dados.tarefa.id}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm font-medium text-slate-800">{dados.tarefa.descricao}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Origem</p>
                <p className="font-bold text-slate-700">{dados.tarefa.origemId || "Doca 01"}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Destino</p>
                <p className="font-bold text-slate-700">{dados.tarefa.destinoId || "A definir"}</p>
              </div>
            </div>

            {dados.bigBag && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Big Bag</p>
                <p className="font-bold text-slate-800">{dados.bigBag.id} — {dados.bigBag.pesoKg} kg</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  QR: {dados.bigBag.qrCode}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge type={dados.tarefa.status || "PENDENTE"}>
                {(dados.tarefa.status || "PENDENTE").replace("_", " ")}
              </Badge>
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="text-xs text-slate-500 font-medium">Simular leitura de RFID / QR Code:</p>
              <input
                type="text"
                placeholder={dados.bigBag?.qrCode || "Código do Big Bag"}
                value={codigoDigitado}
                onChange={(e) => setCodigoDigitado(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
              />
              <button
                onClick={simularLeitura}
                className="w-full py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
              >
                📷 Simular leitura
              </button>

              {leitura && (
                <p
                  className={`text-xs rounded-lg p-2.5 font-medium ${
                    leitura.valido || leitura.sucesso
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {leitura.mensagem}
                </p>
              )}
            </div>

            <button
              onClick={confirmarConclusao}
              disabled={processando}
              className="w-full py-3 rounded-lg bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
            >
              {processando ? "A concluir..." : "✔ Confirmar Conclusão da Tarefa"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
