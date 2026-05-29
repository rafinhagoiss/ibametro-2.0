import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AdminAtivoActionsCardProps {
  deletado?: boolean;
  onEnviarParaLixeira: () => void;
  onRestaurar: () => void;
  onExcluirDefinitivo: () => void;
}

export function AdminAtivoActionsCard({
  deletado,
  onEnviarParaLixeira,
  onRestaurar,
  onExcluirDefinitivo,
}: AdminAtivoActionsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ações do Administrador</Text>

      {deletado ? (
        <View style={styles.row}>
          <TouchableOpacity style={styles.restoreButton} onPress={onRestaurar}>
            <Text style={styles.restoreButtonText}>Restaurar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onExcluirDefinitivo}
          >
            <Text style={styles.deleteButtonText}>Excluir de vez</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.archiveButton} onPress={onEnviarParaLixeira}>
          <Text style={styles.archiveButtonText}>Enviar para Lixeira</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  archiveButton: {
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  archiveButtonText: {
    color: '#991b1b',
    fontWeight: '700',
  },
  restoreButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  restoreButtonText: {
    color: '#166534',
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#991b1b',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
