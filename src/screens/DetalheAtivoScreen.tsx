import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform, // 🔥 Importado para detectar se está no navegador ou celular
} from 'react-native';

import { db } from '../config/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

interface Ativo {
  id: string;
  patrimonio: string;
  tipo: string;
  setor: string;
  status: string;
  descricao?: string;
}

interface DetalheAtivoScreenProps {
  ativo: Ativo | null;
  isAdmin: boolean;
  chamados: any[];
  onAtualizarStatus: () => void;
  onAbrirChamado: (idAtivo: string, descricao: string) => void;
  onVoltar: () => void;
}

export default function DetalheAtivoScreen({
  ativo,
  isAdmin,
  chamados,
  onAbrirChamado,
  onVoltar,
}: DetalheAtivoScreenProps) {
  
  const [excluindo, setExcluindo] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);
  const [descricaoChamado, setDescricaoChamado] = useState('');

  if (!ativo) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Nenhum ativo selecionado.</Text>
      </SafeAreaView>
    );
  }

  // Filtrar os chamados deste equipamento específico
  const chamadosDoAtivo = chamados.filter(c => c.idAtivo === ativo.id);

  // 🔄 1. FUNÇÃO PARA ALTERAR STATUS DIRETO NO FIRESTORE
  const handleMudarStatus = async (novoStatus: string) => {
    try {
      setAtualizandoStatus(true);
      const ativoDocRef = doc(db, 'ativos', ativo.id);
      await updateDoc(ativoDocRef, { status: novoStatus });
      alert(`Status atualizado para ${novoStatus}!`);
      onVoltar();
    } catch (error: any) {
      alert('Erro ao atualizar status: ' + error.message);
    } finally {
      setAtualizandoStatus(false);
    }
  };

  // 💾 2. FUNÇÃO AUXILIAR QUE DELETA DE FATO
  const executarExclusao = async () => {
    try {
      setExcluindo(true);
      const ativoDocRef = doc(db, 'ativos', ativo.id);
      await deleteDoc(ativoDocRef);
      alert('Equipamento descartado com sucesso!');
      onVoltar(); 
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    } finally {
      setExcluindo(false);
    }
  };

  // 🗑️ 3. POLIFILL DO BOTÃO DESCARTAR (Web vs Mobile)
  const handleDescartarAtivo = () => {
    const mensagem = `Tem certeza que deseja descartar o patrimônio ${ativo.patrimonio}?`;

    if (Platform.OS === 'web') {
      // Se for no navegador do PC, usa o confirm nativo do browser
      const confirmar = window.confirm(mensagem);
      if (confirmar) {
        executarExclusao();
      }
    } else {
      // Se for no celular, usa o Alert do React Native
      Alert.alert('Atenção!', mensagem, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar Exclusão', style: 'destructive', onPress: executarExclusao },
      ]);
    }
  };

  // 🛠️ 4. ENVIAR NOVO CHAMADO
  const handleEnviarChamado = () => {
    if (!descricaoChamado.trim()) {
      alert('Digite o problema antes de abrir o chamado!');
      return;
    }
    onAbrirChamado(ativo.id, descricaoChamado.trim());
    alert('Chamado aberto com sucesso!');
    setDescricaoChamado('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} disabled={excluindo || atualizandoStatus}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Painel do Ativo</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card de Informações */}
        <View style={styles.infoCard}>
          <Text style={styles.label}>Nº PATRIMÔNIO</Text>
          <Text style={styles.patrimonioValue}>{ativo.patrimonio}</Text>

          <Text style={styles.label}>EQUIPAMENTO</Text>
          <Text style={styles.value}>{ativo.tipo}</Text>

          <Text style={styles.label}>SETOR ALOCADO</Text>
          <Text style={styles.value}>📍 {ativo.setor}</Text>

          <Text style={styles.label}>STATUS ATUAL</Text>
          <Text style={styles.statusValue}>● {ativo.status}</Text>

          {ativo.descricao ? (
            <>
              <Text style={styles.label}>OBSERVAÇÕES TÉCNICAS</Text>
              <Text style={styles.value}>{ativo.descricao}</Text>
            </>
          ) : null}
        </View>

        {/* 🔄 SEÇÃO: ALTERAR STATUS DO EQUIPAMENTO */}
        <Text style={styles.sectionTitle}>Alterar Status</Text>
        <View style={styles.statusRow}>
          {['Disponível', 'Ativo', 'Manutenção'].map((st) => (
            <TouchableOpacity 
              key={st} 
              disabled={atualizandoStatus || excluindo}
              style={[styles.statusButton, ativo.status === st && styles.statusButtonActive]}
              onPress={() => handleMudarStatus(st)}
            >
              <Text style={[styles.statusButtonText, ativo.status === st && styles.statusButtonTextActive]}>{st}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🛠️ SEÇÃO: ABRIR CHAMADO MANUTENÇÃO */}
        <Text style={styles.sectionTitle}>Abrir Chamado Técnico</Text>
        <View style={styles.chamadoForm}>
          <TextInput
            style={styles.input}
            placeholder="Descreva o problema observado..."
            value={descricaoChamado}
            onChangeText={setDescricaoChamado}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleEnviarChamado}>
            <Text style={styles.sendButtonText}>Reportar Problema</Text>
          </TouchableOpacity>
        </View>

        {/* 📋 LISTA DE CHAMADOS EM ABERTO */}
        <Text style={styles.sectionTitle}>Histórico de Chamados ({chamadosDoAtivo.length})</Text>
        {chamadosDoAtivo.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum chamado pendente para este equipamento.</Text>
        ) : (
          chamadosDoAtivo.map((chamado) => (
            <View key={chamado.id} style={styles.chamadoCard}>
              <Text style={styles.chamadoUser}>Por: {chamado.usuario}</Text>
              <Text style={styles.chamadoDesc}>{chamado.descricaoProblema}</Text>
              <Text style={styles.chamadoStatus}>⚠️ Status: {chamado.status}</Text>
            </View>
          ))
        )}

        {/* ❌ SEÇÃO PERIGOSA: DESCARTAR ATIVO (Apenas Admin) */}
        {isAdmin && (
          <View style={{ marginTop: 30 }}>
            <TouchableOpacity 
              style={[styles.deleteButton, excluindo && { opacity: 0.5 }]} 
              onPress={handleDescartarAtivo}
              disabled={excluindo || atualizandoStatus}
            >
              {excluindo ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>❌ Descartar Equipamento do Banco</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backButtonText: { color: '#2f6ea8', fontWeight: '600', fontSize: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  content: { padding: 20, paddingBottom: 50 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginBottom: 4, marginTop: 12 },
  patrimonioValue: { fontSize: 22, fontWeight: 'bold', color: '#2f6ea8', marginBottom: 2 },
  value: { fontSize: 15, color: '#334155', fontWeight: '500' },
  statusValue: { fontSize: 15, color: '#2f6ea8', fontWeight: 'bold' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginTop: 20, marginBottom: 10 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statusButton: { flex: 1, height: 38, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  statusButtonActive: { backgroundColor: '#2f6ea8', borderColor: '#2f6ea8' },
  statusButtonText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  statusButtonTextActive: { color: '#fff' },
  chamadoForm: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { height: 60, textAlignVertical: 'top', padding: 8, fontSize: 14, color: '#334155' },
  sendButton: { backgroundColor: '#475569', height: 36, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  sendButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  emptyText: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic', marginBottom: 10 },
  chamadoCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  chamadoUser: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  chamadoDesc: { fontSize: 14, color: '#334155', marginVertical: 4 },
  chamadoStatus: { fontSize: 12, color: '#b45309', fontWeight: '600' },
  deleteButton: { height: 48, backgroundColor: '#dc2626', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});