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

function getQueryParams() {
    return new URLSearchParams(window.location.search);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function extractClassNumber(className) {
    const match = String(className || '').match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 999;
}

function getPeriodsForDay(timeMap, dayNum) {
    const periods = Object.keys(timeMap || {})
        .map(key => {
            const [day, period] = key.split('_').map(Number);
            return { day, period };
        })
        .filter(item => item.day === dayNum)
        .map(item => item.period)
        .sort((a, b) => a - b);

    if (periods.length > 0) return periods;

    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
}

function buildViewUrl(type, id, day) {
    return `./vaade.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}&day=${encodeURIComponent(day)}`;
}

function buildPrintUrl(type, id) {
    return `./print.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
}

function initHomeLogic() {
    const myTimetableUrl = localStorage.getItem('myTimetableUrl');
    const menu = document.getElementById('main-menu');

    if (myTimetableUrl && menu) {
        const dayParam = getDefaultDay();

        const myButton = document.createElement('a');
        myButton.href = myTimetableUrl + '&day=' + dayParam;
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
        return buildViewUrl(item.type, item.id, getDefaultDay());
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

function getEntityCollection(data, type) {
    if (type === 'teacher') return data.teachers || {};
    if (type === 'class') return data.classes || {};
    if (type === 'room') return data.rooms || {};
    return {};
}

function getEntityLabel(type) {
    if (type === 'teacher') return 'Õpetaja';
    if (type === 'class') return 'Klass';
    if (type === 'room') return 'Ruum';
    return 'Vaade';
}

function getEntityPluralPage(type) {
    if (type === 'teacher') return './opetajad.html';
    if (type === 'class') return './klassid.html';
    if (type === 'room') return './ruumid.html';
    return './index.html';
}

function getEntityTitle(type, name) {
    if (type === 'teacher') return `Õpetaja ${name} tunniplaan`;
    if (type === 'class') return `Klassi ${name} tunniplaan`;
    if (type === 'room') return `Ruumi ${name} tunniplaan`;
    return name;
}

function getLessonsForSelection(data, type, id) {
    const lessons = data.lessons || [];

    if (type === 'teacher') {
        return lessons.filter(lesson => lesson.teacher_raw_id === id);
    }

    if (type === 'class') {
        return lessons.filter(lesson => Array.isArray(lesson.class_raw_ids) && lesson.class_raw_ids.includes(id));
    }

    if (type === 'room') {
        return lessons.filter(lesson => lesson.room_raw_id === id);
    }

    return [];
}

function getSortedIdsForType(data, type) {
    if (type === 'teacher') {
        const activeTeacherIds = new Set(
            (data.lessons || []).map(lesson => lesson.teacher_raw_id).filter(Boolean)
        );

        return Object.entries(data.teachers || {})
            .filter(([id]) => activeTeacherIds.has(id))
            .sort((a, b) => a[1].localeCompare(b[1], 'et'))
            .map(([id]) => id);
    }

    if (type === 'class') {
        return Object.entries(data.classes || {})
            .sort((a, b) => {
                const diff = extractClassNumber(a[1]) - extractClassNumber(b[1]);
                if (diff !== 0) return diff;
                return a[1].localeCompare(b[1], 'et');
            })
            .map(([id]) => id);
    }

    if (type === 'room') {
        return Object.entries(data.rooms || {})
            .sort((a, b) => a[1].localeCompare(b[1], 'et'))
            .map(([id]) => id);
    }

    return [];
}

function getPrevNextIds(data, type, currentId) {
    const ids = getSortedIdsForType(data, type);
    const index = ids.indexOf(currentId);

    if (index === -1 || ids.length === 0) {
        return { prevId: null, nextId: null };
    }

    const prevId = ids[(index - 1 + ids.length) % ids.length];
    const nextId = ids[(index + 1) % ids.length];

    return { prevId, nextId };
}

function filterLessonsByDay(allLessons, selectedDay, timeMap) {
    const activeDayNum = Number(selectedDay);
    const periods = getPeriodsForDay(timeMap || {}, activeDayNum);

    const lessonsForDay = allLessons
        .filter(lesson => lesson.day === activeDayNum)
        .sort((a, b) => a.period - b.period);

    const grouped = new Map();

    lessonsForDay.forEach(lesson => {
        if (!grouped.has(lesson.period)) {
            grouped.set(lesson.period, []);
        }
        grouped.get(lesson.period).push(lesson);
    });

    const result = periods.map(periodNum => {
        const periodLessons = grouped.get(periodNum);
        const timeKey = `${activeDayNum}_${periodNum}`;
        const [start, end] = (timeMap || {})[timeKey] || ['--:--', '--:--'];

        if (periodLessons && periodLessons.length > 0) {
            return periodLessons.map(lesson => ({
                ...lesson,
                starttime: lesson.starttime || start,
                endtime: lesson.endtime || end
            }));
        }

        return [{
            day: activeDayNum,
            period: periodNum,
            starttime: start,
            endtime: end,
            subject: '',
            teacher: '',
            class_name: '',
            room: '',
            teacher_raw_id: '',
            class_raw_ids: [],
            room_raw_id: ''
        }];
    });

    return result;
}

function renderDayButtons(type, id, activeDay) {
    const container = document.getElementById('day-buttons');
    if (!container) return;

    const days = [
        [1, 'Esmaspäev'],
        [2, 'Teisipäev'],
        [3, 'Kolmapäev'],
        [4, 'Neljapäev'],
        [5, 'Reede']
    ];

    container.innerHTML = days.map(([dayNum, dayName]) => `
        <a href="${buildViewUrl(type, id, dayNum)}"
           class="btn ${activeDay === dayNum ? 'btn-primary' : 'btn-outline-primary'}">
           ${dayName}
        </a>
    `).join('');
}

function renderDesktopTable(type, groupedLessons) {
    const tableBody = document.getElementById('desktop-timetable-body');
    if (!tableBody) return;

    tableBody.innerHTML = groupedLessons.map(periodLessons => {
        const first = periodLessons[0];

        const subjectHtml = periodLessons.map(lesson => `
            <div>${lesson.subject ? escapeHtml(lesson.subject) : '&nbsp;'}</div>
        `).join('<hr class="my-1">');

        const classHtml = periodLessons.map(lesson => `
            <div>${lesson.class_name ? escapeHtml(lesson.class_name) : '&nbsp;'}</div>
        `).join('<hr class="my-1">');

        const teacherHtml = periodLessons.map(lesson => `
            <div>${lesson.teacher ? escapeHtml(lesson.teacher) : '&nbsp;'}</div>
        `).join('<hr class="my-1">');

        const roomHtml = periodLessons.map(lesson => `
            <div>${lesson.room ? escapeHtml(lesson.room) : '&nbsp;'}</div>
        `).join('<hr class="my-1">');

        return `
            <tr class="lesson-row" data-starttime="${escapeHtml(first.starttime)}" data-endtime="${escapeHtml(first.endtime)}">
                <td>${escapeHtml(first.period)}. tund</td>
                <td>${escapeHtml(first.starttime)}</td>
                <td>${escapeHtml(first.endtime)}</td>
                <td>${subjectHtml}</td>
                ${type !== 'class' ? `<td>${classHtml}</td>` : ''}
                ${type !== 'teacher' ? `<td>${teacherHtml}</td>` : ''}
                ${type !== 'room' ? `<td>${roomHtml}</td>` : ''}
            </tr>
        `;
    }).join('');
}

function renderMobileCards(type, groupedLessons) {
    const container = document.getElementById('mobile-timetable');
    if (!container) return;

    container.innerHTML = groupedLessons.map(periodLessons => {
        const first = periodLessons[0];

        const entries = periodLessons.map(lesson => {
            const hasContent = lesson.subject || lesson.teacher || lesson.class_name || lesson.room;

            if (!hasContent) {
                return `<div class="card-body text-muted">Vaba</div>`;
            }

            return `
                <div class="card-body">
                    <h6 class="card-title fw-bold">${escapeHtml(lesson.subject || '')}</h6>
                    ${type !== 'class' ? `<p class="card-text mb-1"><strong>Klass:</strong> ${escapeHtml(lesson.class_name || '')}</p>` : ''}
                    ${type !== 'teacher' ? `<p class="card-text mb-1"><strong>Õpetaja:</strong> ${escapeHtml(lesson.teacher || '')}</p>` : ''}
                    ${type !== 'room' ? `<p class="card-text mb-0"><strong>Ruum:</strong> ${escapeHtml(lesson.room || '')}</p>` : ''}
                </div>
            `;
        }).join('<div class="border-bottom"></div>');

        return `
            <div class="card mb-3 shadow-sm lesson-card" data-starttime="${escapeHtml(first.starttime)}" data-endtime="${escapeHtml(first.endtime)}">
                <div class="card-header bg-light">
                    <strong>${escapeHtml(first.period)}. tund</strong> (${escapeHtml(first.starttime)} - ${escapeHtml(first.endtime)})
                </div>
                ${entries}
            </div>
        `;
    }).join('');
}

async function initViewPage() {
    const data = await loadTimetableData();
    const errorEl = document.getElementById('page-error');
    const titleEl = document.getElementById('page-title');
    const updatedEl = document.getElementById('last-updated-text');
    const navBackEl = document.getElementById('nav-back-link');
    const prevEl = document.getElementById('prev-link');
    const nextEl = document.getElementById('next-link');
    const saveBtn = document.getElementById('saveViewButton');
    const printBtn = document.getElementById('printViewButton');
    const desktopHeaderRow = document.getElementById('desktop-header-row');

    if (!data) {
        errorEl.classList.remove('d-none');
        titleEl.textContent = 'Andmed puuduvad';
        updatedEl.textContent = 'Andmeid ei õnnestunud laadida.';
        return;
    }

    const params = getQueryParams();
    const type = params.get('type');
    const id = params.get('id');
    const day = Number(params.get('day') || getDefaultDay());

    if (!type || !id) {
        errorEl.classList.remove('d-none');
        titleEl.textContent = 'Vigane vaade';
        updatedEl.textContent = 'Puuduv type või id.';
        return;
    }

    const collection = getEntityCollection(data, type);
    const entityName = collection[id] || 'Tundmatu';

    titleEl.textContent = getEntityTitle(type, entityName);
    document.title = getEntityTitle(type, entityName);
    updatedEl.textContent = `Viimati uuendatud: ${data.meta?.last_updated || 'Teadmata'}`;
    navBackEl.href = getEntityPluralPage(type);

    renderDayButtons(type, id, day);

    const { prevId, nextId } = getPrevNextIds(data, type, id);
    if (prevId) {
        prevEl.href = buildViewUrl(type, prevId, day);
        prevEl.classList.remove('d-none');
    }

    if (nextId) {
        nextEl.href = buildViewUrl(type, nextId, day);
        nextEl.classList.remove('d-none');
    }

    const allLessons = getLessonsForSelection(data, type, id);
    const groupedLessons = filterLessonsByDay(allLessons, day, data.time_map || {});

    const saveUrl = `./vaade.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
    saveBtn.dataset.url = saveUrl;
    printBtn.href = buildPrintUrl(type, id);

    if (desktopHeaderRow) {
        desktopHeaderRow.innerHTML = `
            <th>Periood</th>
            <th>Algus</th>
            <th>Lõpp</th>
            <th>Aine</th>
            ${type !== 'class' ? '<th>Klass</th>' : ''}
            ${type !== 'teacher' ? '<th>Õpetaja</th>' : ''}
            ${type !== 'room' ? '<th>Ruum</th>' : ''}
        `;
    }

    renderDesktopTable(type, groupedLessons);
    renderMobileCards(type, groupedLessons);
    initTimetableLogic(day);
}
