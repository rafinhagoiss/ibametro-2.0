import React from 'react';
import { Text, View } from 'react-native';

import type { Ativo } from '../../../../types/ativo';
import { styles } from '../styles';

interface AtivoResumoCardProps {
  ativo: Ativo;
  statusGeral: string;
}

function formatarData(data: any) {
  if (!data) return 'Não informado';
  if (typeof data.toDate === 'function') return data.toDate().toLocaleString();
  if (typeof data.toMillis === 'function') return new Date(data.toMillis()).toLocaleString();
  if (typeof data === 'number') return new Date(data).toLocaleString();
  if (data instanceof Date) return data.toLocaleString();

  return 'Não informado';
}

export function AtivoResumoCard({
  ativo,
  statusGeral,
}: AtivoResumoCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.patrimonio}>{ativo.patrimonio}</Text>
      <Text style={styles.tipo}>{ativo.tipo}</Text>
      <Text style={styles.setor}>📍 {ativo.setor}</Text>

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
        <Text style={styles.badgeText}>{statusGeral}</Text>
      </View>

      <View style={styles.metadataBox}>
        <Text style={styles.metadataText}>
          Cadastro: {formatarData(ativo.dataCadastro)}
        </Text>
        <Text style={styles.metadataText}>
          Última atualização: {formatarData(ativo.dataAtualizacao)}
        </Text>
        <Text style={styles.metadataText}>
          Criado por: {ativo.criadoPor || 'Não informado'}
        </Text>
        <Text style={styles.metadataText}>
          Atualizado por: {ativo.atualizadoPor || 'Não informado'}
        </Text>
      </View>
    </View>
  );
}
