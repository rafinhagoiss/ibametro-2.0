import type { Ativo, InfraAtivo } from '../../../types/ativo';

const PRIMEIRO_IP = 10;
const ULTIMO_IP = 254;
const PORTAS_POR_SWITCH = 24;

function limparIdentificador(valor?: string) {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();
}

export function ativoRecebeInfraestruturaAutomatica(tipo?: string) {
  const tipoNormalizado = limparIdentificador(tipo);

  return (
    tipoNormalizado.includes('PC')
    || tipoNormalizado.includes('COMPUTADOR')
    || tipoNormalizado.includes('DESKTOP')
    || tipoNormalizado.includes('NOTEBOOK')
    || tipoNormalizado.includes('ARQUIMEDES')
    || tipoNormalizado.includes('IMPRESSORA')
    || tipoNormalizado.includes('PRINTER')
  );
}

function prefixoHostname(tipo?: string) {
  const tipoNormalizado = limparIdentificador(tipo);

  if (tipoNormalizado.includes('ARQUIMEDES')) return 'ARQ';
  if (tipoNormalizado.includes('IMPRESSORA') || tipoNormalizado.includes('PRINTER')) return 'IMP';
  if (tipoNormalizado.includes('NOTEBOOK')) return 'NB';
  return 'PC';
}

function gerarMac(indice: number) {
  const hexadecimal = indice.toString(16).padStart(6, '0').toUpperCase();
  return `02:20:00:${hexadecimal.slice(0, 2)}:${hexadecimal.slice(2, 4)}:${hexadecimal.slice(4, 6)}`;
}

function gerarPortaSwitch(indice: number) {
  const switchNumero = Math.floor((indice - 1) / PORTAS_POR_SWITCH) + 1;
  const portaNumero = ((indice - 1) % PORTAS_POR_SWITCH) + 1;

  return `SW-${String(switchNumero).padStart(2, '0')}/P${String(portaNumero).padStart(2, '0')}`;
}

export function gerarInfraestruturasRede(ativos: Ativo[]) {
  const elegiveis = ativos
    .filter((ativo) => !ativo.deletado && ativoRecebeInfraestruturaAutomatica(ativo.tipo))
    .sort((a, b) => a.patrimonio.localeCompare(b.patrimonio, 'pt-BR', { numeric: true }));

  if (elegiveis.length > ULTIMO_IP - PRIMEIRO_IP + 1) {
    throw new Error('A faixa 10.20.0.x não possui endereços suficientes para todos os equipamentos.');
  }

  return elegiveis.map((ativo, posicao) => {
    const indice = posicao + 1;
    const patrimonio = limparIdentificador(ativo.patrimonio) || String(indice).padStart(3, '0');
    const infraestrutura: InfraAtivo = {
      hostname: `${prefixoHostname(ativo.tipo)}-${patrimonio}`,
      ip: `10.20.0.${PRIMEIRO_IP + posicao}`,
      mac: gerarMac(indice),
      vlan: '0',
      portaSwitch: gerarPortaSwitch(indice),
    };

    return { ativo, infraestrutura };
  });
}
