import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  exportando: boolean;
  importando: boolean;
  onExportar: () => void;
  onImportar: () => void;
  onRelatorios: () => void;
  onUsuarios: () => void;
}

export function AcoesAdministrativas({
  exportando,
  importando,
  onExportar,
  onImportar,
  onRelatorios,
  onUsuarios,
}: Props) {
  const [aberto, setAberto] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggle} onPress={() => setAberto(!aberto)}>
        <View style={styles.toggleTitle}>
          <MaterialCommunityIcons name="tools" size={18} color="#1d4ed8" />
          <Text style={styles.toggleText}>Ferramentas administrativas</Text>
        </View>
        <MaterialCommunityIcons
          name={aberto ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#1d4ed8"
        />
      </TouchableOpacity>

      {aberto && (
        <View style={styles.actions}>
          <Action icon="file-export-outline" label={exportando ? 'Exportando...' : 'Exportar CSV'} onPress={onExportar} disabled={exportando} />
          <Action icon="chart-box-outline" label="Relatórios" onPress={onRelatorios} />
          <Action icon="account-cog-outline" label="Usuários" onPress={onUsuarios} />
          <Action icon="file-upload-outline" label={importando ? 'Importando...' : 'Importar CSV'} onPress={onImportar} disabled={importando} />
        </View>
      )}
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.action, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <MaterialCommunityIcons name={icon} size={20} color="#2563eb" />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 8 },
  toggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    backgroundColor: '#eef6ff',
  },
  toggleTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleText: { color: '#1d4ed8', fontSize: 13, fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8 },
  action: {
    width: '48%',
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  actionText: { color: '#1e3a8a', fontSize: 12, fontWeight: '800' },
  disabled: { opacity: 0.55 },
});
