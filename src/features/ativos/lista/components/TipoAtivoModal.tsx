import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TipoAtivoModalProps {
  visivel: boolean;
  onFechar: () => void;
  onSelecionarTipo: (tipo: string) => void;
}

const OPCOES_TIPO_ATIVO = [
  {
    titulo: 'Computador',
    descricao: 'PC, notebook ou estação com responsável e hardware.',
    valor: 'Computador',
  },
  {
    titulo: 'Switch',
    descricao: 'Equipamento de rede com portas e localização.',
    valor: 'Switch',
  },
  {
    titulo: 'Arquimedes',
    descricao: 'Computador all-in-one com hardware e diagnóstico da tela.',
    valor: 'Arquimedes',
  },
];

export function TipoAtivoModal({
  visivel,
  onFechar,
  onSelecionarTipo,
}: TipoAtivoModalProps) {
  return (
    <Modal visible={visivel} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Novo ativo</Text>
          <Text style={styles.subtitle}>Escolha o tipo de cadastro.</Text>

          {OPCOES_TIPO_ATIVO.map((opcao) => (
            <TouchableOpacity
              key={opcao.valor}
              style={styles.optionButton}
              onPress={() => onSelecionarTipo(opcao.valor)}
            >
              <Text style={styles.optionTitle}>{opcao.titulo}</Text>
              <Text style={styles.optionDescription}>{opcao.descricao}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelButton} onPress={onFechar}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 14,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2f6ea8',
  },
  optionDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  cancelButton: {
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '700',
  },
});
