import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';

import { db } from '../config/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface Chamado {
  id: string;
  idAtivo: string;
  descricaoProblema: string;
  usuario: string;
  status: string;
  dataCriacao?: any;
}

interface PainelChamadosScreenProps {
  onVoltar: () => void;
}

export default function PainelChamadosScreen({ onVoltar }: PainelChamadosScreenProps) {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [ativosMap, setAtivosMap] = useState<Record<string, any>>({});
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Pendente' | 'Em Andamento' | 'Resolvido'>('Todos');

  useEffect(() => {
    // 📡 1. Escuta todos os ativos para mapear os nomes/patrimônios
    const unsubAtivos = onSnapshot(collection(db, 'ativos'), (snapshot) => {
      const mapa: Record<string, any> = {};
      snapshot.forEach((doc) => {
        mapa[doc.id] = doc.data();
      });
      setAtivosMap(mapa);
    });

    // 📡 2. Escuta todos os chamados em tempo real
    const unsubChamados = onSnapshot(collection(db, 'chamados'), (snapshot) => {
      const lista: Chamado[] = [];
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() } as Chamado);
      });
      // Ordena por data (mais recentes primeiro)
      lista.sort((a, b) => (b.dataCriacao?.toMillis() || 0) - (a.dataCriacao?.toMillis() || 0));
      setChamados(lista);
    });

    return () => {
      unsubAtivos();
      unsubChamados();
    };
  }, []);

  // 📊 CÁLCULO DAS MÉTRICAS EM TEMPO REAL (Direto na memória)
  const totalPendentes = chamados.filter(c => c.status === 'Pendente').length;
  const totalAndamento = chamados.filter(c => c.status === 'Em Andamento').length;
  const totalResolvidos = chamados.filter(c => c.status === 'Resolvido').length;

  // ⚡ ATUALIZADO: Recebe também o idAtivo para mudar o status do equipamento junto
  const handleAtualizarStatus = async (idChamado: string, idAtivo: string, novoStatus: string) => {
    try {
      const chamadoDocRef = doc(db, 'chamados', idChamado);
      await updateDoc(chamadoDocRef, { status: novoStatus });

      // 🔥 AUTOMAÇÃO: Se concluiu o chamado pelo painel, libera o ativo de volta
      if (novoStatus === 'Resolvido') {
        const ativoDocRef = doc(db, 'ativos', idAtivo);
        await updateDoc(ativoDocRef, { status: 'Disponível' });
      }
    } catch (error: any) {
      alert('Erro ao atualizar chamado: ' + error.message);
    }
  };

  // Filtragem dos chamados na tela
  const chamadosFiltrados = chamados.filter((c) => {
    if (filtroStatus === 'Todos') return true;
    return c.status === filtroStatus;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Central de Chamados</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 📊 GRID DE MÉTRICAS RÁPIDAS */}
      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, { borderColor: '#fef3c7' }]}>
          <Text style={[styles.metricNumber, { color: '#b45309' }]}>{totalPendentes}</Text>
          <Text style={styles.metricLabel}>Pendentes</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: '#dbeafe' }]}>
          <Text style={[styles.metricNumber, { color: '#1d4ed8' }]}>{totalAndamento}</Text>
          <Text style={styles.metricLabel}>Em Execução</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: '#dcfce7' }]}>
          <Text style={[styles.metricNumber, { color: '#15803d' }]}>{totalResolvidos}</Text>
          <Text style={styles.metricLabel}>Concluídos</Text>
        </View>
      </View>

      {/* Filtros Rápidos */}
      <View style={styles.filterRow}>
        {(['Todos', 'Pendente', 'Em Andamento', 'Resolvido'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterBtn, filtroStatus === status && styles.filterBtnActive]}
            onPress={() => setFiltroStatus(status)}
          >
            <Text style={[styles.filterBtnText, filtroStatus === status && styles.filterBtnTextActive]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista Geral */}
      <ScrollView contentContainerStyle={styles.content}>
        {chamadosFiltrados.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum chamado encontrado nesta categoria.</Text>
        ) : (
          chamadosFiltrados.map((chamado) => {
            // Cruza o idAtivo do chamado com os dados do Ativo correspondente
            const dadosAtivo = ativosMap[chamado.idAtivo] || {
              patrimonio: 'Desconhecido',
              tipo: 'Ativo Removido',
              setor: '-',
            };

            return (
              <View key={chamado.id} style={styles.chamadoCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patrimonioText}>{dadosAtivo.patrimonio}</Text>
                  
                  <View style={[
                    styles.badge,
                    chamado.status === 'Pendente' && styles.badgePendente,
                    chamado.status === 'Em Andamento' && styles.badgeAndamento,
                    chamado.status === 'Resolvido' && styles.badgeResolvido,
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      chamado.status === 'Pendente' && { color: '#b45309' },
                      chamado.status === 'Em Andamento' && { color: '#1d4ed8' },
                      chamado.status === 'Resolvido' && { color: '#15803d' },
                    ]}>
                      {chamado.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.equipamentoText}>{dadosAtivo.tipo} — <Text style={styles.setorText}>📍 {dadosAtivo.setor}</Text></Text>
                <Text style={styles.descricaoText}>"{chamado.descricaoProblema}"</Text>
                <Text style={styles.usuarioText}>Aberto por: {chamado.usuario}</Text>

                {/* Botões de Ação na Fila */}
                {chamado.status !== 'Resolvido' && (
                  <View style={styles.actionsRow}>
                    {chamado.status === 'Pendente' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.btnAtender]}
                        onPress={() => handleAtualizarStatus(chamado.id, chamado.idAtivo, 'Em Andamento')}
                      >
                        <Text style={styles.actionBtnText}>👨‍💻 Atender</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnConcluir]}
                      onPress={() => handleAtualizarStatus(chamado.id, chamado.idAtivo, 'Resolvido')}
                    >
                      <Text style={styles.actionBtnText}>✅ Concluir</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
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
  
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
    backgroundColor: '#fff',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },

  filterRow: { flexDirection: 'row', padding: 12, gap: 6, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  filterBtn: { flex: 1, height: 32, backgroundColor: '#f1f5f9', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#2f6ea8' },
  filterBtnText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  filterBtnTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontStyle: 'italic' },
  chamadoCard: { backgroundColor: '#fff', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  patrimonioText: { fontSize: 16, fontWeight: 'bold', color: '#2f6ea8' },
  equipamentoText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  setorText: { color: '#64748b', fontWeight: 'normal' },
  descricaoText: { fontSize: 13, color: '#475569', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, marginTop: 8, fontStyle: 'italic' },
  usuarioText: { fontSize: 11, color: '#94a3b8', marginTop: 6, fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgePendente: { backgroundColor: '#fef3c7' },
  badgeAndamento: { backgroundColor: '#dbeafe' },
  badgeResolvido: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, marginTop: 12 },
  actionBtn: { flex: 1, height: 34, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  btnAtender: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  btnConcluir: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#334155' },
});