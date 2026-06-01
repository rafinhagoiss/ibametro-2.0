import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { styles } from '../styles';

export function UsuariosButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.usersButton} onPress={onPress}>
      <Text style={styles.usersButtonText}>Gerenciar Usuários</Text>
    </TouchableOpacity>
  );
}
