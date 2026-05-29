import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { styles } from '../styles';

interface DashboardChamadosButtonProps {
  onPress: () => void;
}

export function DashboardChamadosButton({
  onPress,
}: DashboardChamadosButtonProps) {
  return (
    <TouchableOpacity style={styles.dashboardButton} onPress={onPress}>
      <Text style={styles.dashboardButtonText}>
        📊 Acessar Central de Chamados
      </Text>
    </TouchableOpacity>
  );
}
