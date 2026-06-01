import React, { useEffect, useState } from 'react';
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
import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db, firebaseConfig } from '../config/firebase';
import {
  MENSAGEM_PADRAO_USUARIO,
  montarEmailInstitucional,
  usuarioSeguePadraoInstitucional,
} from '../features/usuarios/utils';

type PerfilUsuario = 'admin' | 'usuario';

interface Usuario {
  id: string;
  email: string;
  nome?: string;
  role: PerfilUsuario | 'tecnico';
}

function traduzirErro(error: any) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'O e-mail informado não é válido.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/operation-not-allowed':
      return 'Ative o login por e-mail e senha no Firebase Authentication.';
    case 'auth/network-request-failed':
      return 'Não foi possível acessar o Firebase. Verifique a internet.';
    case 'auth/user-not-found':
      return 'Este usuário não foi encontrado no Firebase Authentication.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Sua conta não possui permissão de administrador no Firestore.';
    default:
      return error?.message || 'Não foi possível cadastrar o usuário.';
  }
}

export default function GerenciarUsuariosScreen({ onVoltar }: { onVoltar: () => void }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<PerfilUsuario>('usuario');
  const [salvando, setSalvando] = useState(false);
  const [erroLista, setErroLista] = useState('');
  const [erroCadastro, setErroCadastro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [emailRedefinindo, setEmailRedefinindo] = useState('');
  const [usuarioExclusao, setUsuarioExclusao] = useState<Usuario | null>(null);
  const [emailExcluindo, setEmailExcluindo] = useState('');

  useEffect(() => onSnapshot(
    collection(db, 'usuarios'),
    (snapshot) => {
      setUsuarios(snapshot.docs.map((item) => {
        const dados = item.data();
        const email = montarEmailInstitucional(typeof dados.email === 'string' ? dados.email : item.id);

        return {
          id: item.id,
          ...dados,
          email,
          role: dados.role || 'usuario',
        } as Usuario;
      }));
      setErroLista('');
    },
    (error) => setErroLista(traduzirErro(error)),
  ), []);

  const cadastrar = async () => {
    if (!nome.trim() || !usuario.trim() || senha.length < 6) {
      const mensagemErro = 'Informe nome completo, usuário e uma senha com pelo menos 6 caracteres.';
      setMensagem('');
      setErroCadastro(mensagemErro);
      Alert.alert('Revise os dados', mensagemErro);
      return;
    }

    if (!usuarioSeguePadraoInstitucional(usuario)) {
      const mensagemErro = MENSAGEM_PADRAO_USUARIO;
      setMensagem('');
      setErroCadastro(mensagemErro);
      Alert.alert('Revise os dados', mensagemErro);
      return;
    }

    const email = montarEmailInstitucional(usuario);
    const appSecundario = initializeApp(firebaseConfig, `cadastro-${Date.now()}`);
    const authSecundario = getAuth(appSecundario);
    let contaJaExistia = false;

    try {
      setSalvando(true);
      setErroCadastro('');
      setMensagem('Criando acesso no Firebase...');

      try {
        await createUserWithEmailAndPassword(authSecundario, email, senha);
      } catch (error: any) {
        if (error?.code === 'auth/email-already-in-use') {
          contaJaExistia = true;
        } else {
          throw error;
        }
      }

      await setDoc(doc(db, 'usuarios', email), {
        email,
        nome: nome.trim() || usuario.trim(),
        role,
        ativo: true,
        atualizadoEm: serverTimestamp(),
        ...(!contaJaExistia && { criadoEm: serverTimestamp() }),
      }, { merge: true });

      setNome('');
      setUsuario('');
      setSenha('');
      setRole('usuario');
      setMensagem(
        contaJaExistia
          ? 'Perfil de acesso recuperado e atualizado.'
          : 'Novo usuário criado com sucesso.',
      );
      Alert.alert(
        contaJaExistia ? 'Perfil atualizado' : 'Usuário criado',
        contaJaExistia
          ? 'A conta já existia no Firebase. O perfil de acesso foi corrigido.'
          : 'O novo acesso já pode entrar no aplicativo.',
      );
    } catch (error: any) {
      setMensagem('');
      const mensagemErro = traduzirErro(error);
      setErroCadastro(mensagemErro);
      Alert.alert('Erro ao cadastrar', mensagemErro);
    } finally {
      await signOut(authSecundario).catch(() => undefined);
      await deleteApp(appSecundario).catch(() => undefined);
      setSalvando(false);
    }
  };

  const enviarRedefinicaoSenha = async (email: string) => {
    try {
      setEmailRedefinindo(email);
      setErroCadastro('');
      setMensagem(`Enviando link de redefinição para ${email}...`);
      await sendPasswordResetEmail(auth, email);
      setMensagem(`Link para criar uma nova senha enviado para ${email}.`);
    } catch (error: any) {
      setMensagem('');
      setErroCadastro(traduzirErro(error));
    } finally {
      setEmailRedefinindo('');
    }
  };

  const excluirUsuarioComum = async () => {
    if (!usuarioExclusao || usuarioExclusao.role === 'admin') return;

    try {
      setEmailExcluindo(usuarioExclusao.email);
      setErroCadastro('');
      setMensagem(`Removendo o acesso de ${usuarioExclusao.email}...`);
      await deleteDoc(doc(db, 'usuarios', usuarioExclusao.id));
      setMensagem(`Acesso de ${usuarioExclusao.email} removido. Este usuário não poderá entrar no sistema.`);
      setUsuarioExclusao(null);
    } catch (error: any) {
      setMensagem('');
      setErroCadastro(traduzirErro(error));
    } finally {
      setEmailExcluindo('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar}><Text style={styles.back}>← Voltar</Text></TouchableOpacity>
        <Text style={styles.title}>Usuários</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Novo acesso</Text>
          <Text style={styles.subtitle}>Cadastre um acesso institucional ou corrija o perfil de uma conta existente.</Text>
          <TextInput style={styles.input} placeholder="Nome completo" value={nome} onChangeText={setNome} />
          <TextInput style={styles.input} placeholder="Usuário: nome.sobrenome" autoCapitalize="none" value={usuario} onChangeText={setUsuario} />
          <Text style={styles.fieldHint}>{MENSAGEM_PADRAO_USUARIO}</Text>
          <TextInput style={styles.input} placeholder="Senha inicial" secureTextEntry value={senha} onChangeText={setSenha} />
          <View style={styles.roleRow}>
            {(['usuario', 'admin'] as const).map((item) => (
              <TouchableOpacity key={item} style={[styles.roleButton, role === item && styles.roleSelected]} onPress={() => setRole(item)}>
                <Text style={[styles.roleText, role === item && styles.roleTextSelected]}>{item === 'admin' ? 'Administrador' : 'Usuário comum'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.createButton} onPress={cadastrar} disabled={salvando}>
            <Text style={styles.createText}>{salvando ? 'Cadastrando...' : 'Criar ou atualizar usuário'}</Text>
          </TouchableOpacity>
          {mensagem ? <Text style={styles.successText}>{mensagem}</Text> : null}
          {erroCadastro ? <Text style={styles.formErrorText}>{erroCadastro}</Text> : null}
        </View>

        <Text style={styles.listTitle}>Acessos cadastrados</Text>
        {erroLista ? <Text style={styles.errorText}>{erroLista}</Text> : null}
        {usuarioExclusao ? (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Excluir usuário comum?</Text>
            <Text style={styles.confirmText}>
              O acesso de {usuarioExclusao.email} será bloqueado. Os registros de inventário e chamados serão preservados.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setUsuarioExclusao(null)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteButton} onPress={excluirUsuarioComum} disabled={Boolean(emailExcluindo)}>
                <Text style={styles.confirmDeleteText}>{emailExcluindo ? 'Excluindo...' : 'Confirmar exclusão'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {usuarios.map((item) => (
          <View key={item.id} style={styles.userCard}>
            <View style={styles.userContent}>
              <Text style={styles.userName}>{item.nome || item.email}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              {!usuarioSeguePadraoInstitucional(item.email) ? <Text style={styles.legacyText}>Atualize este acesso para o formato nome.sobrenome.</Text> : null}
            </View>
            <View style={styles.userActions}>
              <Text style={styles.userRole}>{item.role === 'admin' ? 'Administrador' : 'Usuário comum'}</Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => enviarRedefinicaoSenha(item.email)}
                disabled={emailRedefinindo === item.email}
              >
                <Text style={styles.resetText}>
                  {emailRedefinindo === item.email ? 'Enviando...' : 'Redefinir senha'}
                </Text>
              </TouchableOpacity>
              {item.role !== 'admin' ? (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => setUsuarioExclusao(item)}
                  disabled={emailExcluindo === item.email}
                >
                  <Text style={styles.deleteText}>{emailExcluindo === item.email ? 'Excluindo...' : 'Excluir usuário'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#edf6ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#0f2742' },
  back: { color: '#bae6fd', fontWeight: '900' },
  title: { color: '#fff', fontSize: 19, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#bfdbfe' },
  sectionTitle: { color: '#0f2742', fontSize: 16, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 12 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, marginBottom: 10, backgroundColor: '#f8fafc' },
  fieldHint: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: -5, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  roleSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  roleText: { color: '#2563eb', fontWeight: '800' },
  roleTextSelected: { color: '#fff' },
  createButton: { minHeight: 46, marginTop: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#16a34a' },
  createText: { color: '#fff', fontWeight: '900' },
  listTitle: { color: '#0f2742', fontSize: 16, fontWeight: '900', marginTop: 22, marginBottom: 10 },
  errorText: { color: '#b91c1c', fontSize: 13, marginBottom: 10 },
  formErrorText: { color: '#b91c1c', fontSize: 13, fontWeight: '800', marginTop: 10 },
  successText: { color: '#15803d', fontSize: 13, fontWeight: '800', marginTop: 10 },
  userCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: 14, marginBottom: 8, borderRadius: 10, backgroundColor: '#fff' },
  userContent: { flex: 1 },
  userName: { color: '#1e293b', fontWeight: '800' },
  userEmail: { color: '#64748b', fontSize: 12, marginTop: 3 },
  legacyText: { maxWidth: 360, color: '#b45309', fontSize: 11, fontWeight: '800', marginTop: 5 },
  userActions: { alignItems: 'flex-end', gap: 8 },
  userRole: { color: '#1d4ed8', fontSize: 12, fontWeight: '900' },
  resetButton: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 7, borderWidth: 1, borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
  resetText: { color: '#1d4ed8', fontSize: 12, fontWeight: '900' },
  deleteButton: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 7, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  deleteText: { color: '#b91c1c', fontSize: 12, fontWeight: '900' },
  confirmCard: { padding: 14, marginTop: 8, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff7ed' },
  confirmTitle: { color: '#991b1b', fontWeight: '900' },
  confirmText: { color: '#7c2d12', fontSize: 12, lineHeight: 18, marginTop: 5 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  cancelButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  cancelText: { color: '#475569', fontWeight: '900' },
  confirmDeleteButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 7, backgroundColor: '#b91c1c' },
  confirmDeleteText: { color: '#fff', fontWeight: '900' },
});
