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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

import { auth } from '../config/firebase';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // LOGIN
  const handleLogin = async () => {
    if (!username || !password) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      const email = `${username.trim().toLowerCase()}@ibametro.ba.gov.br`;
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login realizado com sucesso!');
    } catch (error: any) {
      console.log(error);
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        alert('Usuário ou senha inválidos');
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // REGISTRO
  const handleRegister = async () => {
    if (!username || !password) {
      alert('Preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      alert('A senha precisa ter no mínimo 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const email = `${username.trim().toLowerCase()}@ibametro.ba.gov.br`;
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Usuário criado com sucesso!');
    } catch (error: any) {
      console.log(error);
      if (error.code === 'auth/email-already-in-use') {
        alert('Usuário já cadastrado');
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
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
          placeholder="Usuário (Ex: fabio.admin)"
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
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        {/* 🔥 Botão de Registro visível e com rolagem garantida */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerText}>
            Criar novo usuário (Primeiro Acesso)
          </Text>
        </TouchableOpacity>
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
  registerButton: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  registerText: {
    color: '#e0f2fe',
    fontWeight: '800',
  },
});