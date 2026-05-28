import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';

import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

type Componentes = {
  memoriaRam: string;
  placaMae: string;
  armazenamento: string;
  fonte: string;
};

interface Ativo {
  id: string;
  patrimonio: string;
  tipo: string;
  setor: string;
  status: string;
  descricao?: string;
  componentes?: Componentes | null;
  deletado?: boolean;
  responsavel?: string;
  matricula?: string;

  hostname?: string;
  ip?: string;
  mac?: string;
  vlan?: string;
  portaSwitch?: string;
}

interface Props {
  ativo: Ativo | null;
  isAdmin: boolean;
  usuarioLogado: string;
  onVoltar: () => void;
}

const COMPONENTES_PADRAO: Componentes = {
  memoriaRam: 'OK',
  placaMae: 'OK',
  armazenamento: 'OK',
  fonte: 'OK',
};

const NOMES_COMPONENTES: Record<keyof Componentes, string> = {
  memoriaRam: 'Memória RAM',
  placaMae: 'Placa-Mãe',
  armazenamento: 'Armazenamento',
  fonte: 'Fonte',
};

export default function DetalheAtivoScreen({
  ativo,
  usuarioLogado,
  onVoltar,
}: Props) {

  const [salvando, setSalvando] = useState(false);

  const [statusGeral, setStatusGeral] = useState('Disponível');

  const [componentes, setComponentes] =
    useState<Componentes>(COMPONENTES_PADRAO);

  const [responsavel, setResponsavel] = useState('');
  const [matricula, setMatricula] = useState('');

  const [infra, setInfra] = useState({
    hostname: '',
    ip: '',
    mac: '',
    vlan: '',
    portaSwitch: '',
  });

  const [listaNotas, setListaNotas] = useState<string[]>([]);
  const [novaObservacao, setNovaObservacao] = useState('');

  useEffect(() => {
    if (!ativo) return;

    setStatusGeral(ativo.status || 'Disponível');

    setResponsavel(ativo.responsavel || '');
    setMatricula(ativo.matricula || '');

    setComponentes(
      ativo.componentes || COMPONENTES_PADRAO
    );

    setInfra({
      hostname: ativo.hostname || '',
      ip: ativo.ip || '',
      mac: ativo.mac || '',
      vlan: ativo.vlan || '',
      portaSwitch: ativo.portaSwitch || '',
    });

    if (ativo.descricao) {
      setListaNotas(
        ativo.descricao
          .split('\n')
          .filter((linha) => linha.trim() !== '')
      );
    } else {
      setListaNotas([]);
    }

  }, [ativo]);

  if (!ativo) {
    return (
      <View style={styles.center}>
        <Text>Nenhum ativo selecionado.</Text>
      </View>
    );
  }

  const tipoNormalizado =
    ativo.tipo?.toLowerCase() || '';

  const ehComputador =
    tipoNormalizado.includes('pc') ||
    tipoNormalizado.includes('computador') ||
    tipoNormalizado.includes('notebook');

  const gerarCarimbo = () => {
    const agora = new Date();

    const operador =
      usuarioLogado?.split('@')[0] || 'Tecnico';

    return `[${agora.toLocaleDateString()} ${agora.toLocaleTimeString()}] ${operador}:`;
  };

  const handleAlternarComponente = (
    chave: keyof Componentes
  ) => {

    setComponentes((prev) => {

      const novoValor =
        prev[chave] === 'OK'
          ? 'Defeito'
          : 'OK';

      const novos = {
        ...prev,
        [chave]: novoValor,
      };

      const temDefeito =
        Object.values(novos).includes('Defeito');

      // 🔥 inteligência do status
      if (temDefeito) {
        setStatusGeral('Manutenção');
      } else {

        // se não tiver defeito
        if (responsavel.trim() !== '') {
          setStatusGeral('Ativo');
        } else {
          setStatusGeral('Disponível');
        }
      }

      return novos;
    });
  };

  const adicionarNota = async () => {

    if (novaObservacao.trim() === '') return;

    const novaLinha =
      `${gerarCarimbo()} ${novaObservacao}`;

    const novaLista = [
      ...listaNotas,
      novaLinha,
    ];

    setListaNotas(novaLista);
    setNovaObservacao('');

    try {

      await updateDoc(
        doc(db, 'ativos', ativo.id),
        {
          descricao: novaLista.join('\n'),
        }
      );

    } catch (e) {
      Alert.alert(
        'Erro',
        'Falha ao salvar nota.'
      );
    }
  };

  const salvarAlteracoes = async () => {

    try {

      setSalvando(true);

      let statusFinal = statusGeral;

      const temDefeito =
        Object.values(componentes)
          .includes('Defeito');

      if (temDefeito) {

        statusFinal = 'Manutenção';

      } else {

        if (responsavel.trim() !== '') {
          statusFinal = 'Ativo';
        } else {
          statusFinal = 'Disponível';
        }
      }

      await updateDoc(
        doc(db, 'ativos', ativo.id),
        {

          status: statusFinal,

          componentes:
            ehComputador
              ? componentes
              : null,

          responsavel:
            responsavel.trim(),

          matricula:
            matricula.trim(),

          hostname:
            infra.hostname,

          ip:
            infra.ip,

          mac:
            infra.mac,

          vlan:
            infra.vlan,

          portaSwitch:
            infra.portaSwitch,

          descricao:
            listaNotas.join('\n'),
        }
      );

      Alert.alert(
        'Sucesso',
        'Alterações salvas.'
      );

      onVoltar();

    } catch (e) {

      Alert.alert(
        'Erro',
        'Falha ao salvar.'
      );

    } finally {

      setSalvando(false);

    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>

        <TouchableOpacity
          onPress={onVoltar}
        >
          <Text style={styles.back}>
            ← Voltar
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Ficha do Ativo
        </Text>

        <View style={{ width: 70 }} />

      </View>

      <ScrollView
        contentContainerStyle={styles.content}
      >

        {/* CARD PRINCIPAL */}
        <View style={styles.card}>

          <Text style={styles.patrimonio}>
            {ativo.patrimonio}
          </Text>

          <Text style={styles.tipo}>
            {ativo.tipo}
          </Text>

          <Text style={styles.setor}>
            📍 {ativo.setor}
          </Text>

          <View
            style={[
              styles.badge,
              statusGeral === 'Manutenção'
                ? styles.badgeManutencao
                : statusGeral === 'Ativo'
                ? styles.badgeAtivo
                : styles.badgeDisponivel,
            ]}
          >
            <Text style={styles.badgeText}>
              {statusGeral}
            </Text>
          </View>

        </View>

        {/* RESPONSÁVEL */}
        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            🤝 Responsável
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={responsavel}
            onChangeText={setResponsavel}
          />

          <TextInput
            style={styles.input}
            placeholder="Matrícula"
            value={matricula}
            onChangeText={setMatricula}
          />

        </View>

        {/* REDE */}
        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            🌐 Infraestrutura
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Hostname"
            value={infra.hostname}
            onChangeText={(t) =>
              setInfra({
                ...infra,
                hostname: t,
              })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="IP"
            value={infra.ip}
            onChangeText={(t) =>
              setInfra({
                ...infra,
                ip: t,
              })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="MAC"
            value={infra.mac}
            onChangeText={(t) =>
              setInfra({
                ...infra,
                mac: t,
              })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="VLAN"
            value={infra.vlan}
            onChangeText={(t) =>
              setInfra({
                ...infra,
                vlan: t,
              })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Porta Switch"
            value={infra.portaSwitch}
            onChangeText={(t) =>
              setInfra({
                ...infra,
                portaSwitch: t,
              })
            }
          />

        </View>

{/* HARDWARE */}
{ehComputador && (
  <View style={styles.card}>

    <Text style={styles.sectionTitle}>
      🩺 Hardware
    </Text>

    {(Object.keys(componentes) as Array<keyof Componentes>).map((chave) => {
      const nomeComponente = NOMES_COMPONENTES[chave];
      const valorComponente = componentes[chave];
      const estiloValor = valorComponente === 'OK' ? styles.ok : styles.defeito;

      return (
        <TouchableOpacity
          key={chave}
          style={styles.componentRow}
          onPress={() => handleAlternarComponente(chave)}
        >
          <Text style={styles.componentName}>
            {nomeComponente}
          </Text>
          <Text style={estiloValor}>
            {valorComponente}
          </Text>
        </TouchableOpacity>
      );
    })}

  </View>
)}

        {/* NOTAS */}
        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            📋 Observações
          </Text>

          {listaNotas.map((nota, index) => (
            <Text
              key={index}
              style={styles.nota}
            >
              {nota}
            </Text>
          ))}

          <TextInput
            style={styles.textArea}
            placeholder="Nova observação..."
            multiline
            value={novaObservacao}
            onChangeText={setNovaObservacao}
          />

          <TouchableOpacity
            style={styles.btnNota}
            onPress={adicionarNota}
          >
            <Text style={styles.btnText}>
              Adicionar Nota
            </Text>
          </TouchableOpacity>

        </View>

        {/* BOTÃO SALVAR */}
        <TouchableOpacity
          style={styles.btnSalvar}
          onPress={salvarAlteracoes}
        >

          {salvando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnSalvarText}>
              Salvar Alterações
            </Text>
          )}

        </TouchableOpacity>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },

  back: {
    color: '#2f6ea8',
    fontWeight: 'bold',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  content: {
    padding: 16,
    paddingBottom: 50,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  patrimonio: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2f6ea8',
  },

  tipo: {
    fontSize: 16,
    marginTop: 4,
  },

  setor: {
    marginTop: 6,
    color: '#64748b',
  },

  badge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeDisponivel: {
    backgroundColor: '#dcfce7',
  },

  badgeAtivo: {
    backgroundColor: '#dbeafe',
  },

  badgeManutencao: {
    backgroundColor: '#fee2e2',
  },

  badgeText: {
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },

  componentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },

  componentName: {
    fontSize: 14,
  },

  ok: {
    color: '#16a34a',
    fontWeight: 'bold',
  },

  defeito: {
    color: '#dc2626',
    fontWeight: 'bold',
  },

  nota: {
    fontSize: 13,
    marginBottom: 8,
    color: '#475569',
  },

  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    minHeight: 90,
    marginTop: 10,
    textAlignVertical: 'top',
  },

  btnNota: {
    backgroundColor: '#2f6ea8',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  btnSalvar: {
    backgroundColor: '#16a34a',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnSalvarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

});