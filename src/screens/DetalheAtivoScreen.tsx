import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '../config/firebase';
import type { Ativo, Componentes, InfraAtivo } from '../types/ativo';
import { AdminAtivoActionsCard } from '../features/ativos/detalhe/components/AdminAtivoActionsCard';
import { registrarHistoricoAtivo } from '../features/ativos/historico/registrarHistoricoAtivo';
import { AtivoResumoCard } from '../features/ativos/detalhe/components/AtivoResumoCard';
import { DetalheHeader } from '../features/ativos/detalhe/components/DetalheHeader';
import { HardwareCard } from '../features/ativos/detalhe/components/HardwareCard';
import { InfraestruturaCard } from '../features/ativos/detalhe/components/InfraestruturaCard';
import { ObservacoesCard } from '../features/ativos/detalhe/components/ObservacoesCard';
import { ResponsavelCard } from '../features/ativos/detalhe/components/ResponsavelCard';
import { SalvarAlteracoesButton } from '../features/ativos/detalhe/components/SalvarAlteracoesButton';
import { SwitchPortasCard } from '../features/ativos/switches/SwitchPortasCard';
import { COMPONENTES_PADRAO } from '../features/ativos/detalhe/constants';
import { styles } from '../features/ativos/detalhe/styles';
import {
  ativoEhComputador,
  ativoEhSwitch,
  calcularStatusAtivo,
  descricaoParaNotas,
  gerarCarimbo,
  notasParaDescricao,
} from '../features/ativos/detalhe/utils';

interface Props {
  ativo: Ativo | null;
  isAdmin: boolean;
  usuarioLogado: string;
  onVoltar: () => void;
}

const INFRA_PADRAO: InfraAtivo = {
  hostname: '',
  ip: '',
  mac: '',
  vlan: '',
  portaSwitch: '',
};

function confirmarAcao(
  titulo: string,
  mensagem: string,
  textoConfirmar: string,
  onConfirmar: () => void,
) {
  if (Platform.OS === 'web') {
    const confirmou = globalThis.confirm(`${titulo}\n\n${mensagem}`);

    if (confirmou) {
      onConfirmar();
    }

    return;
  }

  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: textoConfirmar,
      style: 'destructive',
      onPress: onConfirmar,
    },
  ]);
}

export default function DetalheAtivoScreen({
  ativo,
  isAdmin,
  usuarioLogado,
  onVoltar,
}: Props) {
  const [salvando, setSalvando] = useState(false);
  const [statusGeral, setStatusGeral] = useState('Disponível');
  const [componentes, setComponentes] =
    useState<Componentes>(COMPONENTES_PADRAO);
  const [responsavel, setResponsavel] = useState('');
  const [matricula, setMatricula] = useState('');
  const [infra, setInfra] = useState<InfraAtivo>(INFRA_PADRAO);
  const [totalPortas, setTotalPortas] = useState('');
  const [portasUsadas, setPortasUsadas] = useState('');
  const [portasOcupadas, setPortasOcupadas] = useState<number[]>([]);
  const [listaNotas, setListaNotas] = useState<string[]>([]);
  const [novaObservacao, setNovaObservacao] = useState('');

  useEffect(() => {
    if (!ativo) {
      return;
    }

    setStatusGeral(ativo.status || 'Disponível');
    setResponsavel(ativo.responsavel || '');
    setMatricula(ativo.matricula || '');
    setComponentes({
      ...COMPONENTES_PADRAO,
      ...(ativo.componentes || {}),
    });
    setInfra({
      hostname: ativo.hostname || '',
      ip: ativo.ip || '',
      mac: ativo.mac || '',
      vlan: ativo.vlan || '',
      portaSwitch: ativo.portaSwitch || '',
    });
    setTotalPortas(ativo.totalPortas ? String(ativo.totalPortas) : '');
    setPortasUsadas(ativo.portasUsadas ? String(ativo.portasUsadas) : '');
    setPortasOcupadas(
      Array.isArray(ativo.portasOcupadas)
        ? ativo.portasOcupadas
        : [],
    );
    setListaNotas(descricaoParaNotas(ativo.descricao));
  }, [ativo]);

  if (!ativo) {
    return (
      <View style={styles.center}>
        <Text>Nenhum ativo selecionado.</Text>
      </View>
    );
  }

  const ehComputador = ativoEhComputador(ativo.tipo);
  const ehSwitch = ativoEhSwitch(ativo.tipo);

  const handleChangeInfra = (campo: keyof InfraAtivo, valor: string) => {
    setInfra((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleAlternarComponente = (chave: keyof Componentes) => {
    setComponentes((prev) => {
      const novos = {
        ...prev,
        [chave]: prev[chave] === 'OK' ? 'Defeito' : 'OK',
      };

      setStatusGeral(calcularStatusAtivo(novos, responsavel));

      return novos;
    });
  };

  const adicionarNota = async () => {
    if (novaObservacao.trim() === '') {
      return;
    }

    const novaLista = [
      ...listaNotas,
      `${gerarCarimbo(usuarioLogado)} ${novaObservacao}`,
    ];

    setListaNotas(novaLista);
    setNovaObservacao('');

    try {
      await updateDoc(doc(db, 'ativos', ativo.id), {
        descricao: notasParaDescricao(novaLista),
      });
      await registrarHistoricoAtivo({
        ativoId: ativo.id,
        patrimonio: ativo.patrimonio,
        acao: 'Observação adicionada',
        usuario: usuarioLogado,
        detalhes: novaObservacao,
      });
    } catch (e) {
      Alert.alert('Erro', 'Falha ao salvar nota.');
    }
  };

  const salvarAlteracoes = async () => {
    try {
      setSalvando(true);

      const statusFinal = calcularStatusAtivo(componentes, responsavel);
      const manterDataManutencao =
        ativo.status === 'Manutenção' && ativo.dataManutencao;

      await updateDoc(doc(db, 'ativos', ativo.id), {
        status: statusFinal,
        dataManutencao:
          statusFinal === 'Manutenção'
            ? manterDataManutencao || serverTimestamp()
            : null,
        componentes: ehComputador ? componentes : null,
        responsavel: responsavel.trim(),
        matricula: matricula.trim(),
        hostname: infra.hostname,
        ip: infra.ip,
        mac: infra.mac,
        vlan: infra.vlan,
        portaSwitch: infra.portaSwitch,
        totalPortas:
          ehSwitch && totalPortas
            ? Number(totalPortas)
            : null,
        portasUsadas:
          ehSwitch && portasUsadas
            ? Number(portasUsadas)
            : null,
        portasOcupadas:
          ehSwitch
            ? portasOcupadas
            : [],
        atualizadoPor: usuarioLogado,
        dataAtualizacao: serverTimestamp(),
        descricao: notasParaDescricao(listaNotas),
      });

      Alert.alert('Sucesso', 'Alterações salvas.');
      await registrarHistoricoAtivo({
        ativoId: ativo.id,
        patrimonio: ativo.patrimonio,
        acao: 'Ficha atualizada',
        usuario: usuarioLogado,
        detalhes: `Status: ${statusFinal} | Responsável: ${responsavel.trim() || 'Sem responsável'}`,
      });

      onVoltar();
    } catch (e) {
      Alert.alert('Erro', 'Falha ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const enviarParaLixeira = () => {
    confirmarAcao(
      'Enviar para Lixeira',
      `Deseja enviar "${ativo.patrimonio}" para a Lixeira?`,
      'Enviar',
      async () => {
        try {
          await updateDoc(doc(db, 'ativos', ativo.id), {
            deletado: true,
            atualizadoPor: usuarioLogado,
            dataAtualizacao: serverTimestamp(),
          });
          await registrarHistoricoAtivo({
            ativoId: ativo.id,
            patrimonio: ativo.patrimonio,
            acao: 'Enviado para Lixeira',
            usuario: usuarioLogado,
          });
          Alert.alert('Pronto', 'Ativo enviado para a Lixeira.');
          onVoltar();
        } catch (e) {
          Alert.alert('Erro', 'Não foi possível enviar para a Lixeira.');
        }
      },
    );
  };

  const restaurarDaLixeira = async () => {
    try {
      await updateDoc(doc(db, 'ativos', ativo.id), {
        deletado: false,
        atualizadoPor: usuarioLogado,
        dataAtualizacao: serverTimestamp(),
      });
      await registrarHistoricoAtivo({
        ativoId: ativo.id,
        patrimonio: ativo.patrimonio,
        acao: 'Restaurado da Lixeira',
        usuario: usuarioLogado,
      });
      Alert.alert('Pronto', 'Ativo restaurado.');
      onVoltar();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível restaurar o ativo.');
    }
  };

  const excluirDefinitivo = () => {
    confirmarAcao(
      'Excluir definitivamente',
      `Essa ação remove "${ativo.patrimonio}" do banco. Deseja continuar?`,
      'Excluir',
      async () => {
        try {
          await registrarHistoricoAtivo({
            ativoId: ativo.id,
            patrimonio: ativo.patrimonio,
            acao: 'Excluído definitivamente',
            usuario: usuarioLogado,
          });
          await deleteDoc(doc(db, 'ativos', ativo.id));
          Alert.alert('Pronto', 'Ativo excluído definitivamente.');
          onVoltar();
        } catch (e) {
          Alert.alert('Erro', 'Não foi possível excluir o ativo.');
        }
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <DetalheHeader onVoltar={onVoltar} />

      <ScrollView contentContainerStyle={styles.content}>
        <AtivoResumoCard ativo={ativo} statusGeral={statusGeral} />

        <ResponsavelCard
          responsavel={responsavel}
          matricula={matricula}
          onChangeResponsavel={setResponsavel}
          onChangeMatricula={setMatricula}
        />

        <InfraestruturaCard infra={infra} onChangeInfra={handleChangeInfra} />

        {ehSwitch && (
          <SwitchPortasCard
            totalPortas={totalPortas}
            portasUsadas={portasUsadas}
            portasOcupadas={portasOcupadas}
            onChangeTotalPortas={setTotalPortas}
            onChangePortasUsadas={setPortasUsadas}
            onChangePortasOcupadas={setPortasOcupadas}
          />
        )}

        {ehComputador && (
          <HardwareCard
            componentes={componentes}
            onAlternarComponente={handleAlternarComponente}
          />
        )}

        <ObservacoesCard
          listaNotas={listaNotas}
          novaObservacao={novaObservacao}
          onChangeNovaObservacao={setNovaObservacao}
          onAdicionarNota={adicionarNota}
        />

        <SalvarAlteracoesButton
          salvando={salvando}
          onPress={salvarAlteracoes}
        />

        {isAdmin && (
          <AdminAtivoActionsCard
            deletado={ativo.deletado}
            onEnviarParaLixeira={enviarParaLixeira}
            onRestaurar={restaurarDaLixeira}
            onExcluirDefinitivo={excluirDefinitivo}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
