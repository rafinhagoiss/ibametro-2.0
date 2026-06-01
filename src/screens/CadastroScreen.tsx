import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { db } from '../config/firebase';
import { TelaArquimedesCard } from '../features/ativos/arquimedes/TelaArquimedesCard';
import { HardwareCadastroCard } from '../features/ativos/cadastro/components/HardwareCadastroCard';
import {
  ativoEhArquimedes,
  ativoEhComputador,
  ativoEhSwitch,
} from '../features/ativos/detalhe/utils';
import { registrarHistoricoAtivo } from '../features/ativos/historico/registrarHistoricoAtivo';
import { QrCodePatrimonioCard } from '../features/ativos/qrcode/components/QrCodePatrimonioCard';
import { SwitchPortasCard } from '../features/ativos/switches/SwitchPortasCard';
import type { Componentes, StatusTela } from '../types/ativo';

interface Props {
  patrimonioPrePreenchido?: string;
  tipoPreSelecionado?: string;
  usuarioLogado: string;
  onVoltar: () => void;
}

const COMPONENTES_PADRAO: Componentes = {
  memoriaRam: 'OK',
  placaMae: 'OK',
  armazenamento: 'OK',
  fonte: 'OK',
};

interface CampoProps {
  label: string;
  value: string;
  onChangeText: (valor: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  editable?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
}

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  multiline,
  editable = true,
  keyboardType = 'default',
}: CampoProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={label === 'MAC' || label.includes('Patrimônio') ? 'characters' : 'sentences'}
      />
    </View>
  );
}

export default function CadastroScreen({
  patrimonioPrePreenchido,
  tipoPreSelecionado,
  usuarioLogado,
  onVoltar,
}: Props) {
  const [patrimonio, setPatrimonio] = useState(patrimonioPrePreenchido || '');
  const [tipo, setTipo] = useState(tipoPreSelecionado || '');
  const [setor, setSetor] = useState('');
  const [status, setStatus] = useState('Disponível');
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [contato, setContato] = useState('');
  const [hostname, setHostname] = useState('');
  const [ip, setIp] = useState('');
  const [mac, setMac] = useState('');
  const [totalPortas, setTotalPortas] = useState('');
  const [portasUsadas, setPortasUsadas] = useState('');
  const [portasOcupadas, setPortasOcupadas] = useState<number[]>([]);
  const [componentes, setComponentes] = useState<Componentes>(COMPONENTES_PADRAO);
  const [tela, setTela] = useState<StatusTela>('OK');
  const [carregando, setCarregando] = useState(false);

  const ehComputador = ativoEhComputador(tipo);
  const ehArquimedes = ativoEhArquimedes(tipo);
  const ehSwitch = ativoEhSwitch(tipo);

  const alternarComponente = (chave: keyof Componentes) => {
    setComponentes((atual) => ({
      ...atual,
      [chave]: atual[chave] === 'OK' ? 'Defeito' : 'OK',
    }));
  };

  const handleSalvar = async () => {
    if (!patrimonio.trim() || !tipo.trim() || !setor.trim()) {
      alert('Preencha os campos obrigatórios (*).');
      return;
    }

    setCarregando(true);

    try {
      const patrimonioFormatado = patrimonio.trim().toUpperCase();
      const duplicados = await getDocs(
        query(collection(db, 'ativos'), where('patrimonio', '==', patrimonioFormatado)),
      );

      if (!duplicados.empty) {
        alert('Este patrimônio já está cadastrado no inventário.');
        return;
      }

      const temDefeito =
        (ehComputador && Object.values(componentes).includes('Defeito')) ||
        (ehArquimedes && tela === 'Danificada');
      const statusFinal = temDefeito ? 'Manutenção' : status;
      const dadosAtivo = {
        patrimonio: patrimonioFormatado,
        tipo: tipo.trim(),
        setor: setor.trim(),
        status: statusFinal,
        dataManutencao: statusFinal === 'Manutenção' ? serverTimestamp() : null,
        descricao: descricao.trim(),
        responsavel: responsavel.trim(),
        contato: contato.trim(),
        hostname: hostname.trim(),
        ip: ip.trim(),
        mac: mac.trim().toUpperCase(),
        totalPortas: ehSwitch && totalPortas ? Number(totalPortas) : null,
        portasUsadas: ehSwitch && portasUsadas ? Number(portasUsadas) : null,
        portasOcupadas: ehSwitch ? portasOcupadas : [],
        componentes: ehComputador ? componentes : null,
        tela: ehArquimedes ? tela : null,
        dataCadastro: Date.now(),
        dataAtualizacao: serverTimestamp(),
        criadoPor: usuarioLogado,
        atualizadoPor: usuarioLogado,
        deletado: false,
      };
      const docRef = await addDoc(collection(db, 'ativos'), dadosAtivo);

      await registrarHistoricoAtivo({
        ativoId: docRef.id,
        patrimonio: patrimonioFormatado,
        acao: 'Cadastro criado',
        usuario: usuarioLogado,
        detalhes: `Tipo: ${tipo.trim()} | Setor: ${setor.trim()}`,
      });
      onVoltar();
    } catch (error: any) {
      alert(`Erro ao salvar no banco de dados: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onVoltar} disabled={carregando}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Novo Ativo</Text>
        <View style={{ width: 68 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <Campo label="Nº de Patrimônio" required value={patrimonio} onChangeText={setPatrimonio} placeholder="Ex: IBAMETRO-241802" editable={!carregando} />
          <QrCodePatrimonioCard patrimonio={patrimonio} tipo={tipo} setor={setor} />
          <Campo label="Equipamento / Tipo" required value={tipo} onChangeText={setTipo} placeholder="Ex: Computador, Switch ou Arquimedes" editable={!carregando} />
          <Campo label="Responsável pelo Ativo" value={responsavel} onChangeText={setResponsavel} placeholder="Nome do colaborador" />
          <Campo label="Telefone / Contato" value={contato} onChangeText={setContato} placeholder="Ex: (71) 99999-9999" keyboardType="phone-pad" />

          {ehSwitch && <SwitchPortasCard totalPortas={totalPortas} portasUsadas={portasUsadas} portasOcupadas={portasOcupadas} onChangeTotalPortas={setTotalPortas} onChangePortasUsadas={setPortasUsadas} onChangePortasOcupadas={setPortasOcupadas} />}
          {ehComputador && <HardwareCadastroCard componentes={componentes} onAlternar={alternarComponente} />}
          {ehArquimedes && <TelaArquimedesCard tela={tela} onChangeTela={setTela} />}

          <Text style={styles.sectionTitle}>Infraestrutura de Rede</Text>
          <Campo label="Hostname" value={hostname} onChangeText={setHostname} placeholder="Ex: TI-NB-042" />
          <Campo label="IP" value={ip} onChangeText={setIp} placeholder="Ex: 192.168.1.50" keyboardType="numeric" />
          <Campo label="MAC" value={mac} onChangeText={setMac} placeholder="Ex: AA:BB:CC:DD:EE:FF" />
          <Campo label="Setor de Alocação" required value={setor} onChangeText={setSetor} placeholder="Ex: TI / CPD" editable={!carregando} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status Atual</Text>
            <View style={styles.statusRow}>
              {['Disponível', 'Ativo', 'Manutenção'].map((item) => (
                <TouchableOpacity key={item} style={[styles.statusOption, status === item && styles.statusOptionSelected]} onPress={() => setStatus(item)}>
                  <Text style={[styles.statusText, status === item && styles.statusTextSelected]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Campo label="Observações Técnicas" value={descricao} onChangeText={setDescricao} placeholder="Detalhes técnicos..." multiline />
          <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={carregando}>
            {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Cadastrar Equipamento</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#edf6ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#0f2742' },
  backButton: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.10)' },
  backButtonText: { color: '#bae6fd', fontWeight: '900', fontSize: 15 },
  title: { fontSize: 19, fontWeight: '900', color: '#fff' },
  formContainer: { padding: 16, paddingBottom: 44 },
  inputGroup: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#dbeafe' },
  label: { fontSize: 13, fontWeight: '900', color: '#0f2742', marginBottom: 8 },
  input: { minHeight: 48, backgroundColor: '#f8fbff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, paddingHorizontal: 14, color: '#0f172a', fontSize: 14 },
  textArea: { minHeight: 104, paddingTop: 12, textAlignVertical: 'top' },
  sectionTitle: { color: '#0f2742', fontSize: 16, fontWeight: '900', marginTop: 4, marginBottom: 10 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusOption: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  statusOptionSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  statusText: { color: '#2563eb', fontSize: 12, fontWeight: '900' },
  statusTextSelected: { color: '#fff' },
  saveButton: { height: 56, borderRadius: 16, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
