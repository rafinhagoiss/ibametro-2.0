import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Ativo } from '../../../types/ativo';
import { registrarChamado } from './registrarChamado';

interface Props {
  ativos: Ativo[];
  usuarioLogado: string;
  visivel: boolean;
  onFechar: () => void;
}

export function AbrirChamadoModal({ ativos, usuarioLogado, visivel, onFechar }: Props) {
  const [busca, setBusca] = useState('');
  const [ativoSelecionado, setAtivoSelecionado] = useState<Ativo | null>(null);
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const ativosDisponiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    return ativos
      .filter((ativo) => !ativo.deletado)
      .filter((ativo) => (
        !texto ||
        ativo.patrimonio?.toLowerCase().includes(texto) ||
        ativo.tipo?.toLowerCase().includes(texto) ||
        ativo.setor?.toLowerCase().includes(texto)
      ))
      .slice(0, 30);
  }, [ativos, busca]);

  const fechar = () => {
    setBusca('');
    setDescricao('');
    setAtivoSelecionado(null);
    onFechar();
  };

  const salvar = async () => {
    if (!ativoSelecionado) {
      Alert.alert('Selecione o equipamento', 'Escolha o patrimônio relacionado ao problema.');
      return;
    }

    try {
      setSalvando(true);
      const resultado = await registrarChamado({
        ativo: ativoSelecionado,
        descricao,
        usuario: usuarioLogado,
      });
      fechar();
      Alert.alert(
        'Chamado aberto',
        resultado.emailEnfileirado
          ? 'O equipamento foi enviado para manutenção e a notificação de teste entrou na fila.'
          : 'O equipamento foi enviado para manutenção.',
      );
    } catch (error: any) {
      Alert.alert('Não foi possível abrir o chamado', error?.message || 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Abrir chamado</Text>
              <Text style={styles.subtitle}>Informe qual equipamento precisa de atendimento.</Text>
            </View>
            <TouchableOpacity style={styles.close} onPress={fechar}>
              <MaterialCommunityIcons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Buscar patrimônio, tipo ou setor..."
            value={busca}
            onChangeText={setBusca}
          />

          <ScrollView style={styles.list} nestedScrollEnabled>
            {ativosDisponiveis.map((ativo) => {
              const selecionado = ativoSelecionado?.id === ativo.id;

              return (
                <TouchableOpacity
                  key={ativo.id}
                  style={[styles.asset, selecionado && styles.assetSelected]}
                  onPress={() => setAtivoSelecionado(ativo)}
                >
                  <View style={styles.assetContent}>
                    <Text style={[styles.assetTitle, selecionado && styles.assetTitleSelected]}>
                      {ativo.patrimonio}
                    </Text>
                    <Text style={styles.assetMeta} numberOfLines={1}>
                      {ativo.tipo} · {ativo.setor}
                    </Text>
                  </View>
                  {selecionado && <MaterialCommunityIcons name="check-circle" size={20} color="#2563eb" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TextInput
            style={styles.description}
            placeholder="Descreva o defeito ou problema encontrado..."
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />

          <TouchableOpacity style={styles.submit} onPress={salvar} disabled={salvando}>
            <Text style={styles.submitText}>{salvando ? 'Registrando...' : 'Registrar chamado'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(15, 23, 42, 0.52)' },
  modal: { width: '100%', maxWidth: 620, maxHeight: '88%', padding: 16, borderRadius: 12, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: '#0f2742', fontSize: 18, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 3 },
  close: { padding: 6 },
  search: { minHeight: 44, marginTop: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, backgroundColor: '#f8fafc' },
  list: { maxHeight: 230, marginTop: 9, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8 },
  asset: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  assetSelected: { backgroundColor: '#eff6ff' },
  assetContent: { flex: 1 },
  assetTitle: { color: '#334155', fontSize: 13, fontWeight: '900' },
  assetTitleSelected: { color: '#1d4ed8' },
  assetMeta: { color: '#64748b', fontSize: 11, marginTop: 3 },
  description: { minHeight: 92, marginTop: 10, padding: 12, textAlignVertical: 'top', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, backgroundColor: '#f8fafc' },
  submit: { minHeight: 46, marginTop: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#2563eb' },
  submitText: { color: '#fff', fontWeight: '900' },
});
