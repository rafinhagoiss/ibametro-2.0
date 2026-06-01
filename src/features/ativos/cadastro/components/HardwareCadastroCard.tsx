import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Componentes } from '../../../../types/ativo';
import { NOMES_COMPONENTES } from '../../detalhe/constants';

interface Props {
  componentes: Componentes;
  onAlternar: (chave: keyof Componentes) => void;
}

export function HardwareCadastroCard({ componentes, onAlternar }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Diagnóstico de Hardware</Text>
      <Text style={styles.subtitle}>Toque em uma peça para indicar defeito.</Text>

      {(Object.keys(componentes) as Array<keyof Componentes>).map((chave) => {
        const valor = componentes[chave];

        return (
          <View key={chave} style={styles.row}>
            <Text style={styles.name}>{NOMES_COMPONENTES[chave]}</Text>
            <TouchableOpacity
              style={[styles.badge, valor === 'Defeito' && styles.badgeError]}
              onPress={() => onAlternar(chave)}
            >
              <Text style={[styles.badgeText, valor === 'Defeito' && styles.textError]}>
                {valor}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f2742',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '900' },
  subtitle: { color: '#bae6fd', fontSize: 12, marginTop: 4, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 11,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  name: { color: '#fff', fontWeight: '800', flex: 1 },
  badge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  badgeError: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  badgeText: { color: '#166534', fontSize: 12, fontWeight: '900' },
  textError: { color: '#991b1b' },
});
