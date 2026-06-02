import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../../../config/firebase';
import type { Ativo } from '../../../types/ativo';
import { registrarHistoricoAtivo } from '../historico/registrarHistoricoAtivo';
import { criarNotificacaoEmailDemo } from './emailDemo';
import { enfileirarEmailTcc } from './enfileirarEmailTcc';

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

  const chamadoRef = doc(collection(db, 'chamados'));
  const notificacaoEmailDemo = criarNotificacaoEmailDemo({
    chamadoId: chamadoRef.id,
    patrimonio: ativo?.patrimonio,
    categoria,
    descricao: problema,
    solicitanteNome,
    solicitanteEmail,
  });

  await setDoc(chamadoRef, {
    idAtivo: ativo?.id || '',
    patrimonio: ativo?.patrimonio || 'Sem patrimônio vinculado',
    descricaoProblema: problema,
    usuario,
    categoria: categoria?.trim() || 'Suporte técnico',
    prioridade: prioridade?.trim() || 'Normal',
    solicitanteNome: solicitanteNome?.trim() || usuario,
    solicitanteEmail: solicitanteEmail?.trim().toLowerCase() || '',
    notificacaoEmailDemo,
    status: 'Pendente',
    dataCriacao: serverTimestamp(),
  });

  let emailEnfileirado = false;

  try {
    await enfileirarEmailTcc(chamadoRef.id, notificacaoEmailDemo);
    emailEnfileirado = true;
  } catch {
    // O chamado continua válido enquanto a extensão de e-mail é configurada.
  }

  if (!ativo) return { emailEnfileirado };

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

  return { emailEnfileirado };
}
