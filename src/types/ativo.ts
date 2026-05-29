export type ComponenteStatus = 'OK' | 'Defeito';

export type Componentes = {
  memoriaRam: ComponenteStatus;
  placaMae: ComponenteStatus;
  armazenamento: ComponenteStatus;
  fonte: ComponenteStatus;
};

export type InfraAtivo = {
  hostname: string;
  ip: string;
  mac: string;
  vlan: string;
  portaSwitch: string;
};

export interface Ativo {
  id: string;
  patrimonio: string;
  tipo: string;
  setor: string;
  status: string;
  descricao?: string;
  componentes?: Componentes | null;
  deletado?: boolean;
  responsavel?: string;
  matricula?: string;
  contato?: string;
  criadoPor?: string;
  atualizadoPor?: string;
  dataCadastro?: any;
  dataAtualizacao?: any;
  hostname?: string;
  ip?: string;
  mac?: string;
  vlan?: string;
  portaSwitch?: string;
  totalPortas?: number;
  portasUsadas?: number;
  portasOcupadas?: number[];
  dataManutencao?: any;
}
