import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Ativo, Componentes } from '../../../types/ativo';

const COLUNAS_CSV = [
  'Patrimônio',
  'Tipo',
  'Setor',
  'Status',
  'Responsável',
  'Matrícula',
  'Hostname',
  'IP',
  'MAC',
  'VLAN',
  'Porta Switch',
  'Total de Portas',
  'Portas Usadas',
  'Portas Ocupadas',
  'Componentes',
  'Observações',
];

function escaparCampoCsv(valor: unknown) {
  const texto = String(valor ?? '');
  const precisaAspas = /[;"\n\r]/.test(texto);
  const textoEscapado = texto.replace(/"/g, '""');

  return precisaAspas ? `"${textoEscapado}"` : textoEscapado;
}

function formatarComponentes(componentes?: Componentes | null) {
  if (!componentes) {
    return '';
  }

  return [
    `Memória RAM: ${componentes.memoriaRam}`,
    `Placa-Mãe: ${componentes.placaMae}`,
    `Armazenamento: ${componentes.armazenamento}`,
    `Fonte: ${componentes.fonte}`,
  ].join(' | ');
}

function montarLinhasCsv(ativos: Ativo[]) {
  const cabecalho = COLUNAS_CSV.map(escaparCampoCsv).join(';');

  const linhas = ativos.map((ativo) =>
    [
      ativo.patrimonio,
      ativo.tipo,
      ativo.setor,
      ativo.deletado ? 'Lixeira' : ativo.status,
      ativo.responsavel,
      ativo.matricula,
      ativo.hostname,
      ativo.ip,
      ativo.mac,
      ativo.vlan,
      ativo.portaSwitch,
      ativo.totalPortas,
      ativo.portasUsadas,
      ativo.portasOcupadas?.join(', '),
      formatarComponentes(ativo.componentes),
      ativo.descricao,
    ]
      .map(escaparCampoCsv)
      .join(';'),
  );

  return [cabecalho, ...linhas].join('\n');
}

function gerarNomeArquivo() {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10);
  const hora = agora
    .toLocaleTimeString('pt-BR', { hour12: false })
    .replace(/:/g, '-');

  return `inventario_${data}_${hora}.csv`;
}

function baixarCsvNoNavegador(conteudoCsv: string, nomeArquivo: string) {
  const navegador = globalThis as any;

  if (!navegador.document || !navegador.Blob || !navegador.URL) {
    throw new Error('Download indisponível neste navegador.');
  }

  const blob = new navegador.Blob([conteudoCsv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = navegador.URL.createObjectURL(blob);
  const link = navegador.document.createElement('a');

  link.href = url;
  link.download = nomeArquivo;
  link.style.display = 'none';

  navegador.document.body.appendChild(link);
  link.click();
  navegador.document.body.removeChild(link);
  navegador.URL.revokeObjectURL(url);
}

export async function exportarInventarioCsv(ativos: Ativo[]) {
  if (ativos.length === 0) {
    throw new Error('Não há ativos para exportar.');
  }

  const nomeArquivo = gerarNomeArquivo();
  const conteudoCsv = `\uFEFFsep=;\n${montarLinhasCsv(ativos)}`;

  if (Platform.OS === 'web') {
    baixarCsvNoNavegador(conteudoCsv, nomeArquivo);
    return nomeArquivo;
  }

  const podeCompartilhar = await Sharing.isAvailableAsync();

  if (!podeCompartilhar) {
    throw new Error('Compartilhamento de arquivos indisponível neste dispositivo.');
  }

  const arquivo = new File(Paths.cache, nomeArquivo);

  arquivo.create({ overwrite: true });
  arquivo.write(conteudoCsv);

  await Sharing.shareAsync(arquivo.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Exportar Inventário',
    UTI: 'public.comma-separated-values-text',
  });

  return nomeArquivo;
}
