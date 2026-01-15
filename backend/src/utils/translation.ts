export type Language = 'en' | 'bg';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'welcome': 'Welcome',
    'login': 'Log in',
    'logout': 'Log out',
    'signin': 'Sign in',
    'username': 'Username',
    'email': 'Email',
    'password': 'Password',
    'confirmPassword': 'Confirm Password',
    'forgotPassword': 'Forgotten password',
    'resetPassword': 'Reset Password',
    'changePassword': 'Change Password',
    'submit': 'Submit',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'save': 'Save',
    'close': 'Close',
    'continue': 'Continue',
    'goBack': 'Go Back',
    'yes': 'Yes',
    'no': 'No',
    'ok': 'OK',
    'search': 'Search',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'settings': 'Settings',
    'account': 'Account',
    'theme': 'App Theme',
    'language': 'Language',
    'english': 'English',
    'bulgarian': 'Bulgarian',
    
    // Admin
    'users': 'Users',
    'tags': 'Tags',
    'categories': 'Categories',
    'reports': 'Reports',
    'toReview': 'To Review',
    'addAdmin': 'Add Admin',
    'addTag': 'Add Tag',
    'addCategory': 'Add Category',
    'viewProfile': 'View Profile',
    'deleteAccount': 'Delete Account',
    'reasonForDeletion': 'Reason for deletion',
    'confirmDeletion': 'Confirm Deletion',
    'terminateAccount': 'Terminate Account',
    'approve': 'Approve',
    'disapprove': 'Disapprove',
    'resolve': 'Resolve',
    'deleteItem': 'Delete Item',
  },
  bg: {
    // Common
    'welcome': 'Добре дошли',
    'login': 'Вход',
    'logout': 'Изход',
    'signin': 'Регистрация',
    'username': 'Потребителско име',
    'email': 'Имейл',
    'password': 'Парола',
    'confirmPassword': 'Потвърди парола',
    'forgotPassword': 'Забравена парола',
    'resetPassword': 'Възстанови парола',
    'changePassword': 'Промени парола',
    'submit': 'Изпрати',
    'cancel': 'Отказ',
    'delete': 'Изтрий',
    'edit': 'Редактирай',
    'save': 'Запази',
    'close': 'Затвори',
    'continue': 'Продължи',
    'goBack': 'Назад',
    'yes': 'Да',
    'no': 'Не',
    'ok': 'ОК',
    'search': 'Търсене',
    'loading': 'Зареждане...',
    'error': 'Грешка',
    'success': 'Успех',
    'settings': 'Настройки',
    'account': 'Профил',
    'theme': 'Тема на приложението',
    'language': 'Език',
    'english': 'Английски',
    'bulgarian': 'Български',
    
    // Admin
    'users': 'Потребители',
    'tags': 'Тагове',
    'categories': 'Категории',
    'reports': 'Доклади',
    'toReview': 'За преглед',
    'addAdmin': 'Добави администратор',
    'addTag': 'Добави таг',
    'addCategory': 'Добави категория',
    'viewProfile': 'Виж профил',
    'deleteAccount': 'Изтрий акаунт',
    'reasonForDeletion': 'Причина за изтриване',
    'confirmDeletion': 'Потвърди изтриване',
    'terminateAccount': 'Прекрати акаунт',
    'approve': 'Одобри',
    'disapprove': 'Отхвърли',
    'resolve': 'Разреши',
    'deleteItem': 'Изтрий елемент',
  }
};

export const translate = (key: string, lang: Language = 'en'): string => {
  return translations[lang]?.[key] || translations.en[key] || key;
};

export const getLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('appLanguage') as Language;
    if (saved && (saved === 'en' || saved === 'bg')) {
      return saved;
    }
  }
  return 'en';
};

export const setLanguage = (lang: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('appLanguage', lang);
    document.documentElement.setAttribute('lang', lang);
  }
};
