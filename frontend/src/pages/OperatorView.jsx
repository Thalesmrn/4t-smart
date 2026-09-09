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

  useEffect(() => {
    api.empilhadeiras().then((emps) => {
      setEmpilhadeiras(emps);
      if (emps[0]) setEmpSelecionada(emps[0].id);
    });
  }, []);

  useEffect(() => {
    if (!empSelecionada) return;
    carregar();
    const interval = setInterval(carregar, 6000);
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
      const codigo = codigoDigitado || codigoEsperado; // se não digitar nada, simula leitura correta
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
    try {
      await api.confirmarConclusao(empSelecionada, dados.tarefa.id);
      setCodigoDigitado("");
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  if (erro) return <ErrorBox message={erro} />;

  return (
    <div className="max-w-sm mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Monitor do Operador</h2>
        <p className="text-slate-500 text-xs mt-1">Interface simplificada para empilhadeiras</p>
      </div>

      <select
        value={empSelecionada}
        onChange={(e) => setEmpSelecionada(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
      >
        {empilhadeiras.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome} — {e.operador}
          </option>
        ))}
      </select>

      {!dados && <Loading label="Carregando..." />}

      {dados && !dados.tarefa && (
        <div className="bg-white rounded-2xl shadow-md p-6 text-center">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-sm text-slate-500">{dados.mensagem}</p>
        </div>
      )}

      {dados && dados.tarefa && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-brand-600 text-white px-5 py-4">
            <p className="text-xs uppercase tracking-wide opacity-80">Próxima tarefa</p>
            <p className="text-lg font-bold">{dados.tarefa.tipo.replace("_", " ")}</p>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm font-medium">{dados.tarefa.descricao}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase">Origem</p>
                <p className="font-semibold">{dados.tarefa.origemId}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase">Destino</p>
                <p className="font-semibold">{dados.tarefa.destinoId || "a definir"}</p>
              </div>
            </div>

            {dados.bigBag && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <p className="text-[10px] text-slate-400 uppercase">Big Bag</p>
                <p className="font-semibold">{dados.bigBag.id} — {dados.bigBag.pesoKg} kg</p>
                <p className="text-xs text-slate-400">QR esperado: {dados.bigBag.qrCode}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge type={dados.tarefa.status}>{dados.tarefa.status.replace("_", " ")}</Badge>
              {dados.tarefa.urgente && <Badge type="bloqueada">urgente</Badge>}
              <span className="text-xs text-slate-400 ml-auto">
                prioridade {dados.tarefa.prioridadeScore}
              </span>
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="text-xs text-slate-500">Simular leitura de RFID/QR Code:</p>
              <input
                type="text"
                placeholder={dados.bigBag?.qrCode || "Código do big bag"}
                value={codigoDigitado}
                onChange={(e) => setCodigoDigitado(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={simularLeitura}
                className="w-full py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold"
              >
                📷 Simular leitura
              </button>

              {leitura && (
                <p
                  className={`text-xs rounded-lg p-2 ${
                    leitura.valido ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {leitura.mensagem}
                </p>
              )}
            </div>

            <button
              onClick={confirmarConclusao}
              className="w-full py-3 rounded-lg bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-colors"
            >
              ✔ Confirmar Conclusão da Tarefa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
