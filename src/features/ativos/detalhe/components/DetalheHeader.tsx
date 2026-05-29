import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { styles } from '../styles';

interface DetalheHeaderProps {
  onVoltar: () => void;
}

export function DetalheHeader({ onVoltar }: DetalheHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onVoltar}>
        <Text style={styles.back}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Ficha do Ativo</Text>

      <View style={{ width: 70 }} />
    </View>
  );
}
