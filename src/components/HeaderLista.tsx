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
        <Text style={styles.roleText}>{isAdmin ? 'Administrador 🛠️' : 'Técnico 💻'}</Text>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  roleText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 14,
    padding: 6,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#cbd5e1',
    marginLeft: 10,
    marginRight: 4,
  },
  logoffButton: {
    padding: 6,
    borderRadius: 6,
  },
});
