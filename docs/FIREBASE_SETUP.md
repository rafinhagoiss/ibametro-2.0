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
- criação e andamento de chamados para a equipe autenticada;
- histórico visível e imutável;
- gestão de usuários somente para administradores.
- exclusão somente de usuários comuns, impedindo remover administradores ou a própria conta.

Quando um usuário comum é excluído pelo aplicativo, seu perfil é removido e o acesso aos dados fica bloqueado imediatamente. A remoção definitiva da credencial em Authentication exige uma função administrativa protegida no servidor e não deve ser executada diretamente pelo aplicativo cliente.

Para publicar, instale a CLI do Firebase, autentique-se e execute:

```bash
firebase deploy --only firestore:rules
```
