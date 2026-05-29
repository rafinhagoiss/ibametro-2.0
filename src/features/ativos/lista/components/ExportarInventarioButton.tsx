import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { styles } from '../styles';

interface ExportarInventarioButtonProps {
  exportando: boolean;
  onPress: () => void;
}

export function ExportarInventarioButton({
  exportando,
  onPress,
}: ExportarInventarioButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.exportButton, exportando && styles.exportButtonDisabled]}
      onPress={onPress}
      disabled={exportando}
    >
      <Text style={styles.exportButtonText}>
        {exportando ? 'Exportando inventário...' : 'Exportar Inventário'}
      </Text>
    </TouchableOpacity>
  );
}
