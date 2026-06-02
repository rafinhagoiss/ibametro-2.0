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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '../config/firebase';
import { registrarHistoricoAtivo } from '../features/ativos/historico/registrarHistoricoAtivo';
import { AbrirChamadoModal } from '../features/ativos/chamados/AbrirChamadoModal';
import type { NotificacaoEmailDemo } from '../features/ativos/chamados/emailDemo';
import type { Ativo, Componentes } from '../types/ativo';

interface Chamado {
  id: string;
  idAtivo: string;
  patrimonio?: string;
  categoria?: string;
  prioridade?: string;
  descricaoProblema: string;
  usuario: string;
  solicitanteNome?: string;
  solicitanteEmail?: string;
  responsavelAtendimento?: string;
  status: string;
  dataCriacao?: any;
  dataAtendimento?: any;
  dataResolucao?: any;
  notificacaoEmailDemo?: NotificacaoEmailDemo;
}

interface PainelChamadosScreenProps {
  onVoltar: () => void;
  usuarioLogado: string;
}

const SETE_DIAS_EM_MS = 7 * 24 * 60 * 60 * 1000;
const FILTROS_CHAMADO = ['Todos', 'Pendente', 'Em Andamento', 'Resolvido'] as const;

type FiltroChamado = (typeof FILTROS_CHAMADO)[number];

function ativoEhComputador(tipo?: string) {
  const tipoNormalizado = tipo?.toLowerCase() || '';

  return (
    tipoNormalizado.includes('pc') ||
    tipoNormalizado.includes('computador') ||
    tipoNormalizado.includes('notebook') ||
    tipoNormalizado.includes('arquimedes')
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

function formatarDataHora(data: any) {
  const millis = obterMillis(data);

  return millis ? new Date(millis).toLocaleString('pt-BR') : '';
}

function encontrarSetorCritico(ativos: Ativo[]) {
  const totaisPorSetor: Record<string, number> = {};

  ativos.forEach((ativo) => {
    const temProblema =
      ativo.status === 'Manutenção' ||
      componenteComDefeito(ativo.componentes) ||
      ativo.tela === 'Danificada';

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
  usuarioLogado,
}: PainelChamadosScreenProps) {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [ativosMap, setAtivosMap] = useState<Record<string, Ativo>>({});
  const [filtroStatus, setFiltroStatus] = useState<FiltroChamado>('Todos');
  const [modalNovoChamadoVisivel, setModalNovoChamadoVisivel] = useState(false);
  const [mostrarEmailsDemo, setMostrarEmailsDemo] = useState(false);

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
  const emailsDemo = chamados
    .filter((chamado) => chamado.notificacaoEmailDemo)
    .slice(0, 5);

  const handleAtualizarStatus = async (
    idChamado: string,
    idAtivo: string,
    novoStatus: string,
  ) => {
    try {
      const chamadoAtual = chamados.find((chamado) => chamado.id === idChamado);
      await updateDoc(doc(db, 'chamados', idChamado), {
        status: novoStatus,
        dataAtualizacao: serverTimestamp(),
        ...(novoStatus === 'Em Andamento' && {
          responsavelAtendimento: usuarioLogado,
          dataAtendimento: serverTimestamp(),
        }),
        ...(novoStatus === 'Resolvido' && {
          responsavelAtendimento: chamadoAtual?.responsavelAtendimento || usuarioLogado,
          dataResolucao: serverTimestamp(),
        }),
      });
      const ativo = ativosMap[idAtivo];

      if (ativo) {
        await registrarHistoricoAtivo({
          ativoId: idAtivo,
          patrimonio: ativo.patrimonio,
          acao: `Chamado atualizado: ${novoStatus}`,
          usuario: usuarioLogado,
        });
      }

      if (novoStatus === 'Resolvido' && idAtivo && ativosMap[idAtivo]) {
        await updateDoc(doc(db, 'ativos', idAtivo), {
          status: 'Disponível',
          dataManutencao: null,
        });
      }
    } catch (error: any) {
      alert('Erro ao atualizar chamado: ' + error.message);
    }
  };

  const chamadosFiltrados = chamados
    .filter((chamado) => {
      if (filtroStatus === 'Todos') return true;
      return chamado.status === filtroStatus;
    })
    .sort((a, b) => {
      const pesos: Record<string, number> = { Urgente: 3, Alta: 2, Normal: 1 };
      const diferencaPrioridade = (pesos[b.prioridade || 'Normal'] || 1) - (pesos[a.prioridade || 'Normal'] || 1);

      return diferencaPrioridade || ((b.dataCriacao?.toMillis?.() || 0) - (a.dataCriacao?.toMillis?.() || 0));
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

      <TouchableOpacity style={styles.openTicketButton} onPress={() => setModalNovoChamadoVisivel(true)}>
        <Text style={styles.openTicketButtonText}>+ Abrir chamado</Text>
      </TouchableOpacity>

      <View style={styles.emailDemoSection}>
        <TouchableOpacity
          style={styles.emailDemoHeader}
          onPress={() => setMostrarEmailsDemo((valorAtual) => !valorAtual)}
        >
          <View style={styles.emailDemoTitleRow}>
            <MaterialCommunityIcons name="email-outline" size={21} color="#1d4ed8" />
            <View>
              <Text style={styles.emailDemoTitle}>Notificações por e-mail</Text>
              <Text style={styles.emailDemoSubtitle}>Fila de teste do TCC</Text>
            </View>
          </View>
          <View style={styles.emailDemoHeaderRight}>
            <Text style={styles.emailDemoCount}>{emailsDemo.length}</Text>
            <MaterialCommunityIcons
              name={mostrarEmailsDemo ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#64748b"
            />
          </View>
        </TouchableOpacity>

        {mostrarEmailsDemo ? (
          <View style={styles.emailDemoContent}>
            <Text style={styles.emailDemoHint}>
              Ambiente de teste: o envio real depende da extensão Trigger Email configurada no Firebase. A senha nunca fica no aplicativo.
            </Text>
            {emailsDemo.length ? emailsDemo.map((chamado) => {
              const email = chamado.notificacaoEmailDemo!;

              return (
                <View key={chamado.id} style={styles.emailDemoCard}>
                  <View style={styles.emailDemoCardHeader}>
                    <Text style={styles.emailDemoSubject}>{email.assunto}</Text>
                    <Text style={styles.emailDemoBadge}>{email.status}</Text>
                  </View>
                  <Text style={styles.emailDemoRecipient}>Para: {email.destinatario}</Text>
                  <Text style={styles.emailDemoBody} numberOfLines={3}>{email.corpo}</Text>
                </View>
              );
            }) : (
              <Text style={styles.emailDemoEmpty}>Abra um chamado para gerar a primeira notificação demonstrativa.</Text>
            )}
          </View>
        ) : null}
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
              patrimonio: chamado.patrimonio || 'Sem patrimônio vinculado',
              tipo: chamado.idAtivo ? 'Ativo removido' : 'Atendimento geral',
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
                <View style={styles.ticketMetaRow}>
                  <Text style={styles.categoriaText}>{chamado.categoria || 'Suporte técnico'}</Text>
                  <Text style={[
                    styles.prioridadeText,
                    chamado.prioridade === 'Urgente' && styles.prioridadeUrgente,
                    chamado.prioridade === 'Alta' && styles.prioridadeAlta,
                  ]}>
                    Prioridade {chamado.prioridade || 'Normal'}
                  </Text>
                </View>
                <Text style={styles.descricaoText}>
                  "{chamado.descricaoProblema}"
                </Text>
                <Text style={styles.usuarioText}>
                  Solicitante: {chamado.solicitanteNome || chamado.usuario}
                </Text>
                {chamado.solicitanteEmail ? (
                  <Text style={styles.usuarioEmailText}>{chamado.solicitanteEmail}</Text>
                ) : null}
                <Text style={styles.dataText}>
                  Aberto em: {formatarDataHora(chamado.dataCriacao) || 'agora'}
                </Text>
                {chamado.responsavelAtendimento ? (
                  <Text style={styles.responsavelText}>
                    Atendimento: {chamado.responsavelAtendimento}
                    {formatarDataHora(chamado.dataAtendimento) ? ` · ${formatarDataHora(chamado.dataAtendimento)}` : ''}
                  </Text>
                ) : null}
                {formatarDataHora(chamado.dataResolucao) ? (
                  <Text style={styles.resolucaoText}>Concluído em: {formatarDataHora(chamado.dataResolucao)}</Text>
                ) : null}

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

      <AbrirChamadoModal
        ativos={ativos}
        usuarioLogado={usuarioLogado}
        visivel={modalNovoChamadoVisivel}
        onFechar={() => setModalNovoChamadoVisivel(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#edf6ff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#0f2742',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  backButtonText: { color: '#bae6fd', fontWeight: '900', fontSize: 15 },
  title: { fontSize: 19, fontWeight: '900', color: '#ffffff' },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: '#edf6ff',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  metricNumber: { fontSize: 25, fontWeight: '900' },
  metricLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '900',
    marginTop: 4,
  },
  openTicketButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  openTicketButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  emailDemoSection: {
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  emailDemoHeader: {
    minHeight: 60,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  emailDemoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  emailDemoTitle: { color: '#0f2742', fontSize: 13, fontWeight: '900' },
  emailDemoSubtitle: { marginTop: 2, color: '#64748b', fontSize: 11, fontWeight: '700' },
  emailDemoHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  emailDemoCount: { minWidth: 22, textAlign: 'center', color: '#1d4ed8', fontSize: 12, fontWeight: '900' },
  emailDemoContent: { padding: 12, borderTopWidth: 1, borderTopColor: '#dbeafe', gap: 8, backgroundColor: '#f8fbff' },
  emailDemoHint: { color: '#64748b', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  emailDemoCard: { padding: 10, borderWidth: 1, borderColor: '#dbeafe', borderRadius: 8, backgroundColor: '#ffffff' },
  emailDemoCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  emailDemoSubject: { flex: 1, color: '#0f2742', fontSize: 12, lineHeight: 16, fontWeight: '900' },
  emailDemoBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, color: '#166534', backgroundColor: '#dcfce7', fontSize: 9, fontWeight: '900' },
  emailDemoRecipient: { marginTop: 6, color: '#1d4ed8', fontSize: 10, fontWeight: '800' },
  emailDemoBody: { marginTop: 5, color: '#64748b', fontSize: 10, lineHeight: 14 },
  emailDemoEmpty: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  inventoryMetricsContainer: {
    backgroundColor: '#edf6ff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
  },
  inventoryMetricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderLeftWidth: 6,
    padding: 15,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  inventoryMetricLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '900',
    marginBottom: 5,
  },
  inventoryMetricNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  inventoryMetricHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#edf6ff',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  filterBtnText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '900',
  },
  filterBtnTextActive: { color: '#ffffff' },
  content: { padding: 16, paddingBottom: 40 },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '700',
    marginTop: 30,
  },
  chamadoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patrimonioText: { fontSize: 17, fontWeight: '900', color: '#0f172a' },
  equipamentoText: { fontSize: 13, color: '#334155', fontWeight: '700' },
  ticketMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 7 },
  categoriaText: { color: '#1d4ed8', fontSize: 11, fontWeight: '900' },
  prioridadeText: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, color: '#15803d', backgroundColor: '#ecfdf5', fontSize: 10, fontWeight: '900' },
  prioridadeAlta: { color: '#b45309', backgroundColor: '#fffbeb' },
  prioridadeUrgente: { color: '#b91c1c', backgroundColor: '#fef2f2' },
  setorText: { color: '#2563eb', fontWeight: '900' },
  descricaoText: {
    marginTop: 12,
    color: '#0f172a',
    lineHeight: 20,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  usuarioText: { marginTop: 10, fontSize: 12, color: '#64748b', fontWeight: '800' },
  usuarioEmailText: { marginTop: 3, fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  dataText: { marginTop: 7, fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  responsavelText: { marginTop: 4, fontSize: 11, color: '#1d4ed8', fontWeight: '800' },
  resolucaoText: { marginTop: 4, fontSize: 11, color: '#15803d', fontWeight: '800' },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgePendente: { backgroundColor: '#fffbeb', borderColor: '#f59e0b' },
  badgeAndamento: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  badgeResolvido: { backgroundColor: '#ecfdf5', borderColor: '#22c55e' },
  badgeText: { fontSize: 11, fontWeight: '900' },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAtender: { backgroundColor: '#2563eb' },
  btnConcluir: { backgroundColor: '#16a34a' },
  actionBtnText: { color: '#ffffff', fontWeight: '900' },
});
