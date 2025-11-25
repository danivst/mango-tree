const translations = {
    en: {
        home: 'Home',
        upload: 'Upload',
        notifications: 'Notifications',
        profile: 'Profile',
        login: 'Login'
    },
    bg: {
        home: 'Начало',
        upload: 'Качване',
        notifications: 'Известия',
        profile: 'Профил',
        login: 'Вход'
    }
};

let currentLang = 'en';

const langToggle = document.getElementById('langToggle');
langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'bg' : 'en';
    langToggle.textContent = currentLang === 'en' ? 'BG' : 'EN';
    translatePage();
});

function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = translations[currentLang][key];
    });
}