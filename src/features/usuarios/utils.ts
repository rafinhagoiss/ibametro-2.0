export const DOMINIO_INSTITUCIONAL = 'ibametro.ba.gov.br';

export function montarEmailInstitucional(valor?: string) {
  const login = String(valor || '').trim().toLowerCase();
  return login.includes('@') ? login : `${login}@${DOMINIO_INSTITUCIONAL}`;
}

export function usuarioSeguePadraoInstitucional(valor?: string) {
  if (!valor?.trim()) return false;

  const email = montarEmailInstitucional(valor);
  const [identificador, dominio, ...partesExtras] = email.split('@');
  const nomes = identificador.split('.');

  return partesExtras.length === 0
    && dominio === DOMINIO_INSTITUCIONAL
    && nomes.length >= 2
    && nomes.every((nome) => /^[a-z0-9][a-z0-9_-]*$/.test(nome));
}

export const MENSAGEM_PADRAO_USUARIO = 'Use o formato nome.sobrenome, sem espaços. Exemplo: maria.silva.';
