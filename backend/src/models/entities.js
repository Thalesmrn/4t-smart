/**
 * 4T Smart Warehouse — Modelos de Dados (documentação em JSDoc)
 * Banco simulado em memória (mock), estrutura pensada para migração
 * futura direta para PostgreSQL/SQLite (ver README > "Evoluindo para banco real").
 */

/**
 * @typedef {Object} Galpao
 * @property {string} id
 * @property {string} nome
 * @property {number} linhas
 * @property {number} colunas
 */

/**
 * @typedef {Object} Posicao
 * @property {string} id           - Código único, ex: "G1-A03"
 * @property {string} galpaoId
 * @property {number} linha
 * @property {number} coluna
 * @property {'livre'|'ocupada'|'bloqueada'|'atencao'} status
 * @property {string|null} loteId
 * @property {string|null} bigBagId
 * @property {string|null} produto
 * @property {number|null} pesoKg
 * @property {string|null} dataEntrada  - ISO date
 * @property {string|null} proprietario
 * @property {string|null} motivoBloqueio
 * @property {number} distanciaDoca     - distância (em "células") até a doca de expedição
 * @property {number} distanciaRebeneficio - distância até a máquina de rebeneficiamento
 */

/**
 * @typedef {Object} Lote
 * @property {string} id
 * @property {string} produto        - ex: "Café Arábica Cereja Descascado"
 * @property {string} qualidade      - ex: "Tipo 6, Bica Corrida"
 * @property {string} proprietario
 * @property {number} sacas
 * @property {'aguardando_descarga'|'armazenado'|'em_formacao_liga'|'expedido'} status
 */

/**
 * @typedef {Object} BigBag
 * @property {string} id
 * @property {string} loteId
 * @property {number} pesoKg
 * @property {string|null} posicaoId
 * @property {string} qrCode
 * @property {'armazenado'|'em_transito'|'expedido'} status
 */

/**
 * @typedef {Object} Empilhadeira
 * @property {string} id
 * @property {string} nome
 * @property {string} operador
 * @property {'disponivel'|'em_tarefa'|'manutencao'} status
 * @property {string} posicaoAtualId   - posição/coordenada atual no armazém
 * @property {number} capacidadeKg
 * @property {number} distanciaPercorridaHojeM
 */

/**
 * @typedef {Object} Caminhao
 * @property {string} id
 * @property {string} placa
 * @property {string} transportadora
 * @property {string} horarioChegada    - ISO datetime
 * @property {'recebimento'|'expedicao'} tipoOperacao
 * @property {string|null} loteId
 * @property {'aguardando'|'em_descarga'|'em_carregamento'|'finalizado'} status
 */

/**
 * @typedef {Object} Tarefa
 * @property {string} id
 * @property {'recebimento'|'separacao'|'formacao_liga'|'expedicao'|'transferencia'} tipo
 * @property {string} descricao
 * @property {string|null} bigBagId
 * @property {string|null} loteId
 * @property {string|null} origemId       - posicaoId ou "DOCA-RECEBIMENTO"
 * @property {string|null} destinoId      - posicaoId ou "DOCA-EXPEDICAO"
 * @property {number} prioridadeScore     - calculado pelo priorityEngine
 * @property {string} prioridadeExplicacao
 * @property {string|null} empilhadeiraId
 * @property {'pendente'|'atribuida'|'em_execucao'|'concluida'} status
 * @property {string} criadoEm
 * @property {string|null} prazoLimite
 * @property {boolean} urgente
 */

module.exports = {};
