import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { styles } from '../styles';

interface RelatoriosButtonProps {
  onPress: () => void;
}

export function RelatoriosButton({ onPress }: RelatoriosButtonProps) {
  return (
    <TouchableOpacity style={styles.reportButton} onPress={onPress}>
      <Text style={styles.reportButtonText}>Relatórios e Filtros</Text>
    </TouchableOpacity>
  );
}
