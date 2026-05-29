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
  content: { padding: 16, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  summaryNumber: { fontSize: 22, fontWeight: 'bold', color: '#2f6ea8' },
  summaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  searchInput: {
    height: 44,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  filterTitle: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 6,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
    marginBottom: 8,
  },
  filterPillActive: { backgroundColor: '#2f6ea8', borderColor: '#2f6ea8' },
  filterPillText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  filterPillTextActive: { color: '#fff' },
  exportButton: {
    height: 46,
    borderRadius: 8,
    backgroundColor: '#2f6ea8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  exportButtonText: { color: '#fff', fontWeight: '800' },
  resultTitle: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '800',
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultPatrimonio: { color: '#2f6ea8', fontWeight: '800', fontSize: 14 },
  resultInfo: { color: '#334155', marginTop: 3, fontSize: 12 },
  resultStatus: { color: '#64748b', marginTop: 4, fontSize: 11, fontWeight: '700' },
  moreText: { textAlign: 'center', color: '#64748b', marginTop: 8 },
});
