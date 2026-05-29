import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  compartilharImagemQrCode,
  gerarQrCodeDataUrl,
  imprimirEtiquetaQrCode,
} from '../qrCodeEtiqueta';

interface QrCodePatrimonioCardProps {
  patrimonio: string;
  tipo: string;
  setor: string;
}

export function QrCodePatrimonioCard({
  patrimonio,
  tipo,
  setor,
}: QrCodePatrimonioCardProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const patrimonioFormatado = useMemo(
    () => patrimonio.trim().toUpperCase(),
    [patrimonio],
  );

  useEffect(() => {
    let ativo = true;

    async function gerarQrCode() {
      if (!patrimonioFormatado) {
        setQrCodeDataUrl('');
        return;
      }

      try {
        setCarregando(true);
        const dataUrl = await gerarQrCodeDataUrl(patrimonioFormatado);

        if (ativo) {
          setQrCodeDataUrl(dataUrl);
        }
      } catch (error) {
        if (ativo) {
          setQrCodeDataUrl('');
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    gerarQrCode();

    return () => {
      ativo = false;
    };
  }, [patrimonioFormatado]);

  const dadosEtiqueta = {
    patrimonio: patrimonioFormatado,
    tipo: tipo.trim(),
    setor: setor.trim(),
  };

  const handleImprimir = async () => {
    try {
      setProcessandoAcao(true);
      await imprimirEtiquetaQrCode(dadosEtiqueta);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível imprimir o QR Code.');
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleCompartilharImagem = async () => {
    try {
      setProcessandoAcao(true);
      const nomeArquivo = await compartilharImagemQrCode(dadosEtiqueta);
      Alert.alert('QR Code gerado', `Arquivo: ${nomeArquivo}`);
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível salvar ou enviar o QR Code.',
      );
    } finally {
      setProcessandoAcao(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>QR Code do Patrimônio</Text>
      <Text style={styles.subtitle}>
        Gere a etiqueta a partir do número informado acima.
      </Text>

      <View style={styles.qrBox}>
        {!patrimonioFormatado ? (
          <Text style={styles.placeholder}>
            Informe o patrimônio para gerar o QR Code.
          </Text>
        ) : carregando ? (
          <ActivityIndicator color="#2f6ea8" />
        ) : qrCodeDataUrl ? (
          <Image source={{ uri: qrCodeDataUrl }} style={styles.qrImage} />
        ) : (
          <Text style={styles.placeholder}>Não foi possível gerar o QR Code.</Text>
        )}
      </View>

      {patrimonioFormatado ? (
        <Text style={styles.codigoText}>{patrimonioFormatado}</Text>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, processandoAcao && styles.disabledButton]}
          onPress={handleImprimir}
          disabled={!qrCodeDataUrl || processandoAcao}
        >
          <Text style={styles.actionButtonText}>Imprimir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.secondaryButton,
            processandoAcao && styles.disabledButton,
          ]}
          onPress={handleCompartilharImagem}
          disabled={!qrCodeDataUrl || processandoAcao}
        >
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Salvar/Enviar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 14,
  },
  qrBox: {
    minHeight: 190,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  qrImage: {
    width: 170,
    height: 170,
  },
  placeholder: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 13,
  },
  codigoText: {
    textAlign: 'center',
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2f6ea8',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2f6ea8',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#2f6ea8',
  },
});
