export type StatusFiltroAtivo =
  | 'Todos'
  | 'Disponível'
  | 'Ativo'
  | 'Manutenção'
  | 'Lixeira';

export const STATUS_FILTROS: StatusFiltroAtivo[] = [
  'Todos',
  'Disponível',
  'Ativo',
  'Manutenção',
  'Lixeira',
];

export const TIPOS_CODIGO_BARRAS = [
  'code128',
  'code39',
  'ean13',
  'ean8',
  'itf14',
  'codabar',
  'qr',
  'pdf417',
] as const;
