import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  setores: string[];
  setorSelecionado: string;
  visivel: boolean;
  onFechar: () => void;
  onSelecionar: (setor: string) => void;
}

export function SetorFiltroModal({
  setores,
  setorSelecionado,
  visivel,
  onFechar,
  onSelecionar,
}: Props) {
  const opcoes = ['Todos os setores', ...setores];

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Selecionar setor</Text>
              <Text style={styles.subtitle}>{setores.length} setores cadastrados</Text>
            </View>
            <TouchableOpacity style={styles.close} onPress={onFechar}>
              <MaterialCommunityIcons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator>
            {opcoes.map((setor) => {
              const selecionado = setorSelecionado === setor;

              return (
                <TouchableOpacity
                  key={setor}
                  style={[styles.option, selecionado && styles.optionSelected]}
                  onPress={() => {
                    onSelecionar(setor);
                    onFechar();
                  }}
                >
                  <Text style={[styles.optionText, selecionado && styles.optionTextSelected]}>
                    {setor}
                  </Text>
                  {selecionado && (
                    <MaterialCommunityIcons name="check-circle" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '78%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { color: '#0f2742', fontSize: 17, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 3 },
  close: { padding: 6 },
  list: { marginTop: 8 },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  optionSelected: { borderRadius: 8, borderBottomWidth: 0, backgroundColor: '#eff6ff' },
  optionText: { flex: 1, color: '#475569', fontSize: 13, fontWeight: '700' },
  optionTextSelected: { color: '#1d4ed8', fontWeight: '900' },
});
