export const EMAIL_DEMO_DESTINATARIO = 'ibametroativos.demo@gmail.com';

interface CriarNotificacaoEmailDemoParams {
  chamadoId: string;
  patrimonio?: string;
  categoria?: string;
  descricao: string;
  solicitanteNome?: string;
  solicitanteEmail?: string;
}

export interface NotificacaoEmailDemo {
  destinatario: string;
  assunto: string;
  corpo: string;
  status: 'Solicitado';
}

export function criarNotificacaoEmailDemo({
  chamadoId,
  patrimonio,
  categoria,
  descricao,
  solicitanteNome,
  solicitanteEmail,
}: CriarNotificacaoEmailDemoParams): NotificacaoEmailDemo {
  const identificador = chamadoId.slice(0, 8).toUpperCase();
  const equipamento = patrimonio || 'Sem patrimônio vinculado';
  const solicitante = solicitanteNome || solicitanteEmail || 'Usuário do sistema';

  return {
    destinatario: EMAIL_DEMO_DESTINATARIO,
    assunto: `[TCC #${identificador}] Novo chamado - ${equipamento}`,
    corpo: [
      'Novo chamado aberto no IBAMETRO Ativos.',
      `Solicitante: ${solicitante}`,
      `Categoria: ${categoria || 'Suporte técnico'}`,
      `Patrimônio: ${equipamento}`,
      `Descrição: ${descricao.trim()}`,
      '',
      'Mensagem de teste gerada pelo projeto acadêmico IBAMETRO Ativos.',
    ].join('\n'),
    status: 'Solicitado',
  };
}
