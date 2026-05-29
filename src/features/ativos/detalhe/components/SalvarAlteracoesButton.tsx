import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

import { styles } from '../styles';

interface SalvarAlteracoesButtonProps {
  salvando: boolean;
  onPress: () => void;
}

export function SalvarAlteracoesButton({
  salvando,
  onPress,
}: SalvarAlteracoesButtonProps) {
  return (
    <TouchableOpacity style={styles.btnSalvar} onPress={onPress}>
      {salvando ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.btnSalvarText}>Salvar Alterações</Text>
      )}
    </TouchableOpacity>
  );
}
