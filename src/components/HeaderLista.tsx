import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface HeaderListaProps {
  usuarioLogado: string;
  isAdmin: boolean;
  onPressScan: () => void;
  onPressAdd: () => void;
  onLogout: () => void;
}

export default function HeaderLista({
  usuarioLogado,
  isAdmin,
  onPressScan,
  onPressAdd,
  onLogout,
}: HeaderListaProps) {
  return (
    <View style={styles.headerContainer}>
      {/* Lado Esquerdo: Info do Usuário */}
      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>Olá, {usuarioLogado || 'Usuário'}</Text>
        <Text style={styles.roleText}>{isAdmin ? 'Administrador 🛠️' : 'Usuário comum'}</Text>
      </View>

      {/* Lado Direito: Ações (Scan, Adicionar, Sair) */}
      <View style={styles.actionButtons}>
        {/* Botão de Scan */}
        <TouchableOpacity style={styles.iconButton} onPress={onPressScan}>
          <MaterialCommunityIcons name="barcode-scan" size={22} color="#2f6ea8" />
        </TouchableOpacity>

        {/* Botão de Adicionar Ativo */}
        {isAdmin && (
          <TouchableOpacity style={styles.iconButton} onPress={onPressAdd}>
            <MaterialCommunityIcons name="plus-box" size={26} color="#2f6ea8" />
          </TouchableOpacity>
        )}

        {/* Linha divisória sutil antes do Sair */}
        <View style={styles.divider} />

        {/* Botão de Sair (Logoff) */}
        <TouchableOpacity style={styles.logoffButton} onPress={onLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f2742',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
  },
  roleText: {
    fontSize: 12,
    color: '#bae6fd',
    marginTop: 3,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 10,
    padding: 9,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginLeft: 12,
    marginRight: 6,
  },
  logoffButton: {
    padding: 9,
    borderRadius: 14,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
});
