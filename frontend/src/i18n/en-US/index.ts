export default {
  upload: {
    prompt: 'Upload File',
    button: 'Submit',
    required: 'Required field'
  },
  export: {
    button: 'Export',
    missing: 'Not Included',
    csvHeader: '"Title","Year","Author","Keywords","URL","Abstract","DOI","Accepted"\n'
  },
  filtering: {
    prompt: 'Filter view',
    keywords: 'Keywords',
    mode: 'Filtering mode',
    accept: 'Accept',
    reject: 'Reject',
    accepted: 'Accepted',
    rejected: 'Rejected'
  },
  paperCard: {
    visit: 'Visit',
    keywords: 'Keywords',
    abstract: 'Abstract',
    authors: 'Authors',
    missing: {
      abstract: 'Abstract not available',
      authors: 'Authors not available',
      keywords: 'Keywords not available'
    }
  },
  auth: {
    signIn: 'Sign In',
    signOut: 'Sign Out',
    notLoggedIn: 'Anonymous User',
    signInError: 'Authentication failed, please try again',
    signInSuccess: 'Authentication successful'
  },
  entryTypes: {
    proceedings: 'Proceedings',
    inproceedings: 'In Proceedings'
  },
  ai: {
    help: 'Chat with AI',
    helpText: 'Currently, the system is in testing phase, therefore the artificial intelligence may have problems in responding to questions and requests made in Portuguese, this is a limitation of the model used. To start, type something in the text field below and press Enter or Submit.',
    error: {
      code401: 'The chatbot service is exclusive to authenticated users, log in to continue',
      code500: 'The chatbot service is temporarily unavailable, please try again later'
    }
  },
  homepage: {
    description: 'An app to support the initial selection stage of a Systematic Literature Review, powered by AI',
    getStarted: 'Get Started'
  }
}
