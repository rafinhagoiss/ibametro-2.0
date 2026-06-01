import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { Platform } from 'react-native';

import { db } from '../../../config/firebase';
import type { Componentes } from '../../../types/ativo';

type LinhaCsv = Record<string, string>;

const COMPONENTES_OK: Componentes = {
  memoriaRam: 'OK',
  placaMae: 'OK',
  armazenamento: 'OK',
  fonte: 'OK',
};

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function detectarSeparador(conteudo: string) {
  const primeiraLinha = conteudo.split(/\r?\n/, 1)[0] || '';
  return primeiraLinha.split(';').length >= primeiraLinha.split(',').length
    ? ';'
    : ',';
}

export function lerCsv(conteudoOriginal: string) {
  const conteudo = conteudoOriginal.replace(/^\uFEFF/, '');
  const separador = detectarSeparador(conteudo);
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = '';
  let dentroDeAspas = false;

  for (let indice = 0; indice < conteudo.length; indice += 1) {
    const caractere = conteudo[indice];
    const proximo = conteudo[indice + 1];

    if (caractere === '"' && dentroDeAspas && proximo === '"') {
      campo += '"';
      indice += 1;
    } else if (caractere === '"') {
      dentroDeAspas = !dentroDeAspas;
    } else if (caractere === separador && !dentroDeAspas) {
      linha.push(campo.trim());
      campo = '';
    } else if ((caractere === '\n' || caractere === '\r') && !dentroDeAspas) {
      if (caractere === '\r' && proximo === '\n') indice += 1;
      linha.push(campo.trim());
      campo = '';
      if (linha.some(Boolean)) linhas.push(linha);
      linha = [];
    } else {
      campo += caractere;
    }
  }

  linha.push(campo.trim());
  if (linha.some(Boolean)) linhas.push(linha);

  const [cabecalho = [], ...dados] = linhas;
  const chaves = cabecalho.map(normalizar);

  return dados.map((valores) =>
    chaves.reduce<LinhaCsv>((resultado, chave, indice) => {
      resultado[chave] = valores[indice] || '';
      return resultado;
    }, {}),
  );
}

function obter(linha: LinhaCsv, ...nomes: string[]) {
  for (const nome of nomes) {
    const valor = linha[normalizar(nome)];
    if (valor) return valor.trim();
  }

  return '';
}

function obterComponentes(situacao: string): Componentes {
  return {
    ...COMPONENTES_OK,
    fonte: /fonte/i.test(situacao) ? 'Defeito' : 'OK',
    armazenamento: /hd|ssd|armazenamento/i.test(situacao) ? 'Defeito' : 'OK',
  };
}

function obterStatus(situacao: string) {
  return /não liga|nao liga|defeito|falha|corrompido|sem vídeo|sem video|travando|danificad/i.test(
    situacao,
  )
    ? 'Manutenção'
    : /falta de funcionário|falta de funcionario|disponível|disponivel/i.test(
        situacao,
      )
      ? 'Disponível'
      : 'Ativo';
}

function escolherArquivoCsv() {
  if (Platform.OS !== 'web') {
    throw new Error('A seleção de planilha está disponível na versão web.');
  }

  const navegador = globalThis as any;

  return new Promise<{ nome: string; conteudo: string }>((resolve, reject) => {
    const input = navegador.document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.style.display = 'none';
    navegador.document.body.appendChild(input);

    input.onchange = async () => {
      const arquivo = input.files?.[0];
      input.remove();

      if (!arquivo) {
        reject(new Error('Nenhum arquivo foi selecionado.'));
        return;
      }

      if (!arquivo.name.toLowerCase().endsWith('.csv')) {
        reject(new Error('Escolha um arquivo CSV. No Excel, use Salvar como > CSV UTF-8.'));
        return;
      }

      resolve({ nome: arquivo.name, conteudo: await arquivo.text() });
    };

    input.click();
  });
}

export async function importarPlanilhaCsv(usuario: string) {
  const arquivo = await escolherArquivoCsv();
  const linhas = lerCsv(arquivo.conteudo);

  if (linhas.length === 0) {
    throw new Error('A planilha não possui equipamentos.');
  }

  const snapshot = await getDocs(collection(db, 'ativos'));
  const patrimoniosExistentes = new Set(
    snapshot.docs.map((item) => String(item.data().patrimonio || '').toUpperCase()),
  );
  let batch = writeBatch(db);
  let itensNoBatch = 0;
  let importados = 0;
  let ignorados = 0;
  let invalidos = 0;

  const salvarLote = async () => {
    if (itensNoBatch === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    itensNoBatch = 0;
  };

  for (const linha of linhas) {
    const patrimonio = obter(
      linha,
      'patrimônio anonimizado',
      'patrimonio anonimizado',
      'patrimônio',
      'patrimonio',
    ).toUpperCase();
    const tipo = obter(linha, 'equipamento', 'tipo');
    const setor = obter(linha, 'setor');

    if (!patrimonio || !tipo || !setor) {
      invalidos += 1;
      continue;
    }

    if (patrimoniosExistentes.has(patrimonio)) {
      ignorados += 1;
      continue;
    }

    const modelo = obter(linha, 'modelo/descrição', 'modelo/descricao', 'modelo');
    const situacao = obter(linha, 'status', 'situação', 'situacao') || 'Ativo';
    const observacao = obter(linha, 'observação', 'observacao', 'observações', 'observacoes');
    const ipOriginal = obter(linha, 'ip');
    const ip = /não se aplica|nao se aplica/i.test(ipOriginal) ? '' : ipOriginal;
    const ehComputador = /computador|notebook|pc|arquimedes/i.test(tipo);
    const ehArquimedes = /arquimedes/i.test(tipo);
    const ehSwitch = /switch|hub|roteador/i.test(tipo);
    const portasModelo = modelo.match(/(\d+)\s*portas?/i);
    const status = obterStatus(situacao);
    const ativoRef = doc(collection(db, 'ativos'));

    batch.set(ativoRef, {
      patrimonio,
      tipo,
      setor,
      status,
      descricao: [
        modelo && `Modelo: ${modelo}`,
        `Situação original: ${situacao}`,
        observacao,
      ].filter(Boolean).join('\n'),
      componentes: ehComputador ? obterComponentes(situacao) : null,
      tela: ehArquimedes ? (/tela|vídeo|video/i.test(situacao) ? 'Danificada' : 'OK') : null,
      ip,
      hostname: obter(linha, 'hostname'),
      mac: obter(linha, 'mac').toUpperCase(),
      responsavel: obter(linha, 'responsável', 'responsavel'),
      contato: obter(linha, 'contato', 'telefone'),
      totalPortas: ehSwitch && portasModelo ? Number(portasModelo[1]) : null,
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
      acao: 'Importado de planilha CSV',
      usuario,
      detalhes: `Arquivo: ${arquivo.nome} | Tipo: ${tipo} | Setor: ${setor}`,
      data: serverTimestamp(),
    });
    patrimoniosExistentes.add(patrimonio);
    importados += 1;
    itensNoBatch += 1;

    if (itensNoBatch >= 200) await salvarLote();
  }

  await salvarLote();

  return {
    arquivo: arquivo.nome,
    total: linhas.length,
    importados,
    ignorados,
    invalidos,
  };
}
