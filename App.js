import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth, db } from './src/config/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import { doc, getDoc } from 'firebase/firestore';

import PainelChamadosScreen from './src/screens/PainelChamadosScreen';
import LoginScreen from './src/screens/LoginScreen';
import ListaScreen from './src/screens/ListaScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import DetalheAtivoScreen from './src/screens/DetalheAtivoScreen';
import RelatoriosScreen from './src/screens/RelatoriosScreen';
import GerenciarUsuariosScreen from './src/screens/GerenciarUsuariosScreen';

export default function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [usuario, setUsuario] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [carregando, setCarregando] = useState(true); 
  const [ativoSelecionado, setAtivoSelecionado] = useState(null);
  const [patrimonioCadastro, setPatrimonioCadastro] = useState('');
  const [tipoCadastro, setTipoCadastro] = useState('');

  const abrirCadastro = (patrimonioPrePreenchido = '', tipoPreSelecionado = '') => {
    setPatrimonioCadastro(patrimonioPrePreenchido || '');
    setTipoCadastro(tipoPreSelecionado || '');
    setTelaAtual('cadastro');
  };

  const sair = async () => {
    await signOut(auth);
    setTelaAtual('login');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const emailCompleto = user.email || '';
        const nomeUsuario = emailCompleto.split('@')[0]; 

        try {
          const userDocRef = doc(db, 'usuarios', emailCompleto.toLowerCase());
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists() && userDocSnap.data().ativo !== false) {
            const dadosUsuario = userDocSnap.data();
            setIsAdmin(dadosUsuario.role === 'admin');
          } else {
            await signOut(auth);
            setUsuario('');
            setIsAdmin(false);
            setTelaAtual('login');
            setCarregando(false);
            return;
          }
        } catch (error) {
          console.log("Erro ao buscar acesso:", error);
          await signOut(auth).catch(() => undefined);
          setUsuario('');
          setIsAdmin(false);
          setTelaAtual('login');
          setCarregando(false);
          return;
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

  // ⏳ 1º: Se estiver carregando a autenticação do Firebase, mostra o Spinner primeiro
  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb' }}>
        <ActivityIndicator size="large" color="#2f6ea8" />
      </View>
    );
  }
  
  // 🚪 RENDERIZAÇÃO DAS TELAS (Só executa após o carregamento finalizar)
  if (telaAtual === 'login') return <LoginScreen />; 
  
  if (telaAtual === 'cadastro') {
    return (
      <CadastroScreen
        patrimonioPrePreenchido={patrimonioCadastro}
        tipoPreSelecionado={tipoCadastro}
        usuarioLogado={usuario}
        onVoltar={() => setTelaAtual('lista')}
      />
    );
  }
  
  // 📊 DASHBOARD GERAL DE CHAMADOS
  if (telaAtual === 'painelChamados') {
    return (
      <PainelChamadosScreen 
        usuarioLogado={usuario}
        onVoltar={() => setTelaAtual('lista')} 
      />
    );
  }

  if (telaAtual === 'relatorios') {
    return (
      <RelatoriosScreen 
        onVoltar={() => setTelaAtual('lista')} 
      />
    );
  }

  if (telaAtual === 'usuarios') {
    return <GerenciarUsuariosScreen onVoltar={() => setTelaAtual('lista')} />;
  }

  if (telaAtual === 'detalhes') {
    return (
      <DetalheAtivoScreen 
        ativo={ativoSelecionado}
        isAdmin={isAdmin} 
        usuarioLogado={usuario} 
        onVoltar={() => setTelaAtual('lista')}
      />
    );
  }

  if (telaAtual === 'lista') {
    return (
      <ListaScreen 
        usuarioLogado={usuario} // 🔥 Garanta que adicionou essa linha aqui!
        isAdmin={isAdmin}
        onSelecionarAtivo={(ativo) => {
          setAtivoSelecionado(ativo);
          setTelaAtual('detalhes');
        }}
        onIrParaCadastro={abrirCadastro}
        onIrParaRelatorios={() => setTelaAtual('relatorios')}
        onIrParaPainelChamados={() => setTelaAtual('painelChamados')} 
        onIrParaUsuarios={() => setTelaAtual('usuarios')}
        onLogout={sair}
      />
    );
  }
}
