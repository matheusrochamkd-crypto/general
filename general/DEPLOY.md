# Implementação na Vercel

Este guia explica como fazer o deploy deste projeto na Vercel.

## Pré-requisitos

1.  Uma conta na [Vercel](https://vercel.com/).
2.  O código do projeto (este repositório) pode estar no GitHub, GitLab ou Bitbucket (recomendado para CI/CD automático) ou você pode usar a Vercel CLI.

## Passos para Deploy (Via GitHub/GitLab/Bitbucket)

1.  **Push do Código**: Certifique-se de que seu código atualizado está no seu repositório remoto.
2.  **Novo Projeto na Vercel**:
    *   Acesse o dashboard da Vercel.
    *   Clique em "Add New..." -> "Project".
    *   Selecione o repositório `comandos-operacao-2026` (ou o nome que você usou).
3.  **Configuração do Projeto**:
    *   **Framework Preset**: A Vercel deve detectar automaticamente que é **Vite**. Se não, selecione "Vite".
    *   **Root Directory**: Como o projeto está dentro da pasta `general`, você DEVE clicar em "Edit" ao lado de "Root Directory" e selecionar a pasta `general`.
    *   **Environment Variables**: Expanda a seção "Environment Variables". Adicione as variáveis do seu arquivo `.env` (ou `.env.local`):
        *   `GEMINI_API_KEY`: Sua chave de API do Google Gemini.
        *   `VITE_SUPABASE_URL`: (Se estiver usando Supabase) Sua URL do Supabase.
        *   `VITE_SUPABASE_ANON_KEY`: (Se estiver usando Supabase) Sua chave anônima (anon key) do Supabase.
4.  **Deploy**:
    *   Clique em "Deploy".
    *   Aguarde a construção e o deploy finalizarem.

## Verificação

Após o deploy, a Vercel fornecerá uma URL (ex: `https://meu-projeto.vercel.app`). Acesse essa URL e teste:

1.  A navegação entre páginas (Dashboard, Calendário, etc.).
2.  Atualize a página (F5) em uma rota interna (ex: `/dashboard`) para garantir que o arquivo `vercel.json` está funcionando corretamente (não deve dar erro 404).

## Solução de Problemas Comuns

*   **Erro 404 ao atualizar a página**: Certifique-se de que o arquivo `vercel.json` está na raiz do deploy (dentro da pasta `general` se tiver configurado assim).
*   **Build falhando**: Verifique os logs de build na Vercel. Erros comuns incluem dependências faltando ou erros de TypeScript (type checking).
