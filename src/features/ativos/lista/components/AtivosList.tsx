import React from 'react';
import { FlatList } from 'react-native';

import type { Ativo } from '../../../../types/ativo';
import { styles } from '../styles';
import { AtivoCard } from './AtivoCard';
import { ListaEstado } from './ListaEstado';

interface AtivosListProps {
  ativos: Ativo[];
  ativosFiltrados: Ativo[];
  carregando: boolean;
  onSelecionarAtivo: (ativo: Ativo) => void;
}

export function AtivosList({
  ativos,
  ativosFiltrados,
  carregando,
  onSelecionarAtivo,
}: AtivosListProps) {
  if (carregando) {
    return <ListaEstado tipo="carregando" />;
  }

  if (ativos.length === 0) {
    return <ListaEstado tipo="vazio" />;
  }

  if (ativosFiltrados.length === 0) {
    return <ListaEstado tipo="semResultados" />;
  }

  return (
    <FlatList
      data={ativosFiltrados}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => (
        <AtivoCard ativo={item} onPress={onSelecionarAtivo} />
      )}
    />
  );
}
