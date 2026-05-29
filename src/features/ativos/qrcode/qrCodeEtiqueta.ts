import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { toDataURL } from 'qrcode';

interface DadosEtiquetaQrCode {
  patrimonio: string;
  tipo?: string;
  setor?: string;
}

export async function gerarQrCodeDataUrl(texto: string) {
  return toDataURL(texto, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    type: 'image/png',
  });
}

function limparNomeArquivo(valor: string) {
  return valor.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function extrairBase64(dataUrl: string) {
  return dataUrl.replace(/^data:image\/png;base64,/, '');
}

function baixarImagemNoNavegador(dataUrl: string, nomeArquivo: string) {
  const navegador = globalThis as any;

  if (!navegador.document) {
    throw new Error('Download indisponível neste navegador.');
  }

  const link = navegador.document.createElement('a');

  link.href = dataUrl;
  link.download = nomeArquivo;
  link.style.display = 'none';

  navegador.document.body.appendChild(link);
  link.click();
  navegador.document.body.removeChild(link);
}

function montarHtmlEtiqueta({
  patrimonio,
  tipo,
  setor,
  qrCodeDataUrl,
}: DadosEtiquetaQrCode & { qrCodeDataUrl: string }) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            padding: 24px;
            font-family: Arial, sans-serif;
            color: #111827;
          }
          .etiqueta {
            width: 320px;
            min-height: 420px;
            border: 2px solid #111827;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
          }
          .orgao {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }
          .qr {
            width: 220px;
            height: 220px;
            margin: 8px auto 16px;
          }
          .patrimonio {
            font-size: 22px;
            font-weight: 800;
            margin-bottom: 10px;
          }
          .info {
            font-size: 13px;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="etiqueta">
          <div class="orgao">IBAMETRO - PATRIMÔNIO</div>
          <img class="qr" src="${qrCodeDataUrl}" />
          <div class="patrimonio">${patrimonio}</div>
          ${tipo ? `<div class="info">${tipo}</div>` : ''}
          ${setor ? `<div class="info">${setor}</div>` : ''}
        </div>
      </body>
    </html>
  `;
}

export async function imprimirEtiquetaQrCode(dados: DadosEtiquetaQrCode) {
  const qrCodeDataUrl = await gerarQrCodeDataUrl(dados.patrimonio);

  await Print.printAsync({
    html: montarHtmlEtiqueta({
      ...dados,
      qrCodeDataUrl,
    }),
  });
}

export async function compartilharImagemQrCode(dados: DadosEtiquetaQrCode) {
  const qrCodeDataUrl = await gerarQrCodeDataUrl(dados.patrimonio);
  const nomeArquivo = `qrcode_${limparNomeArquivo(dados.patrimonio)}.png`;

  if (Platform.OS === 'web') {
    baixarImagemNoNavegador(qrCodeDataUrl, nomeArquivo);
    return nomeArquivo;
  }

  const podeCompartilhar = await Sharing.isAvailableAsync();

  if (!podeCompartilhar) {
    throw new Error('Compartilhamento indisponível neste dispositivo.');
  }

  const caminhoArquivo = `${FileSystem.cacheDirectory}${nomeArquivo}`;

  await FileSystem.writeAsStringAsync(caminhoArquivo, extrairBase64(qrCodeDataUrl), {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Sharing.shareAsync(caminhoArquivo, {
    mimeType: 'image/png',
    dialogTitle: 'Salvar ou enviar QR Code',
    UTI: 'public.png',
  });

  return nomeArquivo;
}
