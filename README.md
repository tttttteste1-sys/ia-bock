Projeto Chatbot IA BOCK - ChatGPT-like

Resumo

Aplicação web completa: frontend React, Netlify Functions como backend, usando Supabase para persistência. Integração com API de IA via variável de ambiente `process.env.GLM_API_KEY` (Netlify).

Estrutura

/netlify/functions - funções serverless (login, register, chat, conversations, messages)
/frontend - app React
/public - assets
/supabase/schema.sql - esquema sugerido

Variáveis de ambiente (Netlify)

- GLM_API_KEY -> chave da GLM (não expor)
- SUPABASE_URL -> URL do projeto Supabase
- SUPABASE_SERVICE_ROLE_KEY -> chave service role (usada nas serverless functions)
- NETLIFY_JWT_SECRET -> segredo para assinar JWT

Instalação local

1. Criar projeto Supabase e executar o SQL em `supabase/schema.sql` no SQL editor.
2. Inserir usuário administrador no Supabase (veja SQL no schema).
3. No diretório `netlify/functions`, rodar `npm install`.
4. No diretório `frontend`, rodar `npm install`.
5. Rodar localmente (Netlify CLI recomendado):
   - `netlify dev` (instalar Netlify CLI)

Deploy no Netlify

1. Crie um site no Netlify conectado ao repositório.
2. Configure build command para o frontend (ex.: `npm run build` dentro de `frontend`).
3. Adicione as variáveis de ambiente em Site settings > Build & deploy > Environment.
   - `GLM_API_KEY` -> sua chave
   - `SUPABASE_URL` -> URL Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` -> service role
   - `NETLIFY_JWT_SECRET` -> segredo JWT

Observações de segurança

- A `GLM_API_KEY` NUNCA é usada no frontend. Todas as chamadas à IA passam pela função Netlify `/api/chat` que lê `process.env.GLM_API_KEY`.
- Senha dos usuários é hasheada com `bcrypt`.
 - Senha dos usuários é hasheada com `bcrypt`.
 - Admin padrão: prefere-se criar o usuário `administrador` no banco com `role = 'admin'` em vez de usar bypass no código.

Seed automático do admin (opcional)

Para conveniência há uma Netlify Function `seed_admin` (`/.netlify/functions/seed_admin`) que cria o usuário `administrador` com senha `adm2026` (ou com as credenciais que você passar no body). Por segurança defina a variável de ambiente `ADMIN_SEED_KEY` no Netlify antes de chamar a função.

Exemplo de chamada (local ou via deploy):

POST /.netlify/functions/seed_admin
Body JSON:
```
{
  "key": "<value-do-ADMIN_SEED_KEY>",
  "email": "administrador",
  "password": "adm2026"
}
```

Se preferir não usar a função, gere o hash bcrypt localmente e insira diretamente via SQL no Supabase:

Para gerar hash bcrypt localmente (Node REPL):
```
const bcrypt = require('bcryptjs');
bcrypt.hashSync('adm2026', 10); // copie o hash e use no INSERT
```

Exemplo SQL:
```
insert into users (email, password, role) values ('administrador','<bcrypt-hash>','admin');
```

Documentação adicional e uso estão nos arquivos dentro de `frontend` e `netlify/functions`.
