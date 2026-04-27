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
## Acesso ao sistema
   -> Link: https://lavanderiaesec.vercel.app/

## Contribuição

Contribuições são bem-vindas! Se você tiver sugestões, melhorias ou encontrar bugs, sinta-se à vontade para abrir uma issue ou enviar um Pull Request.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido por:** LAV-E-SEC-BEACH Team
**Documentado por:** Manus AI
**Data:** 27 de Abril de 2026
