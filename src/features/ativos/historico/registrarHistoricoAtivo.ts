import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../../../config/firebase';

interface RegistrarHistoricoAtivoParams {
  ativoId: string;
  patrimonio: string;
  acao: string;
  usuario: string;
  detalhes?: string;
}

export async function registrarHistoricoAtivo({
  ativoId,
  patrimonio,
  acao,
  usuario,
  detalhes,
}: RegistrarHistoricoAtivoParams) {
  await addDoc(collection(db, 'historicoAtivos'), {
    ativoId,
    patrimonio,
    acao,
    usuario: usuario || 'Sistema',
    detalhes: detalhes || '',
    data: serverTimestamp(),
  });
}
