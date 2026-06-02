import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Ativo } from '../../../types/ativo';
import { registrarChamado } from './registrarChamado';

interface Props {
  ativo: Ativo;
  usuarioLogado: string;
  onChamadoAberto?: () => void;
}

export function AbrirChamadoCard({ ativo, usuarioLogado, onChamadoAberto }: Props) {
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const abrirChamado = async () => {
    if (!descricao.trim()) {
      Alert.alert('Descreva o problema', 'Informe o defeito antes de abrir o chamado.');
      return;
    }

    try {
      setSalvando(true);
      const resultado = await registrarChamado({ ativo, descricao, usuario: usuarioLogado });
      setDescricao('');
      onChamadoAberto?.();
      Alert.alert(
        'Chamado aberto',
        resultado.emailEnfileirado
          ? 'O equipamento foi enviado para manutenção e a notificação de teste entrou na fila.'
          : 'O equipamento foi enviado para manutenção.',
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o chamado.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Abrir Chamado</Text>
      <Text style={styles.subtitle}>Registre um problema técnico deste equipamento.</Text>
      <TextInput
        style={styles.input}
        placeholder="Descreva o defeito encontrado..."
        value={descricao}
        onChangeText={setDescricao}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={abrirChamado} disabled={salvando}>
        <Text style={styles.buttonText}>{salvando ? 'Registrando...' : 'Registrar chamado'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  title: { color: '#0f2742', fontSize: 16, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 4 },
  input: { minHeight: 86, marginTop: 12, padding: 12, textAlignVertical: 'top', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, backgroundColor: '#f8fafc' },
  button: { minHeight: 44, marginTop: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#2563eb' },
  buttonText: { color: '#fff', fontWeight: '900' },
});
