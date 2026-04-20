function getDataUrl() {
    return new URL('./data/timetable.json', document.baseURI).href;
}

async function loadTimetableData() {
    try {
        const response = await fetch(getDataUrl() + '?v=' + Date.now());
        if (!response.ok) {
            throw new Error('Andmete laadimine ebaõnnestus');
        }
        return await response.json();
    } catch (error) {
        console.error('Viga timetable.json laadimisel:', error);
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

function getDefaultDay() {
    const day = new Date().getDay();
    return (day >= 1 && day <= 5) ? day : 1;
}

function initHomeLogic() {
    const myTimetableUrl = localStorage.getItem('myTimetableUrl');
    const menu = document.getElementById('main-menu');

    if (myTimetableUrl && menu) {
        const dayParam = getDefaultDay();

        const myButton = document.createElement('a');
        myButton.href = myTimetableUrl + '?day=' + dayParam;
        myButton.className = 'btn btn-warning btn-lg fs-4 py-3 fw-bold';
        myButton.textContent = 'Ava minu tunniplaan';

        menu.prepend(myButton);
    }
}

function initLiveSearch(dataList) {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('search-results');
    let activeIndex = -1;

    if (!searchInput || !searchResults) return;

    function buildUrl(item) {
        return `./vaade.html?type=${encodeURIComponent(item.type)}&id=${encodeURIComponent(item.id)}&day=${getDefaultDay()}`;
    }

    function showResults(query) {
        searchResults.innerHTML = '';
        activeIndex = -1;

        const filtered = dataList.filter(item =>
            item.name.toLowerCase().includes(query)
        );

        filtered.forEach((item, index) => {
            const link = document.createElement('a');
            link.href = buildUrl(item);
            link.textContent = item.name;
            link.classList.add('list-group-item', 'list-group-item-action');

            link.addEventListener('mouseenter', () => {
                searchResults.querySelectorAll('a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');
                activeIndex = index;
            });

            searchResults.appendChild(link);
        });
    }

    searchInput.addEventListener('keydown', function(e) {
        const links = searchResults.querySelectorAll('a');
        if (links.length === 0) return;

        if (activeIndex > -1 && links[activeIndex]) {
            links[activeIndex].classList.remove('active');
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex++;
            if (activeIndex >= links.length) activeIndex = 0;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex--;
            if (activeIndex < 0) activeIndex = links.length - 1;
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex > -1 && links[activeIndex]) {
                links[activeIndex].click();
            }
        } else {
            return;
        }

        if (links[activeIndex]) {
            links[activeIndex].classList.add('active');
            links[activeIndex].scrollIntoView({ block: 'nearest' });
        }
    });

    searchInput.addEventListener('input', function() {
        showResults(this.value.toLowerCase());
    });

    searchInput.addEventListener('click', function() {
        if (this.value.length === 0) showResults('');
    });

    document.addEventListener('click', function(e) {
        if (e.target !== searchInput) {
            searchResults.innerHTML = '';
        }
    });
}

function initTimetableLogic(activeDay) {
    const currentDay = new Date().getDay();

    if (activeDay && currentDay === activeDay) {
        const now = new Date();
        const currentTime = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);

        const highlight = (elem) => {
            const start = elem.dataset.starttime;
            const end = elem.dataset.endtime;

            if (start && start !== '--:--' && end && end !== '--:--') {
                if (currentTime >= start && currentTime < end) {
                    elem.classList.add('current-lesson');
                }
            }
        };

        document.querySelectorAll('.lesson-card, .lesson-row').forEach(highlight);
    }

    const saveBtn = document.getElementById('saveViewButton');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const url = this.dataset.url;
            if (url) {
                localStorage.setItem('myTimetableUrl', url);
                const confirmMsg = document.getElementById('saveConfirmation');
                if (confirmMsg) {
                    confirmMsg.classList.remove('d-none');
                    setTimeout(() => confirmMsg.classList.add('d-none'), 3000);
                }
            }
        });
    }
}
