import type { Componentes } from '../../../types/ativo';

export const COMPONENTES_PADRAO: Componentes = {
  memoriaRam: 'OK',
  placaMae: 'OK',
  armazenamento: 'OK',
  fonte: 'OK',
};

export const NOMES_COMPONENTES: Record<keyof Componentes, string> = {
  memoriaRam: 'Memória RAM',
  placaMae: 'Placa-Mãe',
  armazenamento: 'Armazenamento',
  fonte: 'Fonte',
};
