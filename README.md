# Lav-e-Sec: Sistema de Gestão de Lavanderia

![Lav-e-Sec Logo](https://via.placeholder.com/150x50?text=Lav-e-Sec)

## Sobre o Projeto

O **Lav-e-Sec** é um sistema de gestão completo, desenvolvido para otimizar as operações de lavanderias. Ele oferece ferramentas para o registro e acompanhamento de atendimentos (ordens de serviço), gestão de clientes, controle de despesas, administração de caixa e um robusto sistema de gerenciamento de usuários com diferentes níveis de acesso. Construído com tecnologias modernas, o Lav-e-Sec visa proporcionar eficiência, transparência e segurança para o seu negócio.

## Funcionalidades Principais

O sistema Lav-e-Sec abrange as seguintes áreas essenciais para a gestão de uma lavanderia:

*   **Gestão de Atendimentos (Ordens de Serviço):** Registre e acompanhe o ciclo completo de lavagem, desde o recebimento até a entrega. Inclui detalhes como nome do cliente, telefone, quantidade de cestos, valor total, status (em lavagem, pronto, finalizado) e forma de pagamento. Permite o envio de notificações via WhatsApp.
*   **Gestão de Clientes:** Mantenha um cadastro organizado de seus clientes, com informações de contato e histórico. Suporta a importação de clientes via planilhas (Excel/CSV) e evita duplicidades.
*   **Gestão de Despesas:** Registre e categorize todas as despesas operacionais da lavanderia para um controle financeiro apurado.
*   **Controle de Caixa:** Gerencie o fluxo de caixa diário com funcionalidades de abertura e fechamento, registrando valores iniciais e finais, e acompanhando o saldo.
*   **Dashboard Analítico:** Visualize métricas importantes do negócio, como receita, despesas, lucro e status dos atendimentos, através de gráficos e relatórios.
*   **Gestão de Usuários e Acessos:** Administre os usuários do sistema com um controle de acesso baseado em perfis (`admin`, `support`, `atendente`), garantindo que cada membro da equipe tenha as permissões adequadas.
*   **Auditoria (Audit Logs):** Mantenha um registro detalhado de todas as ações realizadas no sistema, proporcionando rastreabilidade e segurança.
*   **Sistema de Suporte:** Um módulo dedicado para que os usuários possam abrir tickets de suporte, facilitando a comunicação e a resolução de problemas.

## Tecnologias Utilizadas

O Lav-e-Sec é construído com um stack tecnológico moderno e robusto:

*   **Frontend:**
    *   **React:** Biblioteca JavaScript para construção de interfaces de usuário.
    *   **TypeScript:** Superset do JavaScript que adiciona tipagem estática, melhorando a robustez do código.
    *   **Vite:** Ferramenta de build rápida para desenvolvimento frontend.
    *   **Tailwind CSS:** Framework CSS utilitário para estilização rápida e responsiva.
    *   **Shadcn/ui:** Coleção de componentes de UI acessíveis e personalizáveis.
    *   **React Router DOM:** Para gerenciamento de rotas na aplicação.
    *   **React Query:** Para gerenciamento de estado assíncrono e cache de dados.
*   **Backend & Banco de Dados:**
    *   **Supabase:** Plataforma open-source que oferece um banco de dados PostgreSQL, autenticação, APIs em tempo real e Edge Functions (serverless).
    *   **Supabase Edge Functions (Deno):** Utilizado para lógica de negócio sensível e administração de usuários (ex: `admin-users`).
*   **Testes:**
    *   **Vitest:** Framework de testes rápido para JavaScript/TypeScript.
    *   **Testing Library:** Utilitários para testar componentes React de forma eficaz.

## Instalação e Configuração (para Desenvolvedores)

Para configurar e executar o projeto Lav-e-Sec em seu ambiente de desenvolvimento local, siga os passos abaixo:

### Pré-requisitos

Certifique-se de ter instalado em sua máquina:

*   Node.js (versão 18 ou superior)
*   npm, yarn ou bun (gerenciador de pacotes de sua preferência)
*   Git

### Passos para Instalação

1.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/LAV-E-SEC-BEACH/lav-e-sec.git
    cd lav-e-sec
    ```

2.  **Instale as Dependências:**
    Utilize o gerenciador de pacotes de sua preferência:
    ```bash
    npm install
    # ou yarn install
    # ou bun install
    ```

3.  **Configuração do Supabase:**
    O projeto utiliza o Supabase como backend. Você precisará configurar um projeto Supabase e obter suas credenciais.

    *   Crie um novo projeto no [Supabase](https://supabase.com/).
    *   Após criar o projeto, vá em `Project Settings > API` e copie a `Project URL` e a `anon public` `Project API Key`.
    *   Crie um arquivo `.env` na raiz do seu projeto `lav-e-sec` com as seguintes variáveis:
        ```env
        VITE_SUPABASE_URL="SUA_PROJECT_URL_DO_SUPABASE"
        VITE_SUPABASE_PUBLISHABLE_KEY="SUA_ANON_PUBLIC_KEY_DO_SUPABASE"
        ```
    *   **Migrações do Banco de Dados:** As migrações do banco de dados estão localizadas em `supabase/migrations`. Você pode aplicá-las ao seu projeto Supabase usando a CLI do Supabase ou manualmente através do SQL Editor.
    *   **Edge Function `admin-users`:** A função `admin-users` (localizada em `supabase/functions/admin-users`) precisa ser implantada no seu projeto Supabase. Certifique-se de configurar a `SUPABASE_SERVICE_ROLE_KEY` como uma variável de ambiente para esta Edge Function no Supabase.

4.  **Execute a Aplicação:**
    Após instalar as dependências e configurar o Supabase, você pode iniciar o servidor de desenvolvimento:
    ```bash
    npm run dev
    # ou yarn dev
    # ou bun dev
    ```
    A aplicação estará acessível em `http://localhost:5173` (ou a porta indicada pelo Vite).

## Contribuição

Contribuições são bem-vindas! Se você tiver sugestões, melhorias ou encontrar bugs, sinta-se à vontade para abrir uma issue ou enviar um Pull Request.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido por:** LAV-E-SEC-BEACH Team
**Documentado por:** Manus AI
**Data:** 27 de Abril de 2026
