import type { Componentes } from '../../../types/ativo';

export function ativoEhComputador(tipo?: string) {
  const tipoNormalizado = tipo?.toLowerCase() || '';

  return (
    tipoNormalizado.includes('pc') ||
    tipoNormalizado.includes('computador') ||
    tipoNormalizado.includes('notebook')
  );
}

export function ativoEhSwitch(tipo?: string) {
  const tipoNormalizado = tipo?.toLowerCase() || '';

  return (
    tipoNormalizado.includes('switch') ||
    tipoNormalizado.includes('hub') ||
    tipoNormalizado.includes('roteador')
  );
}

export function calcularStatusAtivo(
  componentes: Componentes,
  responsavel: string,
) {
  const temDefeito = Object.values(componentes).includes('Defeito');

  if (temDefeito) {
    return 'Manutenção';
  }

  if (responsavel.trim() !== '') {
    return 'Ativo';
  }

  return 'Disponível';
}

export function descricaoParaNotas(descricao?: string) {
  if (!descricao) {
    return [];
  }

  return descricao.split('\n').filter((linha) => linha.trim() !== '');
}

export function notasParaDescricao(notas: string[]) {
  return notas.join('\n');
}

export function gerarCarimbo(usuarioLogado: string) {
  const agora = new Date();
  const operador = usuarioLogado?.split('@')[0] || 'Técnico';

  return `[${agora.toLocaleDateString()} ${agora.toLocaleTimeString()}] ${operador}:`;
}
