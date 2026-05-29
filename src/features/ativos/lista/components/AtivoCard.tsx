import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { Ativo } from '../../../../types/ativo';
import { styles } from '../styles';
import { getStatusStyle } from '../utils';

interface AtivoCardProps {
  ativo: Ativo;
  onPress: (ativo: Ativo) => void;
}

export function AtivoCard({ ativo, onPress }: AtivoCardProps) {
  const badge = ativo.deletado
    ? getStatusStyle('Lixeira')
    : getStatusStyle(ativo.status);
  const statusTexto = ativo.deletado ? 'Apagado' : ativo.status;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(ativo)}>
      <View style={styles.cardHeader}>
        <Text style={styles.patrimonioText}>{ativo.patrimonio}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>
            {statusTexto}
          </Text>
        </View>
      </View>

      <Text style={styles.tipoText}>{ativo.tipo}</Text>

      <View style={styles.cardFooterRow}>
        <Text style={styles.setorText}>📍 {ativo.setor}</Text>

        {ativo.responsavel ? (
          <Text style={styles.responsavelCardText} numberOfLines={1}>
            🧑‍💻 {ativo.responsavel}
          </Text>
        ) : (
          <Text
            style={[styles.responsavelCardText, styles.responsavelVazioText]}
          >
            📦 Estoque
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
