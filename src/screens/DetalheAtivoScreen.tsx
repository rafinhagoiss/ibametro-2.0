import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// 📌 Definição de Tipos e Interfaces
type Componentes = {
  memoriaRam: string;
  placaMae: string;
  armazenamento: string;
  fonte: string;
};

interface Ativo {
  id: string;
  patrimonio: string;
  tipo: string;
  setor: string;
  status: string;
  descricao?: string;
  componentes?: Componentes;
}

interface DetalheAtivoScreenProps {
  ativo: Ativo | null;
  isAdmin: boolean;
  usuarioLogado: string;
  onVoltar: () => void;
}

// 📦 Constantes de Configuração
const COMPONENTES_PADRAO: Componentes = {
  memoriaRam: 'OK',
  placaMae: 'OK',
  armazenamento: 'OK',
  fonte: 'OK',
};

const NOMES_COMPONENTES: Record<keyof Componentes, string> = {
  memoriaRam: 'Memória RAM',
  placaMae: 'Placa-Mãe',
  armazenamento: 'Armazenamento (SSD/HD)',
  fonte: 'Fonte de Alimentação',
};

// Opções de status do sistema
const OPCOES_STATUS = ['Disponível', 'Ativo', 'Manutenção'];

export default function DetalheAtivoScreen({
  ativo,
  isAdmin,
  usuarioLogado,
  onVoltar,
}: DetalheAtivoScreenProps) {

  // 🛡️ Hooks de Estado (Sempre no topo)
  const [componentes, setComponentes] = useState<Componentes>(COMPONENTES_PADRAO);
  const [statusGeral, setStatusGeral] = useState<string>('Disponível');
  const [salvando, setSalvando] = useState(false);

  // 🔄 Sincroniza os estados quando o ativo mudar
  useEffect(() => {
    if (ativo) {
      setStatusGeral(ativo.status || 'Disponível');
      if (ativo.componentes) {
        setComponentes(ativo.componentes);
      } else {
        setComponentes(COMPONENTES_PADRAO);
      }
    }
  }, [ativo]);

  // 🚫 Verificação de Segurança
  if (!ativo) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Nenhum ativo selecionado.</Text>
      </View>
    );
  }

  const tipoNormalizado = ativo.tipo?.toLowerCase() || '';
  const ehComputador =
    tipoNormalizado.includes('computador') ||
    tipoNormalizado.includes('notebook') ||
    tipoNormalizado.includes('pc');

  // 🛠️ Alternador de status das peças individuais
  const handleAlternarComponente = (chave: keyof Componentes) => {
    if (!isAdmin) {
      Alert.alert('Acesso Restrito', 'Apenas administradores podem alterar o status de hardware.');
      return;
    }

    setComponentes((prev) => {
      const novoStatus = prev[chave] === 'OK' ? 'Defeito' : 'OK';
      
      // Se alguma peça der defeito, muda o status geral para Manutenção automaticamente pra ajudar o técnico
      if (novoStatus === 'Defeito') {
        setStatusGeral('Manutenção');
      }
      
      return {
        ...prev,
        [chave]: novoStatus,
      };
    });
  };

  // 💾 Salva o diagnóstico E o status geral no Firestore
  const salvarAlteracoesAtivo = async () => {
    try {
      setSalvando(true);
      const ativoRef = doc(db, 'ativos', ativo.id);

      // Atualiza o documento com o novo status e o estado dos componentes
      await updateDoc(ativoRef, {
        status: statusGeral,
        componentes: ehComputador ? componentes : null,
      });

      Alert.alert('Sucesso', 'Registro atualizado com sucesso!');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', error?.message || 'Erro ao atualizar o ativo.');
    } finally {
      setSalvando(false);
    }
  };

  // Estilização visual dinâmica do Badge
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Disponível': return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'Ativo': return { bg: '#e3f2fd', text: '#1565c0' };
      case 'Manutenção': return { bg: '#fff3e0', text: '#ef6c00' };
      default: return { bg: '#f5f5f5', text: '#616161' };
    }
  };

  const badgeGeral = getStatusStyle(ativo.status);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onVoltar}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ficha do Ativo</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* CARD PRINCIPAL (Visualização Atual) */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.patrimonioText}>{ativo.patrimonio}</Text>
            <View style={[styles.badge, { backgroundColor: badgeGeral.bg }]}>
              <Text style={[styles.badgeText, { color: badgeGeral.text }]}>
                {ativo.status}
              </Text>
            </View>
          </View>
          <Text style={styles.tipoText}>{ativo.tipo}</Text>
          <Text style={styles.setorText}>📍 Setor: {ativo.setor}</Text>
        </View>

        {/* ⚙️ SEÇÃO: CONTROLE DE STATUS GERAL (Aparece para Admin alterar) */}
        {isAdmin && (
          <View style={styles.statusControlCard}>
            <Text style={styles.sectionTitle}>⚙️ Alterar Status do Aparelho</Text>
            <Text style={styles.helpText}>Selecione o novo estado do ativo na bancada:</Text>
            
            <View style={styles.statusButtonGroup}>
              {OPCOES_STATUS.map((opt) => {
                const estiloOpt = getStatusStyle(opt);
                const isActive = statusGeral === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.statusOptButton,
                      isActive && { backgroundColor: estiloOpt.bg, borderColor: estiloOpt.text }
                    ]}
                    onPress={() => setStatusGeral(opt)}
                  >
                    <Text style={[styles.statusOptText, isActive && { color: estiloOpt.text, fontWeight: '700' }]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 🩺 PAINEL DE HARDWARE */}
        {ehComputador && (
          <View style={styles.hardwareCard}>
            <Text style={styles.hardwareTitle}>🩺 Status de Hardware</Text>
            {isAdmin && (
              <Text style={styles.hardwareHelp}>
                Toque no componente para alternar entre OK e Defeito.
              </Text>
            )}

            {(Object.keys(componentes) as Array<keyof Componentes>).map((chave) => (
              <TouchableOpacity
                key={chave}
                style={styles.componentRow}
                disabled={!isAdmin}
                onPress={() => handleAlternarComponente(chave)}
              >
                <Text style={styles.componentName}>{NOMES_COMPONENTES[chave]}</Text>
                <View style={styles.statusIndicatorBox}>
                  <Text style={componentes[chave] === 'OK' ? styles.statusOk : styles.statusDefeito}>
                    {componentes[chave] === 'OK' ? '🟢 OK' : '🔴 Defeito'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* OBSERVAÇÕES TÉCNICAS */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Observações Técnicas</Text>
          <Text style={styles.infoText}>
            {ativo.descricao || 'Nenhuma observação informada.'}
          </Text>
        </View>

        {/* 💾 BOTÃO ÚNICO PARA SALVAR TUDO (Apenas Admin) */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.btnSalvarGeral}
            onPress={salvarAlteracoesAtivo}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnSalvarGeralText}>
                Salvar Alterações do Ativo
              </Text>
            )}
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb' },
  errorText: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backButton: { paddingVertical: 6, paddingHorizontal: 10 },
  backButtonText: { color: '#2f6ea8', fontWeight: '600', fontSize: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  content: { padding: 16 },
  
  // Cards
  mainCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  patrimonioText: { fontSize: 20, fontWeight: 'bold', color: '#2f6ea8' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  tipoText: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 6 },
  setorText: { fontSize: 14, color: '#64748b' },
  
  // Controle de Status Geral
  statusControlCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  helpText: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  statusButtonGroup: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statusOptButton: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  statusOptText: { fontSize: 13, color: '#475569', fontWeight: '500' },

  // Hardware Card
  hardwareCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, elevation: 2 },
  hardwareTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  hardwareHelp: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  componentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  componentName: { fontSize: 14, fontWeight: '500', color: '#334155' },
  statusIndicatorBox: { minWidth: 90, alignItems: 'flex-end' },
  statusOk: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  statusDefeito: { fontSize: 14, fontWeight: '700', color: '#dc2626' },
  
  // Info Card
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, elevation: 2 },
  infoTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#475569', lineHeight: 20 },
  
  // Botão Salvar Principal
  btnSalvarGeral: { backgroundColor: '#2f6ea8', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8, elevation: 2 },
  btnSalvarGeralText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});