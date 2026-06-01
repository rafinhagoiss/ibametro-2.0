# IBAMETRO Ativos

Aplicativo de inventário de equipamentos de TI desenvolvido com React Native, Expo e Firebase.

## Recursos principais

- Cadastro de computadores, switches e computadores all-in-one Arquimedes.
- Diagnóstico de hardware e registro de tela danificada para Arquimedes.
- Visualização física das portas utilizadas em switches.
- Leitura e geração de QR Code por patrimônio.
- Exportação do inventário em CSV.
- Lixeira com restauração e exclusão definitiva por administrador.
- Abertura e acompanhamento de chamados técnicos.
- Histórico cronológico por ativo.
- Dashboard e relatórios gerenciais.
- Gestão de usuários com perfis `admin` e `usuario`, padrão `nome.sobrenome`, recuperação de senha e bloqueio de acessos removidos.

## Executar

```bash
npm install
npm run web
```

Para validar:

```bash
npm test
npx tsc --noEmit
```

## Estrutura

- `src/screens`: telas completas da aplicação.
- `src/features/ativos`: componentes e regras separados por funcionalidade.
- `src/config`: integração com Firebase.
- `tests`: testes automatizados de regras centrais.
- `docs`: material de apoio para configuração e apresentação do TCC.

Consulte [docs/TCC.md](docs/TCC.md) para o roteiro de apresentação e [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) para publicar as regras de segurança.
