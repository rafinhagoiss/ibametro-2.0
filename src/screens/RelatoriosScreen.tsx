import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { Ativo } from '../types/ativo';
import { exportarInventarioCsv } from '../features/ativos/exportacao/exportarInventarioCsv';
import { useAtivos } from '../features/ativos/lista/hooks/useAtivos';

interface RelatoriosScreenProps {
  onVoltar: () => void;
}

const STATUS_RELATORIO = [
  'Todos',
  'Disponível',
  'Ativo',
  'Manutenção',
  'Lixeira',
] as const;

function normalizar(valor?: string) {
  return (valor || '').toLowerCase().trim();
}

function filtrarRelatorio(
  ativos: Ativo[],
  busca: string,
  status: string,
  setor: string,
  tipo: string,
) {
  const textoBusca = normalizar(busca);

  return ativos.filter((ativo) => {
    const statusAtivo = ativo.deletado ? 'Lixeira' : ativo.status;
    const combinaBusca =
      ativo.patrimonio.toLowerCase().includes(textoBusca) ||
      ativo.tipo.toLowerCase().includes(textoBusca) ||
      ativo.setor.toLowerCase().includes(textoBusca) ||
      normalizar(ativo.responsavel).includes(textoBusca);
    const combinaStatus = status === 'Todos' || statusAtivo === status;
    const combinaSetor = setor === 'Todos' || ativo.setor === setor;
    const combinaTipo = tipo === 'Todos' || ativo.tipo === tipo;

    return combinaBusca && combinaStatus && combinaSetor && combinaTipo;
  });
}

export default function RelatoriosScreen({ onVoltar }: RelatoriosScreenProps) {
  const { ativos, carregando } = useAtivos();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('Todos');
  const [setor, setSetor] = useState('Todos');
  const [tipo, setTipo] = useState('Todos');
  const [exportando, setExportando] = useState(false);

  const setores = useMemo(
    () => ['Todos', ...Array.from(new Set(ativos.map((ativo) => ativo.setor))).sort()],
    [ativos],
  );
  const tipos = useMemo(
    () => ['Todos', ...Array.from(new Set(ativos.map((ativo) => ativo.tipo))).sort()],
    [ativos],
  );
  const ativosFiltrados = useMemo(
    () => filtrarRelatorio(ativos, busca, status, setor, tipo),
    [ativos, busca, status, setor, tipo],
  );

  const totalLixeira = ativosFiltrados.filter((ativo) => ativo.deletado).length;
  const totalManutencao = ativosFiltrados.filter(
    (ativo) => ativo.status === 'Manutenção' && !ativo.deletado,
  ).length;

  const handleExportar = async () => {
    try {
      setExportando(true);
      const nomeArquivo = await exportarInventarioCsv(ativosFiltrados);

      Alert.alert(
        'Relatório exportado',
        `Arquivo: ${nomeArquivo}\nRegistros: ${ativosFiltrados.length}`,
      );
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível exportar.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Relatórios</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{ativosFiltrados.length}</Text>
            <Text style={styles.summaryLabel}>Ativos no filtro</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: '#ef6c00' }]}>
              {totalManutencao}
            </Text>
            <Text style={styles.summaryLabel}>Manutenção</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: '#991b1b' }]}>
              {totalLixeira}
            </Text>
            <Text style={styles.summaryLabel}>Lixeira</Text>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por patrimônio, tipo, setor ou responsável"
          value={busca}
          onChangeText={setBusca}
        />

        <Text style={styles.filterTitle}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATUS_RELATORIO.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterPill, status === item && styles.filterPillActive]}
              onPress={() => setStatus(item)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  status === item && styles.filterPillTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterTitle}>Setor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {setores.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterPill, setor === item && styles.filterPillActive]}
              onPress={() => setSetor(item)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  setor === item && styles.filterPillTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterTitle}>Tipo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tipos.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterPill, tipo === item && styles.filterPillActive]}
              onPress={() => setTipo(item)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  tipo === item && styles.filterPillTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportar}
          disabled={exportando || carregando}
        >
          <Text style={styles.exportButtonText}>
            {exportando ? 'Exportando...' : 'Exportar relatório filtrado'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.resultTitle}>Prévia dos registros</Text>
        {ativosFiltrados.slice(0, 20).map((ativo) => (
          <View key={ativo.id} style={styles.resultCard}>
            <Text style={styles.resultPatrimonio}>{ativo.patrimonio}</Text>
            <Text style={styles.resultInfo}>
              {ativo.tipo} — {ativo.setor}
            </Text>
            <Text style={styles.resultStatus}>
              {ativo.deletado ? 'Lixeira' : ativo.status}
            </Text>
          </View>
        ))}

        {ativosFiltrados.length > 20 && (
          <Text style={styles.moreText}>
            Mostrando 20 de {ativosFiltrados.length}. Exporte para ver tudo.
          </Text>
        )}
      </ScrollView>
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
  content: { padding: 16, paddingBottom: 44 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4,
  },
  summaryNumber: { fontSize: 25, fontWeight: '900', color: '#2563eb' },
  summaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '900', marginTop: 2 },
  searchInput: {
    height: 52,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14,
    color: '#0f172a',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  filterTitle: {
    fontSize: 13,
    color: '#0f2742',
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 10,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginRight: 8,
    marginBottom: 4,
  },
  filterPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  filterPillText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '900',
  },
  filterPillTextActive: { color: '#ffffff' },
  exportButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 20,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  exportButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  resultTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f2742',
    marginBottom: 10,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  resultPatrimonio: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  resultInfo: { fontSize: 13, color: '#475569', marginTop: 4, fontWeight: '700' },
  resultStatus: { fontSize: 12, color: '#2563eb', marginTop: 8, fontWeight: '900' },
  moreText: {
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '800',
    marginTop: 12,
  },
});
