import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../../../config/firebase';
import type { Componentes } from '../../../types/ativo';

type LinhaInventario = [
  setor: string,
  tipo: string,
  modelo: string,
  patrimonio: string,
  situacao: string,
  ip: string,
  observacao: string,
];

const NUTIN = 'NUTIN - Núcleo de Tecnologia da Informação';
const COCER = 'COCER - Coordenação de Certificação';
const COFIS = 'COFIS - Coordenação de Fiscalização';
const COSEP = 'COSEP - Coordenação de Serviços Especiais';
const DDE = 'DDE - Diretoria de Desenvolvimento Empresarial';
const DRM = 'DRM - Diretoria de Regulação de Mercado';
const SETRA = 'SETRA - Setor de Transporte';
const ARQ = 'Equipamento semelhante a all-in-one';
const FICTICIO = 'Patrimônio real substituído por código fictício';
const NAO_INFORMADO = 'Patrimônio real não informado';

const LINHAS: LinhaInventario[] = [
  [NUTIN, 'Computador', '', 'PC-NUTIN-01', 'Funcional e ativo', '10.20.0.12', ''],
  [NUTIN, 'Arquimedes', ARQ, 'ARQ-NUTIN-01', 'Funcional e ativo', '10.20.0.13', ''],
  [NUTIN, 'Computador', '', 'PC-NUTIN-02', 'Não liga', '', 'Equipamento com defeito'],
  [NUTIN, 'Computador', '', 'PC-NUTIN-03', 'Fonte com defeito', '', 'Equipamento com defeito'],
  [NUTIN, 'Computador', '', 'PC-NUTIN-04', 'HD/SSD com falha', '', 'Equipamento com defeito'],
  [NUTIN, 'Computador', '', 'PC-NUTIN-05', 'Sistema operacional corrompido', '', 'Equipamento com defeito'],
  [NUTIN, 'Computador', '', 'PC-NUTIN-06', 'Sem vídeo', '', 'Equipamento com defeito'],
  [NUTIN, 'Computador', '', 'PC-NUTIN-07', 'Travando durante o uso', '', 'Equipamento com defeito'],
  [NUTIN, 'Tela/monitor', '', 'MON-NUTIN-01', 'Funcionando', '', ''],
  [NUTIN, 'Tela/monitor', '', 'MON-NUTIN-02', 'Funcionando', '', ''],
  [NUTIN, 'Tela/monitor', '', 'MON-NUTIN-03', 'Funcionando', '', ''],
  [NUTIN, 'Tela/monitor', '', 'MON-NUTIN-04', 'Funcionando', '', ''],
  ['Ouvidoria', 'Computador', '', 'PC-OUV-01', 'Funcional e ativo', '10.20.0.21', ''],
  ['Ouvidoria', 'Computador', '', 'PC-OUV-02', 'Funcional e ativo', '10.20.0.22', ''],
  ['Ouvidoria', 'Switch', 'Switch pequeno de 6 portas', 'SW-OUV-01', 'Funcional', '10.20.0.23', ''],
  ['Ouvidoria', 'Telefone', '', 'TEL-OUV-01', 'Funcional', '', ''],
  ['Ouvidoria', 'Telefone', '', 'TEL-OUV-02', 'Funcional', '', ''],
  ['Ouvidoria', 'Impressora', 'Epson EcoTank L3250', 'IMP-OUV-01', 'Funcional', '10.20.0.24', ''],
  [COCER, 'Arquimedes', ARQ, 'ARQ-COCER-01', 'Funcional e ativo', '10.20.0.31', FICTICIO],
  [COCER, 'Arquimedes', ARQ, 'ARQ-COCER-02', 'Funcional e ativo', '10.20.0.32', FICTICIO],
  [COCER, 'Arquimedes', ARQ, 'ARQ-COCER-03', 'Funcional e ativo', '10.20.0.33', FICTICIO],
  [COCER, 'Arquimedes', ARQ, 'ARQ-COCER-04', 'Funcional e ativo', '10.20.0.34', FICTICIO],
  [COCER, 'Arquimedes', ARQ, 'ARQ-COCER-05', 'Funcional e ativo', '10.20.0.35', FICTICIO],
  [COCER, 'Arquimedes', ARQ, 'ARQ-COCER-06', 'Funcional e ativo', '10.20.0.36', FICTICIO],
  [COCER, 'Computador', '', 'PC-COCER-01', 'Parado por falta de funcionário', '10.20.0.37', FICTICIO],
  [COCER, 'Impressora', 'Canon G3110', 'IMP-COCER-01', 'Funcional', '10.20.0.38', ''],
  [COCER, 'Impressora', 'Epson EcoTank L6191', 'IMP-COCER-02', 'Funcional', '10.20.0.39', ''],
  [COFIS, 'Arquimedes', ARQ, 'ARQ-COFIS-01', 'Funcional e ativo', '10.20.0.41', FICTICIO],
  [COFIS, 'Arquimedes', ARQ, 'ARQ-COFIS-02', 'Funcional e ativo', '10.20.0.42', FICTICIO],
  [COFIS, 'Switch', 'Switch pequeno de 6 portas', 'SW-COFIS-01', 'Funcional', '10.20.0.43', ''],
  [COSEP, 'Arquimedes', ARQ, 'ARQ-COSEP-01', 'Funcional e ativo', '10.20.0.51', FICTICIO],
  [COSEP, 'Arquimedes', ARQ, 'ARQ-COSEP-02', 'Funcional e ativo', '10.20.0.52', FICTICIO],
  [COSEP, 'Arquimedes', ARQ, 'ARQ-COSEP-03', 'Funcional e ativo', '10.20.0.53', FICTICIO],
  [COSEP, 'Impressora', 'Epson EcoTank L4260', 'IMP-COSEP-01', 'Funcional', '10.20.0.54', ''],
  ['Esfigmomanômetros', 'Computador', '', 'PC-ESFIG-01', 'Funcional e ativo', '10.20.0.61', NAO_INFORMADO],
  ['Esfigmomanômetros', 'Computador', '', 'PC-ESFIG-02', 'Funcional e ativo', '10.20.0.62', NAO_INFORMADO],
  ['Esfigmomanômetros', 'Impressora', 'Brother DCP-L2540DW', 'IMP-ESFIG-01', 'Funcional', '10.20.0.63', ''],
  ['Laboratório de Etilômetro', 'Impressora', 'HP LaserJet Pro M404dw', 'IMP-ETILO-01', 'Funcional', '10.20.0.71', ''],
  [DDE, 'Arquimedes', ARQ, 'ARQ-DDE-01', 'Funcional e ativo', '10.20.0.81', NAO_INFORMADO],
  [DDE, 'Arquimedes', ARQ, 'ARQ-DDE-02', 'Funcional e ativo', '10.20.0.82', NAO_INFORMADO],
  [DDE, 'Computador', '', 'PC-DDE-01', 'Funcional e ativo', '10.20.0.83', NAO_INFORMADO],
  [DDE, 'Computador', '', 'PC-DDE-02', 'Funcional e ativo', '10.20.0.84', NAO_INFORMADO],
  [DDE, 'Computador', '', 'PC-DDE-03', 'Funcional e ativo', '10.20.0.85', NAO_INFORMADO],
  [DRM, 'Computador', '', 'PC-DRM-01', 'Funcional e ativo', '10.20.0.91', NAO_INFORMADO],
  [DRM, 'Impressora', 'Epson EcoTank L3250', 'IMP-DRM-01', 'Funcional', '10.20.0.92', NAO_INFORMADO],
  [SETRA, 'Computador', '', 'PC-SETRA-01', 'Funcional e ativo', '10.20.0.101', `Nome completo do setor não informado; ${NAO_INFORMADO.toLowerCase()}`],
  [SETRA, 'Computador', '', 'PC-SETRA-02', 'Funcional e ativo', '10.20.0.102', `Nome completo do setor não informado; ${NAO_INFORMADO.toLowerCase()}`],
  [SETRA, 'Arquimedes', ARQ, 'ARQ-SETRA-01', 'Funcional e ativo', '10.20.0.103', `Nome completo do setor não informado; ${NAO_INFORMADO.toLowerCase()}`],
];

const COMPONENTES_OK: Componentes = {
  memoriaRam: 'OK',
  placaMae: 'OK',
  armazenamento: 'OK',
  fonte: 'OK',
};

function obterComponentes(situacao: string): Componentes {
  return {
    ...COMPONENTES_OK,
    fonte: situacao.includes('Fonte') ? 'Defeito' : 'OK',
    armazenamento: situacao.includes('HD/SSD') ? 'Defeito' : 'OK',
  };
}

function obterStatus(situacao: string) {
  return /não liga|defeito|falha|corrompido|sem vídeo|travando/i.test(situacao)
    ? 'Manutenção'
    : situacao.includes('falta de funcionário')
      ? 'Disponível'
      : 'Ativo';
}

export async function importarInventarioInicial(usuario: string) {
  const snapshot = await getDocs(collection(db, 'ativos'));
  const patrimoniosExistentes = new Set(
    snapshot.docs.map((item) => String(item.data().patrimonio || '').toUpperCase()),
  );
  const batch = writeBatch(db);
  let importados = 0;
  let ignorados = 0;

  LINHAS.forEach(([setor, tipo, modelo, patrimonio, situacao, ip, observacao]) => {
    if (patrimoniosExistentes.has(patrimonio)) {
      ignorados += 1;
      return;
    }

    const ehComputador = tipo === 'Computador' || tipo === 'Arquimedes';
    const ehArquimedes = tipo === 'Arquimedes';
    const ehSwitch = tipo === 'Switch';
    const status = obterStatus(situacao);
    const descricao = [
      modelo && `Modelo: ${modelo}`,
      `Situação original: ${situacao}`,
      observacao,
    ].filter(Boolean).join('\n');
    const ativoRef = doc(collection(db, 'ativos'));

    batch.set(ativoRef, {
      patrimonio,
      tipo,
      setor,
      status,
      descricao,
      componentes: ehComputador ? obterComponentes(situacao) : null,
      tela: ehArquimedes ? 'OK' : null,
      ip,
      hostname: '',
      mac: '',
      responsavel: '',
      contato: '',
      totalPortas: ehSwitch ? 6 : null,
      portasUsadas: ehSwitch ? 0 : null,
      portasOcupadas: [],
      dataManutencao: status === 'Manutenção' ? serverTimestamp() : null,
      dataCadastro: Date.now(),
      dataAtualizacao: serverTimestamp(),
      criadoPor: usuario,
      atualizadoPor: usuario,
      deletado: false,
    });
    batch.set(doc(collection(db, 'historicoAtivos')), {
      ativoId: ativoRef.id,
      patrimonio,
      acao: 'Importado da planilha inicial',
      usuario,
      detalhes: `Tipo: ${tipo} | Setor: ${setor}`,
      data: serverTimestamp(),
    });
    importados += 1;
  });

  await batch.commit();
  return { importados, ignorados, total: LINHAS.length };
}
