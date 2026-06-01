import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Ativo } from '../../../../types/ativo';

interface Props {
  ativos: Ativo[];
  totalFiltrado: number;
}

export function ResumoInventario({ ativos, totalFiltrado }: Props) {
  const totalAtivos = ativos.filter((ativo) => !ativo.deletado).length;
  const manutencao = ativos.filter(
    (ativo) => !ativo.deletado && ativo.status === 'Manutenção',
  ).length;
  const lixeira = ativos.filter((ativo) => ativo.deletado).length;

  return (
    <View style={styles.container}>
      <Metric icon="filter-outline" label="Exibidos" value={totalFiltrado} color="#2563eb" />
      <Metric icon="package-variant-closed" label="Inventário" value={totalAtivos} color="#0f766e" />
      <Metric icon="tools" label="Manutenção" value={manutencao} color="#c2410c" />
      <Metric icon="delete-outline" label="Lixeira" value={lixeira} color="#be123c" />
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.metric}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <View>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  metric: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  value: { fontSize: 17, fontWeight: '900' },
  label: { color: '#64748b', fontSize: 10, fontWeight: '800' },
});
