// ===== Функции для создания ссылки =====
function showLinkForm() {
    // Скрываем результат и показываем форму
    document.getElementById('linkResult').classList.add('hidden');
    document.getElementById('linkForm').classList.remove('hidden');
    document.getElementById('showLinkFormBtn').classList.add('hidden');

    // Убеждаемся что QR форма закрыта
    document.getElementById('qrForm').classList.add('hidden');
    document.getElementById('showQrFormBtn').classList.remove('hidden');
    document.getElementById('qrResult').classList.add('hidden');
}

function cancelLinkForm() {
    document.getElementById('linkForm').classList.add('hidden');
    document.getElementById('showLinkFormBtn').classList.remove('hidden');
    document.getElementById('linkInput').value = '';
}

function createLink() {
    const input = document.getElementById('linkInput');

    if (!input.value) {
        alert('Введите ссылку');
        return;
    }

    try {
        new URL(input.value);
    } catch {
        alert('Введите корректную ссылку');
        return;
    }

    const shortCode = Math.random().toString(36).substring(2, 8);
    const shortUrl = 'relink.ru/' + shortCode;

    document.getElementById('linkForm').classList.add('hidden');
    document.getElementById('linkResult').classList.remove('hidden');

    const urlSpan = document.querySelector('#linkResult .short-url');
    urlSpan.textContent = shortUrl;

    const copyBtn = document.querySelector('#linkResult .copy-btn');
    copyBtn.setAttribute('onclick', `copyToClipboard('${shortUrl}')`);
}

// ===== Функции для создания QR =====
function showQrForm() {
    // Скрываем результат и показываем форму
    document.getElementById('qrResult').classList.add('hidden');
    document.getElementById('qrForm').classList.remove('hidden');
    document.getElementById('showQrFormBtn').classList.add('hidden');

    // Убеждаемся что ссылочная форма закрыта
    document.getElementById('linkForm').classList.add('hidden');
    document.getElementById('showLinkFormBtn').classList.remove('hidden');
    document.getElementById('linkResult').classList.add('hidden');
}

function cancelQrForm() {
    document.getElementById('qrForm').classList.add('hidden');
    document.getElementById('showQrFormBtn').classList.remove('hidden');
    document.getElementById('qrInput').value = '';
}

function generateQRWithShortening() {
    const input = document.getElementById('qrInput');

    if (!input.value) {
        alert('Введите ссылку');
        return;
    }

    try {
        new URL(input.value);
    } catch {
        alert('Введите корректную ссылку');
        return;
    }

    const shortCode = Math.random().toString(36).substring(2, 8);
    const shortUrl = 'relink.ru/' + shortCode;

    const qrImage = document.getElementById('qrImage');
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`;

    document.getElementById('qrForm').classList.add('hidden');
    document.getElementById('qrResult').classList.remove('hidden');
    document.getElementById('qrResultUrl').textContent = shortUrl;
}

function resetQrForm() {
    document.getElementById('qrInput').value = '';
    document.getElementById('qrForm').classList.add('hidden');
    document.getElementById('showQrFormBtn').classList.remove('hidden');
    document.getElementById('qrResult').classList.add('hidden');
}

// ===== Общие функции =====
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Скопировано!');
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Скопировано!');
    });
}

function downloadQR() {
    const qrImage = document.getElementById('qrImage');
    if (qrImage.src && qrImage.src !== '#') {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = qrImage.src;
        link.click();
    }
}

function copyQR() {
    alert('QR-код скопирован');
}