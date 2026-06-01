import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { db } from '../../../config/firebase';

interface Historico {
  id: string;
  acao: string;
  usuario: string;
  detalhes?: string;
  data?: any;
}

function obterMillis(data: any) {
  if (typeof data?.toMillis === 'function') return data.toMillis();
  if (typeof data === 'number') return data;
  return 0;
}

function formatarData(data: any) {
  const millis = obterMillis(data);
  return millis ? new Date(millis).toLocaleString('pt-BR') : 'Agora';
}

export function HistoricoAtivoCard({ ativoId }: { ativoId: string }) {
  const [eventos, setEventos] = useState<Historico[]>([]);

  useEffect(() => {
    const consulta = query(collection(db, 'historicoAtivos'), where('ativoId', '==', ativoId));
    return onSnapshot(consulta, (snapshot) => {
      const lista = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Historico);
      lista.sort((a, b) => obterMillis(b.data) - obterMillis(a.data));
      setEventos(lista.slice(0, 10));
    });
  }, [ativoId]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Histórico do Ativo</Text>
      {eventos.length === 0 ? (
        <Text style={styles.empty}>Nenhuma movimentação registrada.</Text>
      ) : eventos.map((evento) => (
        <View key={evento.id} style={styles.event}>
          <View style={styles.dot} />
          <View style={styles.content}>
            <Text style={styles.action}>{evento.acao}</Text>
            <Text style={styles.meta}>{formatarData(evento.data)} · {evento.usuario || 'Sistema'}</Text>
            {evento.detalhes ? <Text style={styles.details}>{evento.detalhes}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  title: { color: '#0f2742', fontSize: 16, fontWeight: '900', marginBottom: 12 },
  empty: { color: '#64748b', fontSize: 13 },
  event: { flexDirection: 'row', paddingBottom: 12 },
  dot: { width: 10, height: 10, marginTop: 4, marginRight: 10, borderRadius: 5, backgroundColor: '#2563eb' },
  content: { flex: 1 },
  action: { color: '#1e293b', fontWeight: '800' },
  meta: { color: '#64748b', fontSize: 11, marginTop: 2 },
  details: { color: '#475569', fontSize: 12, marginTop: 4 },
});
