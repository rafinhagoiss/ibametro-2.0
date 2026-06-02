import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '../config/firebase';
import { registrarChamado } from '../features/ativos/chamados/registrarChamado';
import type { Ativo } from '../types/ativo';

interface ChamadoUsuario {
  categoria?: string;
  prioridade?: string;
  id: string;
  descricaoProblema: string;
  patrimonio?: string;
  solicitanteEmail?: string;
  status: string;
  usuario: string;
  dataCriacao?: any;
}

const CATEGORIAS = [
  { nome: 'Computador', icone: 'monitor' },
  { nome: 'Internet', icone: 'wifi' },
  { nome: 'Acesso', icone: 'account-key-outline' },
  { nome: 'Outro', icone: 'tools' },
] as const;
const PRIORIDADES = ['Normal', 'Alta', 'Urgente'] as const;

interface Props {
  usuarioLogado: string;
  nomeUsuario: string;
  emailUsuario: string;
  onLogout: () => void;
}

function normalizar(valor?: string) {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function equipamentoPertenceAoUsuario(ativo: Ativo, nomeUsuario: string, usuarioLogado: string) {
  const responsavel = normalizar(ativo.responsavel);
  const nomesPossiveis = [
    normalizar(nomeUsuario),
    normalizar(usuarioLogado),
    normalizar(usuarioLogado.replace(/\./g, ' ')),
  ].filter(Boolean);

  return Boolean(
    responsavel
    && nomesPossiveis.some((nome) => responsavel === nome || responsavel.includes(nome) || nome.includes(responsavel)),
  );
}

function formatarData(data: any) {
  const valor = typeof data?.toDate === 'function' ? data.toDate() : null;
  return valor ? valor.toLocaleDateString('pt-BR') : 'Agora';
}

export default function PortalUsuarioScreen({
  usuarioLogado,
  nomeUsuario,
  emailUsuario,
  onLogout,
}: Props) {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [chamados, setChamados] = useState<ChamadoUsuario[]>([]);
  const [ativoSelecionadoId, setAtivoSelecionadoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Computador');
  const [prioridade, setPrioridade] = useState('Normal');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    const unsubAtivos = onSnapshot(collection(db, 'ativos'), (snapshot) => {
      setAtivos(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Ativo));
    });
    const unsubChamados = onSnapshot(collection(db, 'chamados'), (snapshot) => {
      setChamados(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ChamadoUsuario));
    });

    return () => {
      unsubAtivos();
      unsubChamados();
    };
  }, []);

  const ativosVinculados = useMemo(
    () => ativos.filter(
      (ativo) => !ativo.deletado && equipamentoPertenceAoUsuario(ativo, nomeUsuario, usuarioLogado),
    ),
    [ativos, nomeUsuario, usuarioLogado],
  );
  const meusChamados = useMemo(
    () => chamados
      .filter((chamado) => (
        chamado.solicitanteEmail?.toLowerCase() === emailUsuario.toLowerCase()
        || chamado.usuario === usuarioLogado
      ))
      .sort((a, b) => (b.dataCriacao?.toMillis?.() || 0) - (a.dataCriacao?.toMillis?.() || 0)),
    [chamados, emailUsuario, usuarioLogado],
  );
  const ativoSelecionado = ativosVinculados.find((ativo) => ativo.id === ativoSelecionadoId)
    || (ativosVinculados.length === 1 ? ativosVinculados[0] : null);

  const abrirChamado = async () => {
    if (!descricao.trim()) {
      setErro('Conte brevemente o que aconteceu para a equipe técnica conseguir ajudar.');
      setMensagem('');
      return;
    }

    try {
      setSalvando(true);
      setErro('');
      setMensagem('Enviando sua solicitação...');
      const resultado = await registrarChamado({
        ativo: ativoSelecionado,
        descricao,
        usuario: usuarioLogado,
        categoria,
        prioridade,
        solicitanteNome: nomeUsuario,
        solicitanteEmail: emailUsuario,
      });
      setDescricao('');
      setMensagem(
        resultado.emailEnfileirado
          ? 'Chamado aberto com sucesso. A notificação de teste foi colocada na fila de e-mail.'
          : 'Chamado aberto com sucesso. A equipe técnica já consegue visualizar sua solicitação.',
      );
    } catch (error: any) {
      setMensagem('');
      setErro(error?.message || 'Não foi possível abrir o chamado. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.welcome}>Olá, {nomeUsuario || usuarioLogado}</Text>
          <Text style={styles.headerSubtitle}>Portal de atendimento</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <MaterialCommunityIcons name="headset" size={26} color="#1d4ed8" />
          </View>
          <View style={styles.introText}>
            <Text style={styles.title}>Como podemos ajudar?</Text>
            <Text style={styles.subtitle}>Descreva o problema e acompanhe o atendimento por aqui.</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Abrir novo chamado</Text>
          <Text style={styles.label}>Qual é o tipo de problema?</Text>
          <View style={styles.categoryRow}>
            {CATEGORIAS.map((item) => {
              const selecionada = categoria === item.nome;

              return (
                <TouchableOpacity
                  key={item.nome}
                  style={[styles.categoryButton, selecionada && styles.categoryButtonSelected]}
                  onPress={() => setCategoria(item.nome)}
                >
                  <MaterialCommunityIcons name={item.icone} size={18} color={selecionada ? '#1d4ed8' : '#64748b'} />
                  <Text style={[styles.categoryText, selecionada && styles.categoryTextSelected]}>{item.nome}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.label}>Equipamento relacionado</Text>
          {ativosVinculados.length ? (
            <View style={styles.assetList}>
              {ativosVinculados.map((ativo) => {
                const selecionado = ativoSelecionado?.id === ativo.id;

                return (
                  <TouchableOpacity
                    key={ativo.id}
                    style={[styles.assetButton, selecionado && styles.assetButtonSelected]}
                    onPress={() => setAtivoSelecionadoId(ativo.id)}
                  >
                    <MaterialCommunityIcons
                      name={selecionado ? 'check-circle' : 'monitor'}
                      size={20}
                      color={selecionado ? '#1d4ed8' : '#64748b'}
                    />
                    <View style={styles.assetText}>
                      <Text style={styles.assetTitle}>{ativo.patrimonio}</Text>
                      <Text style={styles.assetMeta}>{ativo.tipo} · {ativo.setor}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noAsset}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#b45309" />
              <Text style={styles.noAssetText}>
                Nenhum equipamento foi vinculado ao seu nome. Você ainda pode abrir o chamado normalmente.
              </Text>
            </View>
          )}

          <Text style={styles.label}>Qual é a urgência?</Text>
          <View style={styles.priorityRow}>
            {PRIORIDADES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.priorityButton, prioridade === item && styles.priorityButtonSelected]}
                onPress={() => setPrioridade(item)}
              >
                <Text style={[styles.priorityText, prioridade === item && styles.priorityTextSelected]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>O que aconteceu?</Text>
          <TextInput
            style={styles.description}
            placeholder="Ex.: o computador não liga ou a tela está piscando..."
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />
          <TouchableOpacity style={styles.submitButton} onPress={abrirChamado} disabled={salvando}>
            <MaterialCommunityIcons name="send" size={18} color="#fff" />
            <Text style={styles.submitText}>{salvando ? 'Enviando...' : 'Enviar solicitação'}</Text>
          </TouchableOpacity>
          {mensagem ? <Text style={styles.successText}>{mensagem}</Text> : null}
          {erro ? <Text style={styles.errorText}>{erro}</Text> : null}
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Meus chamados</Text>
          <Text style={styles.historyCount}>{meusChamados.length}</Text>
        </View>
        {meusChamados.length ? meusChamados.map((chamado) => (
          <View key={chamado.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketAsset}>{chamado.patrimonio || 'Sem patrimônio vinculado'}</Text>
              <Text style={[
                styles.status,
                chamado.status === 'Resolvido' && styles.statusResolved,
                chamado.status === 'Em Andamento' && styles.statusProgress,
              ]}>
                {chamado.status}
              </Text>
            </View>
            <Text style={styles.ticketDescription}>{chamado.descricaoProblema}</Text>
            <View style={styles.ticketMetaRow}>
              <Text style={styles.ticketCategory}>{chamado.categoria || 'Suporte técnico'}</Text>
              <Text style={styles.ticketPriority}>{chamado.prioridade || 'Normal'}</Text>
            </View>
            <Text style={styles.ticketDate}>Aberto em {formatarData(chamado.dataCriacao)}</Text>
          </View>
        )) : (
          <Text style={styles.emptyText}>Você ainda não abriu nenhum chamado.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#edf6ff' },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#0f2742' },
  headerText: { flex: 1 },
  welcome: { color: '#fff', fontSize: 17, fontWeight: '900' },
  headerSubtitle: { color: '#bae6fd', fontSize: 12, fontWeight: '800', marginTop: 3 },
  logoutButton: { padding: 9, borderRadius: 8, borderWidth: 1, borderColor: '#fecdd3', backgroundColor: '#fff1f2' },
  content: { width: '100%', maxWidth: 860, alignSelf: 'center', padding: 16, paddingBottom: 42 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, marginBottom: 14 },
  introIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#dbeafe' },
  introText: { flex: 1 },
  title: { color: '#0f2742', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 13, lineHeight: 18, marginTop: 3 },
  formSection: { padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#fff' },
  sectionTitle: { color: '#0f2742', fontSize: 16, fontWeight: '900' },
  label: { color: '#475569', fontSize: 12, fontWeight: '900', marginTop: 14, marginBottom: 7 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  categoryButtonSelected: { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
  categoryText: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  categoryTextSelected: { color: '#1d4ed8' },
  assetList: { gap: 8 },
  assetButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  assetButtonSelected: { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
  assetText: { flex: 1 },
  assetTitle: { color: '#1e293b', fontSize: 13, fontWeight: '900' },
  assetMeta: { color: '#64748b', fontSize: 11, marginTop: 3 },
  noAsset: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 8, borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#fffbeb' },
  noAssetText: { flex: 1, color: '#92400e', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  priorityButtonSelected: { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
  priorityText: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  priorityTextSelected: { color: '#1d4ed8' },
  description: { minHeight: 100, padding: 12, textAlignVertical: 'top', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, backgroundColor: '#f8fafc' },
  submitButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 11, borderRadius: 8, backgroundColor: '#2563eb' },
  submitText: { color: '#fff', fontWeight: '900' },
  successText: { color: '#15803d', fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: 10 },
  errorText: { color: '#b91c1c', fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: 10 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 10 },
  historyCount: { minWidth: 24, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, color: '#1d4ed8', backgroundColor: '#dbeafe', textAlign: 'center', fontSize: 12, fontWeight: '900' },
  ticketCard: { padding: 14, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#fff' },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ticketAsset: { flex: 1, color: '#1e293b', fontSize: 13, fontWeight: '900' },
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, color: '#b45309', backgroundColor: '#fffbeb', fontSize: 11, fontWeight: '900' },
  statusProgress: { color: '#1d4ed8', backgroundColor: '#eff6ff' },
  statusResolved: { color: '#15803d', backgroundColor: '#ecfdf5' },
  ticketDescription: { color: '#475569', fontSize: 13, lineHeight: 18, marginTop: 9 },
  ticketMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  ticketCategory: { color: '#1d4ed8', fontSize: 11, fontWeight: '900' },
  ticketPriority: { color: '#b45309', fontSize: 11, fontWeight: '900' },
  ticketDate: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 8 },
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', paddingVertical: 22 },
});
