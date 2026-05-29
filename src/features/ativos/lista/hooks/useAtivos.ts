import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { db } from '../../../../config/firebase';
import type { Ativo } from '../../../../types/ativo';

export function useAtivos() {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ativos'), orderBy('patrimonio', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const listaAtivos: Ativo[] = [];

        snapshot.forEach((docSnapshot) => {
          listaAtivos.push({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          } as Ativo);
        });

        setAtivos(listaAtivos);
        setCarregando(false);
      },
      (error) => {
        console.log('Erro ao buscar ativos:', error);
        setCarregando(false);
      },
    );

    return unsubscribe;
  }, []);

  return {
    ativos,
    carregando,
    setCarregando,
  };
}
