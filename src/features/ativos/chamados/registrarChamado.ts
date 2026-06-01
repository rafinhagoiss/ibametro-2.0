import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '../../../config/firebase';
import type { Ativo } from '../../../types/ativo';
import { registrarHistoricoAtivo } from '../historico/registrarHistoricoAtivo';

interface Params {
  ativo?: Ativo | null;
  descricao: string;
  usuario: string;
  categoria?: string;
  prioridade?: string;
  solicitanteNome?: string;
  solicitanteEmail?: string;
}

export async function registrarChamado({
  ativo,
  descricao,
  usuario,
  categoria,
  prioridade,
  solicitanteNome,
  solicitanteEmail,
}: Params) {
  const problema = descricao.trim();

  if (!problema) {
    throw new Error('Descreva o defeito antes de abrir o chamado.');
  }

  await addDoc(collection(db, 'chamados'), {
    idAtivo: ativo?.id || '',
    patrimonio: ativo?.patrimonio || 'Sem patrimônio vinculado',
    descricaoProblema: problema,
    usuario,
    categoria: categoria?.trim() || 'Suporte técnico',
    prioridade: prioridade?.trim() || 'Normal',
    solicitanteNome: solicitanteNome?.trim() || usuario,
    solicitanteEmail: solicitanteEmail?.trim().toLowerCase() || '',
    status: 'Pendente',
    dataCriacao: serverTimestamp(),
  });

  if (!ativo) return;

  await updateDoc(doc(db, 'ativos', ativo.id), {
    status: 'Manutenção',
    dataManutencao: ativo.dataManutencao || serverTimestamp(),
    atualizadoPor: usuario,
    dataAtualizacao: serverTimestamp(),
  });
  await registrarHistoricoAtivo({
    ativoId: ativo.id,
    patrimonio: ativo.patrimonio,
    acao: 'Chamado aberto',
    usuario,
    detalhes: problema,
  });
}
