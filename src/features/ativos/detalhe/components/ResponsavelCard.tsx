import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { styles } from '../styles';

interface ResponsavelCardProps {
  responsavel: string;
  matricula: string;
  onChangeResponsavel: (valor: string) => void;
  onChangeMatricula: (valor: string) => void;
}

export function ResponsavelCard({
  responsavel,
  matricula,
  onChangeResponsavel,
  onChangeMatricula,
}: ResponsavelCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>🤝 Responsável</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={responsavel}
        onChangeText={onChangeResponsavel}
      />

      <TextInput
        style={styles.input}
        placeholder="Matrícula"
        value={matricula}
        onChangeText={onChangeMatricula}
      />
    </View>
  );
}
