import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { db } from '../../../config/firebase';
import type { Ativo } from '../../../types/ativo';
import { gerarInfraestruturasRede } from './gerarInfraestruturaRede';

const LIMITE_OPERACOES_POR_LOTE = 400;

export async function preencherRedeInventario(ativos: Ativo[], usuario: string) {
  const atualizacoes = gerarInfraestruturasRede(ativos);
  let batch = writeBatch(db);
  let operacoes = 0;

  for (const { ativo, infraestrutura } of atualizacoes) {
    batch.update(doc(db, 'ativos', ativo.id), {
      ...infraestrutura,
      atualizadoPor: usuario,
      dataAtualizacao: serverTimestamp(),
    });
    operacoes += 1;

    if (operacoes === LIMITE_OPERACOES_POR_LOTE) {
      await batch.commit();
      batch = writeBatch(db);
      operacoes = 0;
    }
  }

  if (operacoes) {
    await batch.commit();
  }

  return atualizacoes.length;
}
