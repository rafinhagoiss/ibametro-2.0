import React from 'react';
import { Text, TextInput, View } from 'react-native';

import type { InfraAtivo } from '../../../../types/ativo';
import { styles } from '../styles';

interface InfraestruturaCardProps {
  infra: InfraAtivo;
  onChangeInfra: (campo: keyof InfraAtivo, valor: string) => void;
}

export function InfraestruturaCard({
  infra,
  onChangeInfra,
}: InfraestruturaCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>🌐 Infraestrutura</Text>

      <TextInput
        style={styles.input}
        placeholder="Hostname"
        value={infra.hostname}
        onChangeText={(valor) => onChangeInfra('hostname', valor)}
      />

      <TextInput
        style={styles.input}
        placeholder="IP"
        value={infra.ip}
        onChangeText={(valor) => onChangeInfra('ip', valor)}
      />

      <TextInput
        style={styles.input}
        placeholder="MAC"
        value={infra.mac}
        onChangeText={(valor) => onChangeInfra('mac', valor)}
      />

      <TextInput
        style={styles.input}
        placeholder="VLAN"
        value={infra.vlan}
        onChangeText={(valor) => onChangeInfra('vlan', valor)}
      />

      <TextInput
        style={styles.input}
        placeholder="Porta Switch"
        value={infra.portaSwitch}
        onChangeText={(valor) => onChangeInfra('portaSwitch', valor)}
      />
    </View>
  );
}
