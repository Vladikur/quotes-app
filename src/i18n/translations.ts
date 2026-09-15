export interface TranslationDict {
  searchQuotes: {
    title: string
    placeholder: string
    uploadQuotes: string
    showDuplicates: string
    strictSearch: string
    total: string
    hintTitle: string
    hintText1: string
    hintText2: string
    hintText3: string
    hintText4: string
    empty: string
    clearSearch: string
  }
  bulkUpload: {
    title: string
    hint: string
    upload: string
  }
  editQuote: {
    title: string
    update: string
  }
  login: {
    title: string
    loginPlaceholder: string
    passwordPlaceholder: string
    submit: string
  }
  notFound: {
    title: string
    goHome: string
  }
  header: {
    logIn: string
    logOut: string
    appName: string
  }
  theme: {
    light: string
    dark: string
    system: string
  }
  language: {
    label: string
    ru: string
    en: string
  }
  errors: {
    deleteQuoteFailed: string
    loadQuotesFailed: string
    unknown: string
    invalidJson: string
    jsonArrayExpected: string
    requiredFieldInvalid: string
    loginFailed: string
    fillAllFields: string
  }
  success: {
    deleteQuoteSuccess: string
    loginSuccess: string
    quoteCopied: string
  }
  actions: {
    delete: string
    cancel: string
    copyQuote: string
  }
  confirm: {
    deleteQuote: string
  }
  titles: {
    login: string
    search: string
    notFound: string
    editQuote: string
    addQuotes: string
  }
}

export const translations: Record<'ru' | 'en', TranslationDict> = {
  ru: {
    searchQuotes: {
      title: 'Поиск цитат',
      placeholder: 'Введите тему запроса',
      uploadQuotes: 'Загрузить новые цитаты',
      showDuplicates: 'Показать возможные дубликаты',
      strictSearch: 'Поиск строго по символам, без ИИ',
      total: 'Найдено цитат:',
      hintTitle: 'Подсказка',
      hintText1:
        'Поиск работает на основе искусственного интеллекта: он определяет смысл запроса и подбирает близкие по значению цитаты, даже если слова не совпадают дословно.',
      hintText2:
        'Можно экспериментировать с формулировками запроса — например, искать цитаты по теме встречи, по словам-синонимам, по автору и т.д.',
      hintText3:
        'Результаты сортируются по релевантности: в начале списка отображаются наиболее подходящие варианты.',
      hintText4: 'Поиск поддерживает ввод на русском и английском языках.',
      empty: 'Ничего не найдено',
      clearSearch: 'Очистить поле поиска',
    },
    bulkUpload: {
      title: 'Добавление новых цитат',
      hint: 'Вставьте JSON-массив объектов с цитатами',
      upload: 'Загрузить',
    },
    editQuote: {
      title: 'Обновление цитаты',
      update: 'Обновить',
    },
    login: {
      title: 'Вход',
      loginPlaceholder: 'Логин',
      passwordPlaceholder: 'Пароль',
      submit: 'Войти',
    },
    notFound: {
      title: 'Страница не найдена',
      goHome: 'На главную',
    },
    header: {
      logIn: 'Войти',
      logOut: 'Выйти',
      appName: 'Цитаты',
    },
    theme: {
      light: 'Светлая',
      dark: 'Тёмная',
      system: 'Системная',
    },
    language: {
      label: 'Язык',
      ru: 'Русский',
      en: 'English',
    },
    errors: {
      deleteQuoteFailed: 'Не удалось удалить цитату',
      loadQuotesFailed: 'Не удалось загрузить цитаты',
      unknown: 'Произошла ошибка',
      invalidJson: 'Некорректный JSON. Проверьте синтаксис',
      jsonArrayExpected: 'Ожидается JSON-массив объектов',
      requiredFieldInvalid: 'обязательно и должно быть строкой',
      loginFailed: 'Неверный логин или пароль',
      fillAllFields: 'Заполните все поля',
    },
    success: {
      deleteQuoteSuccess: 'Цитата успешно удалена',
      loginSuccess: 'Вы успешно вошли',
      quoteCopied: 'Цитата скопирована',
    },
    actions: {
      delete: 'Удалить',
      cancel: 'Отмена',
      copyQuote: 'Копировать цитату',
    },
    confirm: {
      deleteQuote: 'Вы уверены, что хотите удалить цитату?',
    },
    titles: {
      login: 'Вход',
      search: 'Поиск цитат',
      notFound: 'Страница не найдена',
      editQuote: 'Обновление цитаты',
      addQuotes: 'Добавление цитат',
    },
  },
  en: {
    searchQuotes: {
      title: 'Search Quotes',
      placeholder: 'Enter topic or query',
      uploadQuotes: 'Upload new quotes',
      showDuplicates: 'Show possible duplicates',
      strictSearch: 'Literal character search, no AI',
      total: 'Quotes found:',
      hintTitle: 'Hint',
      hintText1:
        'Search is powered by artificial intelligence: it understands the meaning of your query and finds semantically similar quotes, even if the exact words do not match.',
      hintText2:
        'You can experiment with your query wording — for example, search for quotes by meeting topic, by synonyms, by author, and more.',
      hintText3:
        'Results are sorted by relevance, with the most relevant matches shown first.',
      hintText4: 'Search supports input in both Russian and English.',
      empty: 'No results found',
      clearSearch: 'Clear search field',
    },
    bulkUpload: {
      title: 'Add new quotes',
      hint: 'Paste a JSON array of quote objects',
      upload: 'Upload',
    },
    editQuote: {
      title: 'Edit quote',
      update: 'Update',
    },
    login: {
      title: 'Login',
      loginPlaceholder: 'Username',
      passwordPlaceholder: 'Password',
      submit: 'Sign In',
    },
    notFound: {
      title: 'Page not found',
      goHome: 'Go to home',
    },
    header: {
      logIn: 'Log in',
      logOut: 'Logout',
      appName: 'Quotes',
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
    language: {
      label: 'Language',
      ru: 'Русский',
      en: 'English',
    },
    errors: {
      deleteQuoteFailed: 'Failed to delete quote',
      loadQuotesFailed: 'Failed to load quotes',
      unknown: 'An error occurred',
      invalidJson: 'Invalid JSON. Please check the syntax',
      jsonArrayExpected: 'A JSON array of objects is expected',
      requiredFieldInvalid: 'is required and must be a string',
      loginFailed: 'Invalid username or password',
      fillAllFields: 'Please fill in all fields',
    },
    success: {
      deleteQuoteSuccess: 'Quote successfully deleted',
      loginSuccess: 'Login successful',
      quoteCopied: 'Quote copied',
    },
    actions: {
      delete: 'Delete',
      cancel: 'Cancel',
      copyQuote: 'Copy quote',
    },
    confirm: {
      deleteQuote: 'Are you sure you want to delete this quote?',
    },
    titles: {
      login: 'Login',
      search: 'Quote search',
      notFound: 'Page not found',
      editQuote: 'Edit quote',
      addQuotes: 'Add quotes',
    },
  },
}

export type Lang = keyof typeof translations
