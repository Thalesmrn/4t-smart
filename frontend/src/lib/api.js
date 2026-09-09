// Em produção (Vercel), VITE_API_URL aponta para o backend real no Render,
// ex.: https://meu-backend.onrender.com — sem essa variável, cai no caminho
// relativo "/api", que só funciona em dev graças ao proxy do vite.config.js.
const API_URL = import.meta.env.VITE_API_URL || "";
const BASE_URL = `${API_URL}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const erro = await res.json().catch(() => ({ erro: "Erro desconhecido" }));
    throw new Error(erro.erro || `Erro ${res.status}`);
  }
  return res.json();
}

export const api = {
  dashboard: () => request("/dashboard"),

  galpoes: () => request("/armazem/galpoes"),
  posicoes: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/armazem/posicoes${qs ? `?${qs}` : ""}`);
  },
  posicao: (id) => request(`/armazem/posicoes/${id}`),
  liberarPosicao: (id) => request(`/armazem/posicoes/${id}/liberar`, { method: "POST" }),

  tarefas: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tarefas${qs ? `?${qs}` : ""}`);
  },
  atribuirAutomatico: () => request("/tarefas/atribuir-automatico", { method: "POST" }),
  atribuirManual: (tarefaId, empilhadeiraId) =>
    request(`/tarefas/${tarefaId}/atribuir`, {
      method: "POST",
      body: JSON.stringify({ empilhadeiraId }),
    }),
  concluirTarefa: (tarefaId) => request(`/tarefas/${tarefaId}/concluir`, { method: "POST" }),

  empilhadeiras: () => request("/empilhadeiras"),
  empilhadeira: (id) => request(`/empilhadeiras/${id}`),
  criarEmpilhadeira: (payload) =>
    request("/empilhadeiras", { method: "POST", body: JSON.stringify(payload) }),

  lotes: () => request("/lotes"),
  lote: (id) => request(`/lotes/${id}`),
  criarLote: (payload) => request("/lotes", { method: "POST", body: JSON.stringify(payload) }),
  registrarRecebimento: (loteId) =>
    request(`/lotes/${loteId}/registrar-recebimento`, { method: "POST" }),

  sequenciaOtimizada: (empilhadeiraId) => request(`/roteirizacao/sequencia/${empilhadeiraId}`),

  recomendarSlotting: (payload) =>
    request("/slotting/recomendar", { method: "POST", body: JSON.stringify(payload) }),

  proximaTarefaOperador: (empilhadeiraId) => request(`/operador/${empilhadeiraId}/proxima-tarefa`),
  lerCodigo: (empilhadeiraId, payload) =>
    request(`/operador/${empilhadeiraId}/ler-codigo`, { method: "POST", body: JSON.stringify(payload) }),
  confirmarConclusao: (empilhadeiraId, tarefaId) =>
    request(`/operador/${empilhadeiraId}/confirmar-conclusao/${tarefaId}`, { method: "POST" }),

  reset: () => request("/reset", { method: "POST" }),
};
