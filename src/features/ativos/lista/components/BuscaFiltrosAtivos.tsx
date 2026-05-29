import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { STATUS_FILTROS, type StatusFiltroAtivo } from '../constants';
import { styles } from '../styles';
import { getStatusStyle } from '../utils';

interface BuscaFiltrosAtivosProps {
  busca: string;
  statusSelecionado: StatusFiltroAtivo;
  onChangeBusca: (valor: string) => void;
  onChangeStatus: (status: StatusFiltroAtivo) => void;
}

export function BuscaFiltrosAtivos({
  busca,
  statusSelecionado,
  onChangeBusca,
  onChangeStatus,
}: BuscaFiltrosAtivosProps) {
  return (
    <View style={styles.searchFilterContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="🔎 Buscar por patrimônio, técnico ou funcionário..."
        placeholderTextColor="#94a3b8"
        value={busca}
        onChangeText={onChangeBusca}
        clearButtonMode="while-editing"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContentContainer}
      >
        {STATUS_FILTROS.map((status) => {
          const isActive = statusSelecionado === status;
          const statusStyle = getStatusStyle(status);
          const filtroLabel = status === 'Lixeira' ? '🗑️ Lixeira' : status;

          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterPill,
                isActive && styles.filterPillActive,
                isActive &&
                  status !== 'Todos' && {
                    backgroundColor: statusStyle.bg,
                    borderColor: statusStyle.text,
                  },
              ]}
              onPress={() => onChangeStatus(status)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive,
                  isActive &&
                    status !== 'Todos' && {
                      color: statusStyle.text,
                    },
                ]}
              >
                {filtroLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
