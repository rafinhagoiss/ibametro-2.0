# Configuração do Firebase

## Primeiro administrador

Antes de bloquear o cadastro público, crie manualmente o primeiro documento no Firestore:

- Coleção: `usuarios`
- ID do documento: e-mail completo em letras minúsculas no formato `nome.sobrenome@ibametro.ba.gov.br`
- Campo `email`: o mesmo e-mail
- Campo `nome`: nome do administrador
- Campo `role`: `admin`
- Campo `ativo`: `true`

O usuário correspondente também precisa existir em Authentication > Users.

Depois disso, novos acessos podem ser criados dentro do próprio aplicativo pelo botão `Gerenciar Usuários`.

## Regras de segurança

O arquivo `firestore.rules` define:

- leitura de ativos somente para usuários autenticados com perfil ativo;
- cadastro e exclusão de ativos somente para administradores;
- atualização operacional limitada para usuários comuns;
- criação e acompanhamento de chamados para usuários ativos;
- atualização do andamento de chamados somente para administradores;
- histórico visível e imutável;
- gestão de usuários somente para administradores.
- exclusão somente de usuários comuns, impedindo remover administradores ou a própria conta.
- criação controlada de mensagens na coleção `mail`, sempre limitadas ao endereço de teste `ibametroativos.demo@gmail.com`.

Quando um usuário comum é excluído pelo aplicativo, seu perfil é removido e o acesso aos dados fica bloqueado imediatamente. A remoção definitiva da credencial em Authentication exige uma função administrativa protegida no servidor e não deve ser executada diretamente pelo aplicativo cliente.

Para publicar, instale a CLI do Firebase, autentique-se e execute:

```bash
firebase deploy --only firestore:rules
```

## E-mail de teste para o TCC

O aplicativo cria documentos na coleção `mail` para a extensão oficial Trigger Email do Firebase. A conta exclusiva de demonstração é `ibametroativos.demo@gmail.com`.

Antes de testar:

1. Ative a verificação em duas etapas na conta Google de demonstração.
2. Gere uma senha de aplicativo para essa conta. Não salve essa senha no projeto e não publique a senha no GitHub.
3. No Console do Firebase do projeto `inventario-ti-app`, instale a extensão `Trigger Email from Firestore`.
4. Use a coleção `mail`.
5. Configure o servidor SMTP como `smtp.gmail.com`.
6. Use a porta `465` com SSL ou a porta `587` com TLS.
7. Informe `ibametroativos.demo@gmail.com` como usuário SMTP e endereço remetente.
8. Informe a senha de aplicativo somente no campo protegido da extensão.
9. Publique as regras atualizadas do Firestore.

Depois da ativação, abra um chamado novo. Chamados criados antes da instalação da extensão não são reenviados automaticamente.
