import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';

import { db } from '../config/firebase';
import type { Ativo, Componentes } from '../types/ativo';

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

const SETE_DIAS_EM_MS = 7 * 24 * 60 * 60 * 1000;
const FILTROS_CHAMADO = ['Todos', 'Pendente', 'Em Andamento', 'Resolvido'] as const;

type FiltroChamado = (typeof FILTROS_CHAMADO)[number];

function ativoEhComputador(tipo?: string) {
  const tipoNormalizado = tipo?.toLowerCase() || '';

  return (
    tipoNormalizado.includes('pc') ||
    tipoNormalizado.includes('computador') ||
    tipoNormalizado.includes('notebook')
  );
}

function componenteComDefeito(componentes?: Componentes | null) {
  return Boolean(componentes && Object.values(componentes).includes('Defeito'));
}

function obterMillis(data: any) {
  if (!data) return null;
  if (typeof data.toMillis === 'function') return data.toMillis();
  if (data instanceof Date) return data.getTime();
  if (typeof data === 'number') return data;

  return null;
}

function encontrarSetorCritico(ativos: Ativo[]) {
  const totaisPorSetor: Record<string, number> = {};

  ativos.forEach((ativo) => {
    const temProblema =
      ativo.status === 'Manutenção' || componenteComDefeito(ativo.componentes);

    if (!temProblema || ativo.deletado) {
      return;
    }

    const setor = ativo.setor || 'Sem setor';
    totaisPorSetor[setor] = (totaisPorSetor[setor] || 0) + 1;
  });

  const setorMaisCritico = Object.entries(totaisPorSetor).sort(
    (a, b) => b[1] - a[1],
  )[0];

  if (!setorMaisCritico) {
    return { setor: 'Sem dados', total: 0 };
  }

  return {
    setor: setorMaisCritico[0],
    total: setorMaisCritico[1],
  };
}

export default function PainelChamadosScreen({
  onVoltar,
}: PainelChamadosScreenProps) {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [ativosMap, setAtivosMap] = useState<Record<string, Ativo>>({});
  const [filtroStatus, setFiltroStatus] = useState<FiltroChamado>('Todos');

  useEffect(() => {
    const unsubAtivos = onSnapshot(collection(db, 'ativos'), (snapshot) => {
      const mapa: Record<string, Ativo> = {};

      snapshot.forEach((docSnapshot) => {
        mapa[docSnapshot.id] = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
        } as Ativo;
      });

      setAtivosMap(mapa);
    });

    const unsubChamados = onSnapshot(collection(db, 'chamados'), (snapshot) => {
      const lista: Chamado[] = [];

      snapshot.forEach((docSnapshot) => {
        lista.push({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        } as Chamado);
      });

      lista.sort(
        (a, b) =>
          (b.dataCriacao?.toMillis() || 0) - (a.dataCriacao?.toMillis() || 0),
      );
      setChamados(lista);
    });

    return () => {
      unsubAtivos();
      unsubChamados();
    };
  }, []);

  const ativos = Object.values(ativosMap);
  const limiteManutencao = Date.now() - SETE_DIAS_EM_MS;
  const totalPendentes = chamados.filter((c) => c.status === 'Pendente').length;
  const totalAndamento = chamados.filter(
    (c) => c.status === 'Em Andamento',
  ).length;
  const totalResolvidos = chamados.filter((c) => c.status === 'Resolvido').length;
  const computadoresNaLixeira = ativos.filter(
    (ativo) => ativo.deletado === true && ativoEhComputador(ativo.tipo),
  ).length;
  const manutencaoMaisDe7Dias = ativos.filter((ativo) => {
    const entradaManutencao = obterMillis(ativo.dataManutencao);

    return (
      ativo.status === 'Manutenção' &&
      entradaManutencao !== null &&
      entradaManutencao <= limiteManutencao
    );
  }).length;
  const setorCritico = encontrarSetorCritico(ativos);

  const handleAtualizarStatus = async (
    idChamado: string,
    idAtivo: string,
    novoStatus: string,
  ) => {
    try {
      await updateDoc(doc(db, 'chamados', idChamado), { status: novoStatus });

      if (novoStatus === 'Resolvido') {
        await updateDoc(doc(db, 'ativos', idAtivo), {
          status: 'Disponível',
          dataManutencao: null,
        });
      }
    } catch (error: any) {
      alert('Erro ao atualizar chamado: ' + error.message);
    }
  };

  const chamadosFiltrados = chamados.filter((chamado) => {
    if (filtroStatus === 'Todos') return true;
    return chamado.status === filtroStatus;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Central de Chamados</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, { borderColor: '#fef3c7' }]}>
          <Text style={[styles.metricNumber, { color: '#b45309' }]}>
            {totalPendentes}
          </Text>
          <Text style={styles.metricLabel}>Pendentes</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: '#dbeafe' }]}>
          <Text style={[styles.metricNumber, { color: '#1d4ed8' }]}>
            {totalAndamento}
          </Text>
          <Text style={styles.metricLabel}>Em Execução</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: '#dcfce7' }]}>
          <Text style={[styles.metricNumber, { color: '#15803d' }]}>
            {totalResolvidos}
          </Text>
          <Text style={styles.metricLabel}>Concluídos</Text>
        </View>
      </View>

      <View style={styles.inventoryMetricsContainer}>
        <View style={[styles.inventoryMetricCard, { borderLeftColor: '#991b1b' }]}>
          <Text style={styles.inventoryMetricLabel}>Computadores na Lixeira</Text>
          <Text style={[styles.inventoryMetricNumber, { color: '#991b1b' }]}>
            {computadoresNaLixeira}
          </Text>
        </View>

        <View style={[styles.inventoryMetricCard, { borderLeftColor: '#ef6c00' }]}>
          <Text style={styles.inventoryMetricLabel}>Manutenção acima de 7 dias</Text>
          <Text style={[styles.inventoryMetricNumber, { color: '#ef6c00' }]}>
            {manutencaoMaisDe7Dias}
          </Text>
        </View>

        <View style={[styles.inventoryMetricCard, { borderLeftColor: '#2f6ea8' }]}>
          <Text style={styles.inventoryMetricLabel}>Setor com mais defeitos</Text>
          <Text
            style={[styles.inventoryMetricNumber, { color: '#2f6ea8' }]}
            numberOfLines={1}
          >
            {setorCritico.setor}
          </Text>
          <Text style={styles.inventoryMetricHint}>
            {setorCritico.total} ocorrências
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTROS_CHAMADO.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterBtn,
              filtroStatus === status && styles.filterBtnActive,
            ]}
            onPress={() => setFiltroStatus(status)}
          >
            <Text
              style={[
                styles.filterBtnText,
                filtroStatus === status && styles.filterBtnTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {chamadosFiltrados.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhum chamado encontrado nesta categoria.
          </Text>
        ) : (
          chamadosFiltrados.map((chamado) => {
            const dadosAtivo = ativosMap[chamado.idAtivo] || {
              patrimonio: 'Desconhecido',
              tipo: 'Ativo removido',
              setor: '-',
            };

            return (
              <View key={chamado.id} style={styles.chamadoCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patrimonioText}>
                    {dadosAtivo.patrimonio}
                  </Text>

                  <View
                    style={[
                      styles.badge,
                      chamado.status === 'Pendente' && styles.badgePendente,
                      chamado.status === 'Em Andamento' && styles.badgeAndamento,
                      chamado.status === 'Resolvido' && styles.badgeResolvido,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        chamado.status === 'Pendente' && { color: '#b45309' },
                        chamado.status === 'Em Andamento' && { color: '#1d4ed8' },
                        chamado.status === 'Resolvido' && { color: '#15803d' },
                      ]}
                    >
                      {chamado.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.equipamentoText}>
                  {dadosAtivo.tipo} —{' '}
                  <Text style={styles.setorText}>📍 {dadosAtivo.setor}</Text>
                </Text>
                <Text style={styles.descricaoText}>
                  "{chamado.descricaoProblema}"
                </Text>
                <Text style={styles.usuarioText}>Aberto por: {chamado.usuario}</Text>

                {chamado.status !== 'Resolvido' && (
                  <View style={styles.actionsRow}>
                    {chamado.status === 'Pendente' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.btnAtender]}
                        onPress={() =>
                          handleAtualizarStatus(
                            chamado.id,
                            chamado.idAtivo,
                            'Em Andamento',
                          )
                        }
                      >
                        <Text style={styles.actionBtnText}>Atender</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnConcluir]}
                      onPress={() =>
                        handleAtualizarStatus(
                          chamado.id,
                          chamado.idAtivo,
                          'Resolvido',
                        )
                      }
                    >
                      <Text style={styles.actionBtnText}>Concluir</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
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
  metricNumber: { fontSize: 20, fontWeight: 'bold' },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  inventoryMetricsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  inventoryMetricCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    padding: 12,
  },
  inventoryMetricLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 4,
  },
  inventoryMetricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inventoryMetricHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtn: {
    flex: 1,
    height: 32,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#2f6ea8' },
  filterBtnText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  filterBtnTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 40,
    fontStyle: 'italic',
  },
  chamadoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patrimonioText: { fontSize: 16, fontWeight: 'bold', color: '#2f6ea8' },
  equipamentoText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  setorText: { color: '#64748b', fontWeight: 'normal' },
  descricaoText: {
    fontSize: 13,
    color: '#475569',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    fontStyle: 'italic',
  },
  usuarioText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '500',
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgePendente: { backgroundColor: '#fef3c7' },
  badgeAndamento: { backgroundColor: '#dbeafe' },
  badgeResolvido: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    height: 34,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAtender: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  btnConcluir: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#334155' },
});
