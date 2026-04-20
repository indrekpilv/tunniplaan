const DATA_URL = "../data/timetable.json";

async function loadTimetableData() {
    try {
        const response = await fetch(DATA_URL + "?v=" + Date.now());
        if (!response.ok) {
            throw new Error("Andmete laadimine ebaõnnestus");
        }
        return await response.json();
    } catch (error) {
        console.error("Viga timetable.json laadimisel:", error);
        return null;
    }
}

function initTheme() {
    const htmlElement = document.getElementById('html-root');
    const toggleButton = document.getElementById('theme-toggle');
    const iconSpan = document.getElementById('theme-icon');

    if (!htmlElement) return;

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let currentTheme = 'light';

    if (savedTheme) {
        currentTheme = savedTheme;
    } else if (systemPrefersDark) {
        currentTheme = 'dark';
    }

    setTheme(currentTheme);

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const newTheme = htmlElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    function setTheme(theme) {
        htmlElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);

        if (iconSpan) {
            iconSpan.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
}

function initHomeLogic() {
    const myTimetableUrl = localStorage.getItem('myTimetableUrl');
    const menu = document.getElementById('main-menu');

    if (myTimetableUrl && menu) {
        const day = new Date().getDay();
        const dayParam = (day >= 1 && day <= 5) ? day : 1;

        const myButton = document.createElement('a');
        myButton.href = myTimetableUrl + '?day=' + dayParam;
        myButton.className = 'btn btn-warning btn-lg fs-4 py-3 fw-bold';
        myButton.textContent = 'Ava minu tunniplaan';

        menu.prepend(myButton);
    }
}
