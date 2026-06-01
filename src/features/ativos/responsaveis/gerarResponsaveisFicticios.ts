import type { Ativo } from '../../../types/ativo';

const NOMES = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Elisa',
  'Fabio',
  'Gabriela',
  'Henrique',
  'Isabela',
  'Joao',
  'Larissa',
  'Marcos',
  'Natalia',
  'Paulo',
  'Renata',
  'Sergio',
  'Talita',
  'Vanessa',
  'Wesley',
  'Yasmin',
];

const SOBRENOMES = [
  'Almeida',
  'Barbosa',
  'Cardoso',
  'Costa',
  'Ferreira',
  'Gomes',
  'Lima',
  'Martins',
  'Mendes',
  'Nascimento',
  'Oliveira',
  'Pereira',
  'Ribeiro',
  'Rocha',
  'Santana',
  'Santos',
  'Silva',
  'Souza',
  'Teixeira',
  'Vieira',
];

function normalizarTipo(tipo?: string) {
  return (tipo || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function ativoRecebeResponsavelFicticio(tipo?: string) {
  const tipoNormalizado = normalizarTipo(tipo);

  return (
    tipoNormalizado.includes('pc')
    || tipoNormalizado.includes('computador')
    || tipoNormalizado.includes('desktop')
    || tipoNormalizado.includes('notebook')
    || tipoNormalizado.includes('arquimedes')
  );
}

export function gerarResponsaveisFicticios(ativos: Ativo[]) {
  const elegiveis = ativos
    .filter((ativo) => (
      !ativo.deletado
      && !ativo.responsavel?.trim()
      && ativoRecebeResponsavelFicticio(ativo.tipo)
    ))
    .sort((a, b) => a.patrimonio.localeCompare(b.patrimonio, 'pt-BR', { numeric: true }));
  const totalCombinacoes = NOMES.length * SOBRENOMES.length;

  if (elegiveis.length > totalCombinacoes) {
    throw new Error('Não há nomes fictícios suficientes para todos os equipamentos sem responsável.');
  }

  return elegiveis.map((ativo, posicao) => {
    const numero = posicao + 1;
    const nome = NOMES[posicao % NOMES.length];
    const sobrenome = SOBRENOMES[
      (Math.floor(posicao / NOMES.length) + (posicao * 7)) % SOBRENOMES.length
    ];

    return {
      ativo,
      responsavel: {
        responsavel: `${nome} ${sobrenome}`,
        matricula: `DEMO-${String(numero).padStart(4, '0')}`,
        contato: `Ramal ${String(1000 + numero)}`,
      },
    };
  });
}
