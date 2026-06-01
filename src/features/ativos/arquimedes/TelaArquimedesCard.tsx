import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { StatusTela } from '../../../types/ativo';

interface Props {
  tela: StatusTela;
  onChangeTela: (status: StatusTela) => void;
}

export function TelaArquimedesCard({ tela, onChangeTela }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tela do Arquimedes</Text>
      <Text style={styles.subtitle}>
        Registre danos no monitor integrado do computador all-in-one.
      </Text>
      <View style={styles.row}>
        {(['OK', 'Danificada'] as StatusTela[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.option, tela === status && styles.optionSelected]}
            onPress={() => onChangeTela(status)}
          >
            <Text style={[styles.text, tela === status && styles.textSelected]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  title: { color: '#0f2742', fontSize: 16, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 4, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fbff',
  },
  optionSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  text: { color: '#2563eb', fontWeight: '900' },
  textSelected: { color: '#fff' },
});
