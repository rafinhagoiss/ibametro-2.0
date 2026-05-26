import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

// 📡 Importações do Firebase para buscar em tempo real
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Ativo {
  id: string;
  patrimonio: string;
  tipo: string;
  setor: string;
  status: string;
  descricao?: string;
}

interface ListaScreenProps {
  usuarioLogado: string;
  isAdmin: boolean;
  chamados: any[];
  onNavegarParaCadastro: () => void;
  onLogoff: () => void;
  onSelecionarAtivo: (ativo: Ativo) => void;
}

export default function ListaScreen({
  usuarioLogado,
  isAdmin,
  onNavegarParaCadastro,
  onLogoff,
  onSelecionarAtivo,
}: ListaScreenProps) {
  
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [carregando, setCarregando] = useState(true);

  // 🔄 Monitora a coleção 'ativos' do Firebase em tempo real
  useEffect(() => {
    const q = query(collection(db, 'ativos'), orderBy('patrimonio', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaAtivos: Ativo[] = [];
      snapshot.forEach((doc) => {
        listaAtivos.push({ id: doc.id, ...doc.data() } as Ativo);
      });
      setAtivos(listaAtivos);
      setCarregando(false);
    }, (error) => {
      console.log("Erro ao buscar ativos:", error);
      setCarregando(false);
    });

    return unsubscribe;
  }, []);

  // 🎨 Função para definir a cor do badge baseado no status do equipamento
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Disponível':
        return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'Ativo':
        return { bg: '#e3f2fd', text: '#1565c0' };
      case 'Manutenção':
        return { bg: '#fff3e0', text: '#ef6c00' };
      default:
        return { bg: '#f5f5f5', text: '#616161' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header com infos do usuário */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Olá, {usuarioLogado}</Text>
          <Text style={styles.roleText}>{isAdmin ? 'Administrador 🛠️' : 'Técnico 💻'}</Text>
        </View>
        <TouchableOpacity style={styles.logoffButton} onPress={onLogoff}>
          <Text style={styles.logoffText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo Principal */}
      {carregando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2f6ea8" />
          <Text style={styles.loadingText}>Carregando inventário...</Text>
        </View>
      ) : ativos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Nenhum equipamento cadastrado ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={ativos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const badge = getStatusStyle(item.status);
            return (
              <TouchableOpacity 
                style={styles.card} 
                onPress={() => onSelecionarAtivo(item)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.patrimonioText}>{item.patrimonio}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.tipoText}>{item.tipo}</Text>
                <Text style={styles.setorText}>📍 {item.setor}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Botão de Adicionar Ativo (Apenas visível se for Admin) */}
      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={onNavegarParaCadastro}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  welcomeText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  roleText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  logoffButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#fee2e2' },
  logoffText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 14 },
  emptyText: { color: '#64748b', fontSize: 15, textAlign: 'center' },
  listContainer: { padding: 16, paddingBottom: 90 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  patrimonioText: { fontSize: 16, fontWeight: 'bold', color: '#2f6ea8' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  tipoText: { fontSize: 15, color: '#334155', fontWeight: '500', marginBottom: 4 },
  setorText: { fontSize: 13, color: '#64748b' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f6ea8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginBottom: 2 },
});