import React, { useState, useEffect } from 'react';
import HeaderLista from '../components/HeaderLista';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';

// 📸 Importação da Câmera do Expo
import { CameraView, useCameraPermissions } from 'expo-camera';

// 📡 Importações do Firebase
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';

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
  onSelecionarAtivo: (ativo: Ativo) => void;
  onIrParaCadastro: (patrimonioPrePreenchido?: string) => void; 
  onIrParaPainelChamados: () => void; 
  onLogout: () => void;
}

export default function ListaScreen({
  usuarioLogado,
  isAdmin,
  onSelecionarAtivo,
  onIrParaCadastro,
  onIrParaPainelChamados,
  onLogout,
}: ListaScreenProps) {
  
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusSelecionado, setStatusSelecionado] = useState('Todos');

  // 🏪 ESTADOS DO SCANNER
  const [modalScannerVisivel, setModalScannerVisivel] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scaneado, setScaneado] = useState(false);

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

  // 🔍 FUNÇÃO DE BUSCA DO PRODUTO APÓS ESCANEAR
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScaneado(true); 
    setModalScannerVisivel(false); 

    const codigoLimpo = data.trim();
    const patrimonioFormatado = codigoLimpo.toUpperCase().startsWith('INMETRO-') 
      ? codigoLimpo 
      : `INMETRO-${codigoLimpo}`;
    
    try {
      setCarregando(true);
      
      const q = query(collection(db, 'ativos'), where('patrimonio', '==', patrimonioFormatado));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docEncontrado = querySnapshot.docs[0];
        const ativoEncontrado = { id: docEncontrado.id, ...docEncontrado.data() } as Ativo;
        
        onSelecionarAtivo(ativoEncontrado);
      } else {
        Alert.alert(
          'Equipamento não cadastrado',
          `O patrimônio "${patrimonioFormatado}" não foi encontrado. Deseja cadastrá-lo agora?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Cadastrar', 
              onPress: () => onIrParaCadastro(patrimonioFormatado) 
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar o código no banco.');
      console.error(error);
    } finally {
      setCarregando(false);
      setScaneado(false);
    }
  };

  // 🔒 FUNÇÃO PARA ABRIR O SCANNER COM PERMISSÃO
  const abrirScanner = async () => {
    if (!permission?.granted) {
      const p = await requestPermission();
      if (!p.granted) {
        Alert.alert('Permissão Negada', 'Precisamos de acesso à câmera para ler os códigos.');
        return;
      }
    }
    setScaneado(false);
    setModalScannerVisivel(true);
  };

  const ativosFiltrados = ativos.filter((ativo) => {
    const textoBusca = busca.toLowerCase().trim();
    const matchesTexto = 
      ativo.patrimonio.toLowerCase().includes(textoBusca) ||
      ativo.tipo.toLowerCase().includes(textoBusca) ||
      ativo.setor.toLowerCase().includes(textoBusca);
    const matchesStatus = statusSelecionado === 'Todos' || ativo.status === statusSelecionado;
    return matchesTexto && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Disponível': return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'Ativo': return { bg: '#e3f2fd', text: '#1565c0' };
      case 'Manutenção': return { bg: '#fff3e0', text: '#ef6c00' };
      default: return { bg: '#f5f5f5', text: '#616161' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* CABEÇALHO UNIFICADO INTEGRADO */}
      <HeaderLista 
        usuarioLogado={usuarioLogado}
        isAdmin={isAdmin}
        onPressScan={abrirScanner} 
        onPressAdd={() => onIrParaCadastro()} // 👈 CORRIGIDO: Isolado com arrow function
        onLogout={onLogout}           
      />

      {/* BOTÃO PARA ABRIR O DASHBOARD */}
      <TouchableOpacity style={styles.dashboardButton} onPress={onIrParaPainelChamados}>
        <Text style={styles.dashboardButtonText}>📊 Acessar Central de Chamados</Text>
      </TouchableOpacity>

      {/* 🔍 BARRA DE BUSCA E FILTROS */}
      <View style={styles.searchFilterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔎 Buscar por patrimônio, tipo ou setor..."
          placeholderTextColor="#94a3b8"
          value={busca}
          onChangeText={setBusca}
          clearButtonMode="while-editing"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView} contentContainerStyle={styles.filterContentContainer}>
          {['Todos', 'Disponível', 'Ativo', 'Manutenção'].map((status) => {
            const isActive = statusSelecionado === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterPill, isActive && styles.filterPillActive, isActive && status !== 'Todos' && { backgroundColor: getStatusStyle(status).bg, borderColor: getStatusStyle(status).text }]}
                onPress={() => setStatusSelecionado(status)}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive, isActive && status !== 'Todos' && { color: getStatusStyle(status).text }]}>
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 🧾 LISTAGEM */}
      {carregando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2f6ea8" />
          <Text style={styles.loadingText}>Carregando inventário...</Text>
        </View>
      ) : ativos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Nenhum equipamento cadastrado ainda.</Text>
        </View>
      ) : ativosFiltrados.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Nenhum equipamento corresponde aos filtros. 🔎</Text>
        </View>
      ) : (
        <FlatList
          data={ativosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const badge = getStatusStyle(item.status);
            return (
              <TouchableOpacity style={styles.card} onPress={() => onSelecionarAtivo(item)}>
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

      {/* 📸 MODAL DO SCANNER */}
      <Modal visible={modalScannerVisivel} animationType="slide" transparent={false}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'itf14', 'codabar', 'qr', 'pdf417'],
          }}
          onBarcodeScanned={scaneado ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlayContainer}>
            <Text style={styles.scanInstructions}>Alinhe a linha vermelha com o código de barras</Text>
            
            <View style={styles.scanTarget}>
              <View style={styles.scanLaser} />
            </View>

            <TouchableOpacity 
              style={styles.closeScanButton} 
              onPress={() => setModalScannerVisivel(false)}
            >
              <Text style={styles.closeScanText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </Modal>

      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={() => onIrParaCadastro()}> {/* 👈 CORRIGIDO: Isolado com arrow function */}
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  dashboardButton: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  dashboardButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  searchFilterContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 14, color: '#334155' },
  filterScrollView: { marginTop: 8, marginBottom: 4 },
  filterContentContainer: { gap: 8, paddingRight: 16 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1' },
  filterPillActive: { backgroundColor: '#2f6ea8', borderColor: '#2f6ea8' },
  filterPillText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterPillTextActive: { color: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 14 },
  emptyText: { color: '#64748b', fontSize: 15, textAlign: 'center' },
  listContainer: { padding: 16, paddingBottom: 90 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  patrimonioText: { fontSize: 16, fontWeight: 'bold', color: '#2f6ea8' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  tipoText: { fontSize: 15, color: '#334155', fontWeight: '500', marginBottom: 4 },
  setorText: { fontSize: 13, color: '#64748b' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2f6ea8', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginBottom: 2 },
  
  // 📸 ESTILOS EXTRAS DO OVERLAY DA CÂMERA
  overlayContainer: { 
    flex: 1, 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 50, 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  scanInstructions: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 20 
  },
  scanTarget: { 
    width: 320, 
    height: 140, 
    borderWidth: 2, 
    borderColor: '#2f6ea8', 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'transparent' 
  },
  scanLaser: {
    width: '90%',
    height: 2,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  closeScanButton: { 
    backgroundColor: '#ef4444', 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 25 
  },
  closeScanText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});