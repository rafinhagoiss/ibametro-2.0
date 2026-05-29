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
import { registrarHistoricoAtivo } from '../features/ativos/historico/registrarHistoricoAtivo';
import { QrCodePatrimonioCard } from '../features/ativos/qrcode/components/QrCodePatrimonioCard';
import { ativoEhSwitch } from '../features/ativos/detalhe/utils';
import { SwitchPortasCard } from '../features/ativos/switches/SwitchPortasCard';

interface CadastroScreenProps {
  patrimonioPrePreenchido?: string;
  tipoPreSelecionado?: string;
  usuarioLogado: string;
  onVoltar: () => void;
}

type ComponenteKey =
  | 'memoriaRam'
  | 'placaMae'
  | 'armazenamento'
  | 'fonte';

export default function CadastroScreen({
  patrimonioPrePreenchido,
  tipoPreSelecionado,
  usuarioLogado,
  onVoltar,
}: CadastroScreenProps) {
  const [patrimonio, setPatrimonio] = useState(
    patrimonioPrePreenchido || '',
  );

  const [tipo, setTipo] = useState(tipoPreSelecionado || '');
  const [setor, setSetor] = useState('');
  const [status, setStatus] =
    useState('Disponível');

  const [descricao, setDescricao] =
    useState('');

  const [carregando, setCarregando] =
    useState(false);

  const [responsavel, setResponsavel] =
    useState('');

  const [contato, setContato] =
    useState('');

  const [hostname, setHostname] =
    useState('');

  const [ip, setIp] = useState('');

  const [mac, setMac] = useState('');
  const [totalPortas, setTotalPortas] = useState('');
  const [portasUsadas, setPortasUsadas] = useState('');
  const [portasOcupadas, setPortasOcupadas] = useState<number[]>([]);

  const [componentes, setComponentes] =
    useState({
      memoriaRam: 'OK',
      placaMae: 'OK',
      armazenamento: 'OK',
      fonte: 'OK',
    });

  const ehComputador =
    tipo.toLowerCase().includes(
      'computador',
    ) ||
    tipo.toLowerCase().includes(
      'notebook',
    ) ||
    tipo.toLowerCase().includes('pc');
  const ehSwitch = ativoEhSwitch(tipo);

  const alternarComponente = (
    chave: ComponenteKey,
  ) => {
    setComponentes((prev) => ({
      ...prev,

      [chave]:
        prev[chave] === 'OK'
          ? 'Defeito'
          : 'OK',
    }));
  };

  const handleSalvar = async () => {
    if (!patrimonio || !tipo || !setor) {
      alert(
        'Por favor, preencha os campos obrigatórios (*)',
      );

      return;
    }

    setCarregando(true);

    try {
      const patrimonioFormatado = patrimonio.trim().toUpperCase();
      const consultaDuplicado = query(
        collection(db, 'ativos'),
        where('patrimonio', '==', patrimonioFormatado),
      );
      const ativosDuplicados = await getDocs(consultaDuplicado);

      if (!ativosDuplicados.empty) {
        alert('Este patrimônio já está cadastrado no inventário.');
        return;
      }

      const dadosAtivo: any = {
        patrimonio:
          patrimonioFormatado,

        tipo: tipo.trim(),

        setor: setor.trim(),

        status,
        dataManutencao:
          status === 'Manutenção'
            ? serverTimestamp()
            : null,

        descricao:
          descricao.trim(),

        responsavel:
          responsavel.trim(),

        contato:
          contato.trim(),

        hostname:
          hostname.trim(),

        ip: ip.trim(),

        mac: mac
          .trim()
          .toUpperCase(),

        totalPortas:
          ehSwitch && totalPortas
            ? Number(totalPortas)
            : null,

        portasUsadas:
          ehSwitch && portasUsadas
            ? Number(portasUsadas)
            : null,

        portasOcupadas:
          ehSwitch
            ? portasOcupadas
            : [],

        dataCadastro:
          new Date().getTime(),

        dataAtualizacao:
          serverTimestamp(),

        criadoPor:
          usuarioLogado,

        atualizadoPor:
          usuarioLogado,

        deletado: false,
      };

      if (ehComputador) {
        dadosAtivo.componentes =
          componentes;
      }

      const docRef = await addDoc(
        collection(db, 'ativos'),
        dadosAtivo,
      );

      await registrarHistoricoAtivo({
        ativoId: docRef.id,
        patrimonio: patrimonioFormatado,
        acao: 'Cadastro criado',
        usuario: usuarioLogado,
        detalhes: `Tipo: ${tipo.trim()} | Setor: ${setor.trim()}`,
      });

      onVoltar();
    } catch (error: any) {
      console.log(error);

      alert(
        'Erro ao salvar no banco de dados: ' +
          error.message,
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onVoltar}
          disabled={carregando}
        >
          <Text style={styles.backButtonText}>
            ← Voltar
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Novo Ativo
        </Text>

        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={
            styles.formContainer
          }
        >
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nº de Patrimônio *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: INMETRO-241802"
              placeholderTextColor="#999"
              value={patrimonio}
              onChangeText={
                setPatrimonio
              }
              autoCapitalize="characters"
              editable={!carregando}
            />
          </View>

          <QrCodePatrimonioCard
            patrimonio={patrimonio}
            tipo={tipo}
            setor={setor}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Responsável pelo Ativo
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do colaborador"
              placeholderTextColor="#999"
              value={responsavel}
              onChangeText={
                setResponsavel
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Telefone/Contato
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: (71) 99999-9999"
              placeholderTextColor="#999"
              value={contato}
              onChangeText={setContato}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Equipamento / Tipo *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: Computador HP, Notebook Dell"
              placeholderTextColor="#999"
              value={tipo}
              onChangeText={setTipo}
              editable={!carregando}
            />
          </View>

          {ehSwitch && (
            <SwitchPortasCard
              totalPortas={totalPortas}
              portasUsadas={portasUsadas}
              portasOcupadas={portasOcupadas}
              onChangeTotalPortas={setTotalPortas}
              onChangePortasUsadas={setPortasUsadas}
              onChangePortasOcupadas={setPortasOcupadas}
            />
          )}

          {ehComputador && (
            <View style={styles.hardwareBox}>
              <Text
                style={styles.hardwareTitle}
              >
                🩺 Diagnóstico de Hardware
              </Text>

              <Text
                style={
                  styles.hardwareSubtitle
                }
              >
                Selecione as peças
                com defeito:
              </Text>

              <View
                style={styles.componentRow}
              >
                <Text
                  style={
                    styles.componentName
                  }
                >
                  Memória RAM
                </Text>

                <TouchableOpacity
                  style={[
                    styles.componentBadge,

                    componentes.memoriaRam ===
                      'Defeito' &&
                      styles.badgeDefeito,
                  ]}
                  onPress={() =>
                    alternarComponente(
                      'memoriaRam',
                    )
                  }
                >
                  <Text
                    style={[
                      styles.componentBadgeText,

                      componentes.memoriaRam ===
                        'Defeito' &&
                        styles.componentTextActive,
                    ]}
                  >
                    {
                      componentes.memoriaRam
                    }
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={styles.componentRow}
              >
                <Text
                  style={
                    styles.componentName
                  }
                >
                  Placa-Mãe
                </Text>

                <TouchableOpacity
                  style={[
                    styles.componentBadge,

                    componentes.placaMae ===
                      'Defeito' &&
                      styles.badgeDefeito,
                  ]}
                  onPress={() =>
                    alternarComponente(
                      'placaMae',
                    )
                  }
                >
                  <Text
                    style={[
                      styles.componentBadgeText,

                      componentes.placaMae ===
                        'Defeito' &&
                        styles.componentTextActive,
                    ]}
                  >
                    {
                      componentes.placaMae
                    }
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={styles.componentRow}
              >
                <Text
                  style={
                    styles.componentName
                  }
                >
                  Armazenamento
                  (HD/SSD)
                </Text>

                <TouchableOpacity
                  style={[
                    styles.componentBadge,

                    componentes.armazenamento ===
                      'Defeito' &&
                      styles.badgeDefeito,
                  ]}
                  onPress={() =>
                    alternarComponente(
                      'armazenamento',
                    )
                  }
                >
                  <Text
                    style={[
                      styles.componentBadgeText,

                      componentes.armazenamento ===
                        'Defeito' &&
                        styles.componentTextActive,
                    ]}
                  >
                    {
                      componentes.armazenamento
                    }
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={styles.componentRow}
              >
                <Text
                  style={
                    styles.componentName
                  }
                >
                  Fonte de Alimentação
                </Text>

                <TouchableOpacity
                  style={[
                    styles.componentBadge,

                    componentes.fonte ===
                      'Defeito' &&
                      styles.badgeDefeito,
                  ]}
                  onPress={() =>
                    alternarComponente(
                      'fonte',
                    )
                  }
                >
                  <Text
                    style={[
                      styles.componentBadgeText,

                      componentes.fonte ===
                        'Defeito' &&
                        styles.componentTextActive,
                    ]}
                  >
                    {componentes.fonte}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Infraestrutura de Rede
            </Text>

            <TextInput
              style={[
                styles.input,
                { marginBottom: 8 },
              ]}
              placeholder="Hostname (Ex: TI-NB-042)"
              placeholderTextColor="#999"
              value={hostname}
              onChangeText={setHostname}
            />

            <TextInput
              style={[
                styles.input,
                { marginBottom: 8 },
              ]}
              placeholder="IP (Ex: 192.168.1.50)"
              placeholderTextColor="#999"
              value={ip}
              onChangeText={setIp}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="MAC (Ex: AA:BB:CC:DD:EE:FF)"
              placeholderTextColor="#999"
              value={mac}
              onChangeText={setMac}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Setor de Alocação *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: TI / CPD"
              placeholderTextColor="#999"
              value={setor}
              onChangeText={setSetor}
              editable={!carregando}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Status Atual
            </Text>

            <View style={styles.statusRow}>
              {[
                'Disponível',
                'Ativo',
                'Manutenção',
              ].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.statusOption,

                    status === item &&
                      styles.statusOptionSelected,
                  ]}
                  onPress={() =>
                    setStatus(item)
                  }
                  disabled={carregando}
                >
                  <Text
                    style={[
                      styles.statusOptionText,

                      status === item &&
                        styles.statusOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Observações Técnicas
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              placeholder="Detalhes técnicos..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={descricao}
              onChangeText={
                setDescricao
              }
              editable={!carregando}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,

              carregando && {
                backgroundColor:
                  '#66bb6a',
              },
            ]}
            onPress={handleSalvar}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={
                  styles.saveButtonText
                }
              >
                Cadastrar Equipamento
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',

    alignItems: 'center',

    paddingHorizontal: 16,
    paddingVertical: 15,

    backgroundColor: '#fff',

    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },

  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  backButtonText: {
    color: '#2f6ea8',
    fontWeight: '600',
    fontSize: 15,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },

  input: {
    height: 48,

    backgroundColor: '#fff',

    borderWidth: 1,
    borderColor: '#cbd5e1',

    borderRadius: 8,

    paddingHorizontal: 16,

    fontSize: 15,
    color: '#334155',
  },

  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',

    gap: 8,
  },

  statusOption: {
    flex: 1,
    height: 40,

    backgroundColor: '#fff',

    borderWidth: 1,
    borderColor: '#cbd5e1',

    borderRadius: 8,

    justifyContent: 'center',
    alignItems: 'center',
  },

  statusOptionSelected: {
    backgroundColor: '#2f6ea8',
    borderColor: '#2f6ea8',
  },

  statusOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },

  statusOptionTextSelected: {
    color: '#fff',
  },

  saveButton: {
    height: 52,

    backgroundColor: '#2e7d32',

    borderRadius: 8,

    justifyContent: 'center',
    alignItems: 'center',

    marginTop: 15,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  hardwareBox: {
    backgroundColor: '#f8fafc',

    padding: 16,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: '#e2e8f0',

    marginBottom: 20,
  },

  hardwareTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },

  hardwareSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },

  componentRow: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    paddingVertical: 8,

    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },

  componentName: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },

  componentBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,

    borderRadius: 6,

    backgroundColor: '#e2e8f0',

    minWidth: 80,

    alignItems: 'center',
  },

  badgeDefeito: {
    backgroundColor: '#fee2e2',

    borderWidth: 1,
    borderColor: '#ef4444',
  },

  componentBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },

  componentTextActive: {
    color: '#b91c1c',
  },
});

