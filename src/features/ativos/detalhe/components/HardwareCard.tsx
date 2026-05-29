import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { Componentes } from '../../../../types/ativo';
import { NOMES_COMPONENTES } from '../constants';
import { styles } from '../styles';

interface HardwareCardProps {
  componentes: Componentes;
  onAlternarComponente: (chave: keyof Componentes) => void;
}

export function HardwareCard({
  componentes,
  onAlternarComponente,
}: HardwareCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>🩺 Hardware</Text>

      {(Object.keys(componentes) as Array<keyof Componentes>).map((chave) => {
        const valorComponente = componentes[chave];

        return (
          <TouchableOpacity
            key={chave}
            style={styles.componentRow}
            onPress={() => onAlternarComponente(chave)}
          >
            <Text style={styles.componentName}>{NOMES_COMPONENTES[chave]}</Text>
            <Text
              style={valorComponente === 'OK' ? styles.ok : styles.defeito}
            >
              {valorComponente}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
