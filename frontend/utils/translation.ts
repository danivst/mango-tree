export type Language = 'en' | 'bg';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    upload: 'Upload',
    notifications: 'Notifications',
    profile: 'Profile',
    login: 'Login',
  },
  bg: {
    home: 'Начало',
    upload: 'Качване',
    notifications: 'Известия',
    profile: 'Профил',
    login: 'Вход',
  },
};

let currentLang: Language = 'en';

export function initTranslation(langToggleId: string) {
  const langToggle = document.getElementById(langToggleId);
  if (!langToggle) return;

  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'bg' : 'en';
    langToggle.textContent = currentLang === 'en' ? 'BG' : 'EN';
    translatePage();
  });

  translatePage();
}

export function translatePage() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
}