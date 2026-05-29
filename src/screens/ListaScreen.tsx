import React, { useState } from 'react';
import { Alert, SafeAreaView, StatusBar } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { collection, getDocs, query, where } from 'firebase/firestore';

import HeaderLista from '../components/HeaderLista';
import { db } from '../config/firebase';
import type { Ativo } from '../types/ativo';
import { AtivosList } from '../features/ativos/lista/components/AtivosList';
import { BuscaFiltrosAtivos } from '../features/ativos/lista/components/BuscaFiltrosAtivos';
import { DashboardChamadosButton } from '../features/ativos/lista/components/DashboardChamadosButton';
import { ExportarInventarioButton } from '../features/ativos/lista/components/ExportarInventarioButton';
import { FabNovoAtivo } from '../features/ativos/lista/components/FabNovoAtivo';
import { RelatoriosButton } from '../features/ativos/lista/components/RelatoriosButton';
import { ScannerModal } from '../features/ativos/lista/components/ScannerModal';
import { TipoAtivoModal } from '../features/ativos/lista/components/TipoAtivoModal';
import { exportarInventarioCsv } from '../features/ativos/exportacao/exportarInventarioCsv';
import type { StatusFiltroAtivo } from '../features/ativos/lista/constants';
import { useAtivos } from '../features/ativos/lista/hooks/useAtivos';
import { styles } from '../features/ativos/lista/styles';
import {
  filtrarAtivos,
  formatarPatrimonioEscaneado,
} from '../features/ativos/lista/utils';

interface ListaScreenProps {
  usuarioLogado: string;
  isAdmin: boolean;
  onSelecionarAtivo: (ativo: Ativo) => void;
  onIrParaCadastro: (
    patrimonioPrePreenchido?: string,
    tipoPreSelecionado?: string,
  ) => void;
  onIrParaRelatorios: () => void;
  onIrParaPainelChamados: () => void;
  onLogout: () => void;
}

export default function ListaScreen({
  usuarioLogado,
  isAdmin,
  onSelecionarAtivo,
  onIrParaCadastro,
  onIrParaRelatorios,
  onIrParaPainelChamados,
  onLogout,
}: ListaScreenProps) {
  const { ativos, carregando, setCarregando } = useAtivos();
  const [busca, setBusca] = useState('');
  const [statusSelecionado, setStatusSelecionado] =
    useState<StatusFiltroAtivo>('Todos');
  const [modalScannerVisivel, setModalScannerVisivel] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scaneado, setScaneado] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [modalTipoVisivel, setModalTipoVisivel] = useState(false);

  const ativosFiltrados = filtrarAtivos(ativos, busca, statusSelecionado);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScaneado(true);
    setModalScannerVisivel(false);

    const patrimonioFormatado = formatarPatrimonioEscaneado(data);

    try {
      setCarregando(true);

      const q = query(
        collection(db, 'ativos'),
        where('patrimonio', '==', patrimonioFormatado),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docEncontrado = querySnapshot.docs[0];
        const ativoEncontrado = {
          id: docEncontrado.id,
          ...docEncontrado.data(),
        } as Ativo;

        if (ativoEncontrado.deletado === true) {
          Alert.alert(
            'Ativo Arquivado',
            `O patrimônio "${patrimonioFormatado}" está na Lixeira do sistema e não pode ser acessado por técnicos comuns.`,
          );
          return;
        }

        onSelecionarAtivo(ativoEncontrado);
      } else {
        Alert.alert(
          'Equipamento não cadastrado',
          `O patrimônio "${patrimonioFormatado}" não foi encontrado. Deseja cadastrá-lo agora?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Cadastrar',
              onPress: () =>
                isAdmin
                  ? onIrParaCadastro(patrimonioFormatado)
                  : Alert.alert(
                      'Cadastro restrito',
                      'Solicite o cadastro a um administrador.',
                    ),
            },
          ],
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar o código no banco.');
      console.error(error);
    } finally {
      setCarregando(false);
      setScaneado(false);
    }
  };

  const abrirScanner = async () => {
    if (!permission?.granted) {
      const permissaoCamera = await requestPermission();

      if (!permissaoCamera.granted) {
        Alert.alert(
          'Permissão Negada',
          'Precisamos de acesso à câmera para ler os códigos.',
        );
        return;
      }
    }

    setScaneado(false);
    setModalScannerVisivel(true);
  };

  const handleExportarInventario = async () => {
    try {
      setExportando(true);

      const nomeArquivo = await exportarInventarioCsv(ativos);

      Alert.alert(
        'Inventário exportado',
        `Arquivo gerado: ${nomeArquivo}\nTotal de ativos: ${ativos.length}`,
      );
    } catch (error: any) {
      Alert.alert(
        'Erro ao exportar',
        error?.message || 'Não foi possível exportar o inventário.',
      );
    } finally {
      setExportando(false);
    }
  };

  const handleSelecionarTipoCadastro = (tipo: string) => {
    setModalTipoVisivel(false);
    onIrParaCadastro(undefined, tipo);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <HeaderLista
        usuarioLogado={usuarioLogado}
        isAdmin={isAdmin}
        onPressScan={abrirScanner}
        onPressAdd={() => setModalTipoVisivel(true)}
        onLogout={onLogout}
      />

      <DashboardChamadosButton onPress={onIrParaPainelChamados} />

      {isAdmin && (
        <>
          <ExportarInventarioButton
            exportando={exportando}
            onPress={handleExportarInventario}
          />

          <RelatoriosButton onPress={onIrParaRelatorios} />
        </>
      )}

      <BuscaFiltrosAtivos
        busca={busca}
        statusSelecionado={statusSelecionado}
        onChangeBusca={setBusca}
        onChangeStatus={setStatusSelecionado}
      />

      <AtivosList
        ativos={ativos}
        ativosFiltrados={ativosFiltrados}
        carregando={carregando}
        onSelecionarAtivo={onSelecionarAtivo}
      />

      <ScannerModal
        visivel={modalScannerVisivel}
        scaneado={scaneado}
        onBarcodeScanned={handleBarCodeScanned}
        onFechar={() => setModalScannerVisivel(false)}
      />

      <TipoAtivoModal
        visivel={modalTipoVisivel}
        onFechar={() => setModalTipoVisivel(false)}
        onSelecionarTipo={handleSelecionarTipoCadastro}
      />

      {isAdmin && <FabNovoAtivo onPress={() => setModalTipoVisivel(true)} />}
    </SafeAreaView>
  );
}
