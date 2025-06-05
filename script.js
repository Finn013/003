// Improved environment detection for Service Worker registration
function isUnsupportedEnvironment() {
    // Check current window location
    const currentUrl = window.location.href;
    if (currentUrl.includes('stackblitz.io') || currentUrl.includes('webcontainer.io')) {
        return true;
    }

    // Check if we're in an iframe and check parent window location
    if (window.self !== window.top) {
        try {
            const parentUrl = window.parent.location.href;
            if (parentUrl.includes('stackblitz.io') || parentUrl.includes('webcontainer.io')) {
                return true;
            }
        } catch (e) {
            // If we can't access parent location due to same-origin policy,
            // err on the side of caution and disable Service Worker
            return true;
        }
    }

    return false;
}

// Проверка поддержки Service Worker и среды выполнения
if ('serviceWorker' in navigator && !isUnsupportedEnvironment()) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker зарегистрирован');
            })
            .catch(error => {
                console.error('Ошибка при регистрации ServiceWorker:', error);
            });
    });
}

// Состояние приложения
let modules = JSON.parse(localStorage.getItem('modules')) || [];

// DOM элементы
const modulesList = document.getElementById('modulesList');
const previewFrame = document.getElementById('previewFrame');
const codeEditor = document.getElementById('codeEditor');
const codeInput = document.getElementById('codeInput');
const moduleUrl = document.getElementById('moduleUrl');
const offlineIndicator = document.getElementById('offlineIndicator');

// Обработчики событий
document.getElementById('addFileBtn').addEventListener('click', handleFileUpload);
document.getElementById('addCodeBtn').addEventListener('click', showCodeEditor);
document.getElementById('loadUrlBtn').addEventListener('click', handleUrlLoad);
document.getElementById('saveCodeBtn').addEventListener('click', handleCodeSave);
document.getElementById('cancelCodeBtn').addEventListener('click', hideCodeEditor);
document.getElementById('closePreviewBtn').addEventListener('click', closePreview);

// Отслеживание состояния сети
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Функции
function updateOnlineStatus() {
    if (navigator.onLine) {
        offlineIndicator.classList.add('hidden');
    } else {
        offlineIndicator.classList.remove('hidden');
    }
}

function handleFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.htm';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const content = await file.text();
                addModule({
                    name: file.name,
                    content: content,
                    type: 'file'
                });
            } catch (error) {
                alert('Ошибка при чтении файла');
            }
        }
    };
    input.click();
}

function showCodeEditor() {
    codeEditor.classList.remove('hidden');
    codeInput.value = '';
}

function hideCodeEditor() {
    codeEditor.classList.add('hidden');
}

function handleCodeSave() {
    const content = codeInput.value.trim();
    if (content) {
        addModule({
            name: 'Пользовательский модуль ' + (modules.length + 1),
            content: content,
            type: 'code'
        });
        hideCodeEditor();
    }
}

function handleUrlLoad() {
    const url = moduleUrl.value.trim();
    if (url) {
        addModule({
            name: url,
            content: url,
            type: 'url'
        });
        moduleUrl.value = '';
    }
}

function addModule(module) {
    modules.push(module);
    saveModules();
    renderModules();
}

function removeModule(index) {
    modules.splice(index, 1);
    saveModules();
    renderModules();
    closePreview();
}

function saveModules() {
    localStorage.setItem('modules', JSON.stringify(modules));
}

function renderModules() {
    modulesList.innerHTML = modules.map((module, index) => `
        <div class="module-item">
            <span class="module-title" onclick="previewModule(${index})">${module.name}</span>
            <div class="module-controls">
                <button class="btn danger" onclick="removeModule(${index})">Удалить</button>
            </div>
        </div>
    `).join('');
}

function previewModule(index) {
    const module = modules[index];
    if (module.type === 'url') {
        previewFrame.src = module.content;
    } else {
        const blob = new Blob([module.content], { type: 'text/html' });
        previewFrame.src = URL.createObjectURL(blob);
    }
}

function closePreview() {
    previewFrame.src = 'about:blank';
}

// Инициализация
renderModules();