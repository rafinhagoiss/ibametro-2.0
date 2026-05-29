import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { styles } from '../styles';

interface FabNovoAtivoProps {
  onPress: () => void;
}

export function FabNovoAtivo({ onPress }: FabNovoAtivoProps) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <Text style={styles.fabText}>+</Text>
    </TouchableOpacity>
  );
}
