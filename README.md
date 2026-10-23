# iPerto

Marketplace brasileiro especializado exclusivamente em iPhones.

## Produção

- **Frontend:** HTML/CSS/JavaScript modular, publicado pela Vercel.
- **Backend:** Supabase dedicado (Auth, Postgres e Storage).
- **Fonte oficial:** este repositório GitHub. Toda alteração deve ser versionada aqui antes do deploy.
- **Dados:** somente anúncios reais; não há cards demonstrativos ou dados fictícios.

## Segurança

- Row Level Security em todas as tabelas expostas.
- Perfis de conta são privados; o vendedor controla por anúncio se quer publicar o WhatsApp.
- A chave usada no navegador é somente a `sb_publishable_...`; nenhuma chave `service_role`/secret é versionada.
- Uploads são limitados por bucket, MIME, tamanho e pasta do usuário autenticado.
- Usuários só podem editar, pausar ou excluir os próprios anúncios.
- A coluna `verified` do perfil não pode ser alterada pelo próprio usuário.
- Headers de produção incluem CSP, HSTS, frame protection, referrer policy e permissions policy.
- Conteúdo vindo de usuários é escapado antes de ser renderizado em HTML.

## Banco

As migrações ficam em `supabase/migrations/` e documentam a estrutura aplicada ao projeto dedicado do iPerto.
