import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../../../config/firebase';
import type { NotificacaoEmailDemo } from './emailDemo';

export async function enfileirarEmailTcc(
  chamadoId: string,
  notificacao: NotificacaoEmailDemo,
) {
  const emailRef = doc(collection(db, 'mail'));

  await setDoc(emailRef, {
    chamadoId,
    to: [notificacao.destinatario],
    message: {
      subject: notificacao.assunto,
      text: notificacao.corpo,
    },
    dataCriacao: serverTimestamp(),
  });
}
