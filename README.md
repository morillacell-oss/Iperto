# Junta — V1

Marketplace de compras coletivas: pessoas entram em uma fila, o comércio ganha volume e a oferta abre quando existe demanda suficiente.

## V1
- Feed público de ofertas semanais.
- Fila sem pagamento antecipado.
- Conta de comprador com filas e favoritos.
- Junta Empresas: cadastro do negócio, criação de oferta e métricas.
- Junta Admin: aprovação de empresas e ofertas (somente perfil `admin`).
- Supabase Auth, RLS e Storage.
- Nenhum dado de cartão é armazenado pelo Junta.
- Checkout real ainda não está conectado; o schema de pedidos está preparado para integração com PSP.

## Stack
Frontend estático + Supabase + Vercel. Os três arquivos maiores do frontend ficam compactados em `.source/`; `npm run build` os materializa em `dist/` sem instalar dependências externas.
