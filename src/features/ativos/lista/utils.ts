import type { Ativo } from '../../../types/ativo';
import type { StatusFiltroAtivo } from './constants';

export function formatarPatrimonioEscaneado(codigo: string) {
  const codigoLimpo = codigo.trim();

  return codigoLimpo.toUpperCase().startsWith('INMETRO-')
    ? codigoLimpo
    : `INMETRO-${codigoLimpo}`;
}

export function ativoCombinaComBusca(ativo: Ativo, busca: string) {
  const textoBusca = busca.toLowerCase().trim();

  return (
    ativo.patrimonio.toLowerCase().includes(textoBusca) ||
    ativo.tipo.toLowerCase().includes(textoBusca) ||
    ativo.setor.toLowerCase().includes(textoBusca) ||
    Boolean(ativo.responsavel?.toLowerCase().includes(textoBusca))
  );
}

export function filtrarAtivos(
  ativos: Ativo[],
  busca: string,
  statusSelecionado: StatusFiltroAtivo,
) {
  return ativos.filter((ativo) => {
    const matchesTexto = ativoCombinaComBusca(ativo, busca);

    if (statusSelecionado === 'Lixeira') {
      return matchesTexto && ativo.deletado === true;
    }

    if (ativo.deletado === true) {
      return false;
    }

    const matchesStatus =
      statusSelecionado === 'Todos' || ativo.status === statusSelecionado;

    return matchesTexto && matchesStatus;
  });
}

export function getStatusStyle(status: string) {
  switch (status) {
    case 'Disponível':
      return { bg: '#e8f5e9', text: '#2e7d32' };
    case 'Ativo':
      return { bg: '#e3f2fd', text: '#1565c0' };
    case 'Manutenção':
      return { bg: '#fff3e0', text: '#ef6c00' };
    case 'Lixeira':
      return { bg: '#fee2e2', text: '#991b1b' };
    default:
      return { bg: '#f5f5f5', text: '#616161' };
  }
}
