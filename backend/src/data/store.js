module.exports = {
  lots: [
    {
      id: 'LOT-1001',
      codigo: 'LOT-1001',
      produto: 'Café Arábica Especial',
      qualidade: 'Tipo 2 / Bebida Mole',
      proprietario: 'Fazenda União',
      quantidade: 1200,
      quantidadeSacas: 1200,
      status: 'AGUARDANDO_DESCARGA'
    },
    {
      id: 'LOT-1002',
      codigo: 'LOT-1002',
      produto: 'Café Conilon Gourmet',
      qualidade: 'Tipo 4',
      proprietario: 'Sítio Santa Luzia',
      quantidade: 850,
      quantidadeSacas: 850,
      status: 'ARMAZENADO'
    }
  ],
  forklifts: [
    {
      id: 'EMP-01',
      nome: 'EMP-01',
      modelo: 'EMP-01',
      operador: 'Carlos Silva',
      capacidadeKg: 2500,
      status: 'DISPONIVEL'
    },
    {
      id: 'EMP-02',
      nome: 'EMP-02',
      modelo: 'EMP-02',
      operador: 'João Souza',
      capacidadeKg: 3000,
      status: 'DISPONIVEL'
    }
  ],
  tasks: [],
  positions: []
};
