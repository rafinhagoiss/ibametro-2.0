import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '../../../config/firebase';
import type { Ativo } from '../../../types/ativo';
import { registrarHistoricoAtivo } from '../historico/registrarHistoricoAtivo';

interface Params {
  ativo: Ativo;
  descricao: string;
  usuario: string;
}

export async function registrarChamado({ ativo, descricao, usuario }: Params) {
  const problema = descricao.trim();

  if (!problema) {
    throw new Error('Descreva o defeito antes de abrir o chamado.');
  }

  await addDoc(collection(db, 'chamados'), {
    idAtivo: ativo.id,
    patrimonio: ativo.patrimonio,
    descricaoProblema: problema,
    usuario,
    status: 'Pendente',
    dataCriacao: serverTimestamp(),
  });
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
