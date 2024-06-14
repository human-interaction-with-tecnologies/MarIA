export default {
  upload: {
    prompt: 'Carregar Arquivo',
    button: 'Enviar',
    required: 'Campo obrigatório'
  },
  export: {
    button: 'Exportar',
    missing: 'Não consta'
  },
  filtering: {
    prompt: 'Filtrar exibição',
    keywords: 'Palavras-chave',
    mode: 'Modo filtragem',
    accept: 'Aceitar',
    reject: 'Rejeitar'
  },
  paperCard: {
    visit: 'Visitar',
    keywords: 'Palavras-chave',
    abstract: 'Resumo',
    authors: 'Autores',
    missing: {
      abstract: 'Resumo não disponível',
      authors: 'Autores não disponíveis',
      keywords: 'Palavras-chave não disponíveis'
    }
  },
  auth: {
    signIn: 'Entrar',
    signOut: 'Sair',
    notLoggedIn: 'Usuário anônimo',
    signInError: 'A autenticação falhou, tente novamente',
    signInSuccess: 'Autenticação bem-sucedida'
  },
  entryTypes: {
    proceedings: 'Anais de evento',
    inproceedings: 'Artigo publicado em anais de evento'
  },
  ai: {
    help: 'Converse com a IA',
    helpText: 'Atualmente, o sistema se encontra em fase de testes, portanto a inteligência artificial pode ter problemas em responder perguntas e requisições feitas em português, esta é uma limitação do modelo utilizado. Para começar, digite algo no campo de texto abaixo e pressione Enter ou Enviar.',
    error: {
      code401: 'O serviço de chatbot é exclusivo para usuários autenticados, faça login para continuar',
      code500: 'O serviço de chatbot está temporariamente indisponível, tente novamente mais tarde'
    }
  },
  homepage: {
    description: 'Um aplicativo para auxiliar a etapa de seleção inicial de uma Revisão Sistemática da Literatura, alimentado por IA',
    getStarted: 'Começar'
  }
}
