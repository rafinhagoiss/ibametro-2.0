import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { styles } from '../styles';

interface Props {
  importando: boolean;
  onPress: () => void;
}

export function ImportarInventarioButton({ importando, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.importButton, importando && styles.exportButtonDisabled]}
      onPress={onPress}
      disabled={importando}
    >
      <Text style={styles.importButtonText}>
        {importando ? 'Importando equipamentos...' : 'Importar planilha inicial'}
      </Text>
    </TouchableOpacity>
  );
}
