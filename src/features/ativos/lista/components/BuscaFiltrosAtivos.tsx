import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { STATUS_FILTROS, type StatusFiltroAtivo } from '../constants';
import { styles } from '../styles';
import { getStatusStyle } from '../utils';
import { SetorFiltroModal } from './SetorFiltroModal';
import { TipoFiltroModal } from './TipoFiltroModal';

interface Props {
  busca: string;
  setores: string[];
  tipos: string[];
  setorSelecionado: string;
  tipoSelecionado: string;
  statusSelecionado: StatusFiltroAtivo;
  onChangeBusca: (valor: string) => void;
  onChangeSetor: (setor: string) => void;
  onChangeTipo: (tipo: string) => void;
  onChangeStatus: (status: StatusFiltroAtivo) => void;
}

export function BuscaFiltrosAtivos({
  busca,
  setores,
  tipos,
  setorSelecionado,
  tipoSelecionado,
  statusSelecionado,
  onChangeBusca,
  onChangeSetor,
  onChangeTipo,
  onChangeStatus,
}: Props) {
  const [modalSetorVisivel, setModalSetorVisivel] = useState(false);
  const [modalTipoVisivel, setModalTipoVisivel] = useState(false);

  return (
    <View style={styles.searchFilterContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por patrimônio, tipo, setor ou responsável..."
        placeholderTextColor="#94a3b8"
        value={busca}
        onChangeText={onChangeBusca}
        clearButtonMode="while-editing"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView} contentContainerStyle={styles.filterContentContainer}>
        {STATUS_FILTROS.map((status) => {
          const isActive = statusSelecionado === status;
          const statusStyle = getStatusStyle(status);

          return (
            <TouchableOpacity key={status} style={[styles.filterPill, isActive && styles.filterPillActive, isActive && status !== 'Todos' && { backgroundColor: statusStyle.bg, borderColor: statusStyle.text }]} onPress={() => onChangeStatus(status)}>
              <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive, isActive && status !== 'Todos' && { color: statusStyle.text }]}>
                {status}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.advancedFiltersRow}>
        <View style={styles.advancedFilter}>
          <Text style={styles.sectorLabel}>Setor</Text>
          <TouchableOpacity style={styles.sectorSelect} onPress={() => setModalSetorVisivel(true)}>
            <View style={styles.sectorSelectContent}>
              <MaterialCommunityIcons name="office-building-outline" size={18} color="#2563eb" />
              <Text style={styles.sectorSelectText} numberOfLines={1}>{setorSelecionado}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        <View style={styles.advancedFilter}>
          <Text style={styles.sectorLabel}>Tipo</Text>
          <TouchableOpacity style={styles.sectorSelect} onPress={() => setModalTipoVisivel(true)}>
            <View style={styles.sectorSelectContent}>
              <MaterialCommunityIcons name="laptop" size={18} color="#2563eb" />
              <Text style={styles.sectorSelectText} numberOfLines={1}>{tipoSelecionado}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <SetorFiltroModal
        setores={setores}
        setorSelecionado={setorSelecionado}
        visivel={modalSetorVisivel}
        onFechar={() => setModalSetorVisivel(false)}
        onSelecionar={onChangeSetor}
      />
      <TipoFiltroModal
        tipos={tipos}
        tipoSelecionado={tipoSelecionado}
        visivel={modalTipoVisivel}
        onFechar={() => setModalTipoVisivel(false)}
        onSelecionar={onChangeTipo}
      />
    </View>
  );
}
