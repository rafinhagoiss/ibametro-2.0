import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface CadastroScreenProps {
  onVoltar: () => void;
}

export default function CadastroScreen({ onVoltar }: CadastroScreenProps) {
  const [patrimonio, setPatrimonio] = useState('');
  const [tipo, setTipo] = useState('');
  const [setor, setSetor] = useState('');
  const [status, setStatus] = useState('Disponível');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (!patrimonio || !tipo || !setor) {
      alert('Por favor, preencha os campos obrigatórios (*)');
      return;
    }

    try {
      setSalvando(true);
      await addDoc(collection(db, 'ativos'), {
        patrimonio: patrimonio.trim().toUpperCase(),
        tipo: tipo.trim(),
        setor: setor.trim(),
        status: status,
        descricao: descricao.trim(),
        dataCadastro: new Date().toISOString(),
      });
      alert('Equipamento cadastrado com sucesso!');
      onVoltar(); 
    } catch (error: any) {
      console.log('Erro:', error);
      alert('Erro ao salvar no Firebase: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onVoltar} disabled={salvando}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Novo Ativo</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nº de Patrimônio *</Text>
            <TextInput style={styles.input} placeholder="Ex: IBAM-0482" value={patrimonio} onChangeText={setPatrimonio} autoCapitalize="characters" editable={!salvando} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Equipamento / Tipo *</Text>
            <TextInput style={styles.input} placeholder="Ex: Switch Cisco 2960" value={tipo} onChangeText={setTipo} editable={!salvando} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Setor de Alocação *</Text>
            <TextInput style={styles.input} placeholder="Ex: TI / CPD" value={setor} onChangeText={setSetor} editable={!salvando} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status Atual</Text>
            <View style={styles.statusRow}>
              {['Disponível', 'Ativo', 'Manutenção'].map((item) => (
                <TouchableOpacity key={item} disabled={salvando} style={[styles.statusOption, status === item && styles.statusOptionSelected]} onPress={() => setStatus(item)}>
                  <Text style={[styles.statusOptionText, status === item && styles.statusOptionTextSelected]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações Técnicas</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Detalhes..." multiline numberOfLines={4} value={descricao} onChangeText={setDescricao} editable={!salvando} />
          </View>

          <TouchableOpacity style={[styles.saveButton, salvando && { opacity: 0.7 }]} onPress={handleSalvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Cadastrar Equipamento</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backButton: { paddingVertical: 6, paddingHorizontal: 10 },
  backButtonText: { color: '#2f6ea8', fontWeight: '600', fontSize: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  formContainer: { padding: 20, paddingBottom: 40 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { height: 48, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 16, fontSize: 15, color: '#334155' },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statusOption: { flex: 1, height: 40, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statusOptionSelected: { backgroundColor: '#2f6ea8', borderColor: '#2f6ea8' },
  statusOptionText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  statusOptionTextSelected: { color: '#fff' },
  saveButton: { height: 52, backgroundColor: '#2e7d32', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});