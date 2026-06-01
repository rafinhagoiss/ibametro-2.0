import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView, // 🔥 Adicionado para garantir que tudo apareça na tela
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../config/firebase';
import {
  MENSAGEM_PADRAO_USUARIO,
  montarEmailInstitucional,
  usuarioSeguePadraoInstitucional,
} from '../features/usuarios/utils';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  // LOGIN
  const handleLogin = async () => {
    if (!username || !password) {
      setErro('Preencha usuário e senha.');
      setMensagem('');
      return;
    }

    if (!usuarioSeguePadraoInstitucional(username)) {
      setErro(MENSAGEM_PADRAO_USUARIO);
      setMensagem('');
      return;
    }

    try {
      setLoading(true);
      setErro('');
      setMensagem('Validando acesso...');
      const email = montarEmailInstitucional(username);
      const credencial = await signInWithEmailAndPassword(auth, email, password);
      const perfil = await getDoc(doc(db, 'usuarios', credencial.user.email?.toLowerCase() || email));

      if (!perfil.exists() || perfil.data().ativo === false) {
        await signOut(auth);
        setMensagem('');
        setErro('Este acesso não está ativo. Solicite ajuda ao administrador.');
        return;
      }

      setMensagem('Login realizado com sucesso.');
    } catch (error: any) {
      console.log(error);
      await signOut(auth).catch(() => undefined);
      setMensagem('');
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        setErro('Usuário ou senha inválidos.');
      } else {
        setErro(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperarSenha = async () => {
    if (!username || !usuarioSeguePadraoInstitucional(username)) {
      setErro(`Informe seu usuário. ${MENSAGEM_PADRAO_USUARIO}`);
      setMensagem('');
      return;
    }

    try {
      setRecuperandoSenha(true);
      setErro('');
      setMensagem('Enviando link de redefinição...');
      await sendPasswordResetEmail(auth, montarEmailInstitucional(username));
      setMensagem('Confira seu e-mail para criar uma nova senha.');
    } catch (error: any) {
      setMensagem('');
      setErro(error.code === 'auth/too-many-requests'
        ? 'Muitas tentativas em pouco tempo. Aguarde alguns minutos.'
        : 'Não foi possível enviar o link. Confira o usuário informado.');
    } finally {
      setRecuperandoSenha(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>IBAMETRO</Text>

        <TextInput
          style={styles.input}
          placeholder="Usuário ou e-mail institucional"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading || recuperandoSenha}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.recoverButton}
          onPress={handleRecuperarSenha}
          disabled={loading || recuperandoSenha}
        >
          <Text style={styles.recoverText}>{recuperandoSenha ? 'Enviando link...' : 'Esqueci minha senha'}</Text>
        </TouchableOpacity>

        {mensagem ? <Text style={styles.successText}>{mensagem}</Text> : null}
        {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 26,
    backgroundColor: '#0f2742',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 38,
    textAlign: 'center',
    color: '#ffffff',
    letterSpacing: 2,
  },
  input: {
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    fontSize: 15,
    color: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  button: {
    height: 58,
    backgroundColor: '#38bdf8',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonText: {
    color: '#082f49',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  recoverButton: {
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  recoverText: {
    color: '#bae6fd',
    fontSize: 14,
    fontWeight: '800',
  },
  successText: {
    color: '#bbf7d0',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 14,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 14,
  },
});
