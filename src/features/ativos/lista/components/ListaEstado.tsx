import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { styles } from '../styles';

interface ListaEstadoProps {
  tipo: 'carregando' | 'vazio' | 'semResultados';
}

const mensagens = {
  carregando: 'Carregando inventário...',
  vazio: 'Nenhum equipamento cadastrado ainda.',
  semResultados: 'Nenhum equipamento corresponde aos filtros. 🔎',
};

export function ListaEstado({ tipo }: ListaEstadoProps) {
  return (
    <View style={styles.centerContainer}>
      {tipo === 'carregando' && (
        <ActivityIndicator size="large" color="#2f6ea8" />
      )}
      <Text style={tipo === 'carregando' ? styles.loadingText : styles.emptyText}>
        {mensagens[tipo]}
      </Text>
    </View>
  );
}
