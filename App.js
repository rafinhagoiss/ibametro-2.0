import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth, db } from './src/config/firebase'; 
import { onAuthStateChanged } from 'firebase/auth'; 
import { doc, getDoc } from 'firebase/firestore'; 

import LoginScreen from './src/screens/LoginScreen';
import ListaScreen from './src/screens/ListaScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import DetalheAtivoScreen from './src/screens/DetalheAtivoScreen';

export default function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [usuario, setUsuario] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [carregando, setCarregando] = useState(true); 
  const [ativoSelecionado, setAtivoSelecionado] = useState(null);
  const [chamados, setChamados] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const emailCompleto = user.email || '';
        const nomeUsuario = emailCompleto.split('@')[0]; 

        try {
          const userDocRef = doc(db, 'usuarios', emailCompleto.toLowerCase());
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const dadosUsuario = userDocSnap.data();
            setIsAdmin(dadosUsuario.role === 'admin');
          } else {
            setIsAdmin(false); 
          }
        } catch (error) {
          console.log("Erro ao buscar acesso:", error);
          setIsAdmin(false);
        }
        setUsuario(nomeUsuario);
        setTelaAtual('lista');
      } else {
        setUsuario('');
        setIsAdmin(false);
        setTelaAtual('login');
      }
      setCarregando(false);
    });

    return unsubscribe; 
  }, []);

  const handleVerDetalhes = (ativo) => {
    setAtivoSelecionado(ativo);
    setTelaAtual('detalhes');
  };

  const handleAbrirChamado = (idAtivo, descricaoProblema) => {
    setChamados((chamadosAtuais) => [
      ...chamadosAtuais,
      { id: Math.random().toString(), idAtivo, usuario, descricaoProblema, status: 'Pendente' }
    ]);
    setTelaAtual('lista');
  };

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb' }}>
        <ActivityIndicator size="large" color="#2f6ea8" />
      </View>
    );
  }

  if (telaAtual === 'login') return <LoginScreen />; 
  if (telaAtual === 'cadastro') return <CadastroScreen onVoltar={() => setTelaAtual('lista')} />;
  if (telaAtual === 'detalhes') {
    return (
      <DetalheAtivoScreen 
        ativo={ativoSelecionado}
        isAdmin={isAdmin} 
        chamados={chamados} 
        onAtualizarStatus={() => setTelaAtual('lista')}
        onAbrirChamado={handleAbrirChamado} 
        onVoltar={() => setTelaAtual('lista')}
      />
    );
  }

  return (
    <ListaScreen 
      usuarioLogado={usuario} 
      isAdmin={isAdmin} 
      chamados={chamados} 
      onNavegarParaCadastro={() => setTelaAtual('cadastro')} 
      onLogoff={() => auth.signOut()} 
      onSelecionarAtivo={handleVerDetalhes}
    />
  );
}