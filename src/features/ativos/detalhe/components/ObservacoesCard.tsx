import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { styles } from '../styles';

interface ObservacoesCardProps {
  listaNotas: string[];
  novaObservacao: string;
  onChangeNovaObservacao: (valor: string) => void;
  onAdicionarNota: () => void;
}

export function ObservacoesCard({
  listaNotas,
  novaObservacao,
  onChangeNovaObservacao,
  onAdicionarNota,
}: ObservacoesCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>📋 Observações</Text>

      {listaNotas.map((nota, index) => (
        <Text key={`${nota}-${index}`} style={styles.nota}>
          {nota}
        </Text>
      ))}

      <TextInput
        style={styles.textArea}
        placeholder="Nova observação..."
        multiline
        value={novaObservacao}
        onChangeText={onChangeNovaObservacao}
      />

      <TouchableOpacity style={styles.btnNota} onPress={onAdicionarNota}>
        <Text style={styles.btnText}>Adicionar Nota</Text>
      </TouchableOpacity>
    </View>
  );
}
