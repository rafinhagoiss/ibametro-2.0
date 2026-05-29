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
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#7f1d1d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: '#9a3412',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  archiveButton: {
    height: 46,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fb923c',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  archiveButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  restoreButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderWidth: 1,
    borderColor: '#15803d',
  },
  restoreButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  deleteButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#991b1b',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
});
