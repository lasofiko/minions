// Переключение между формами входа и регистрации
document.addEventListener('DOMContentLoaded', function() {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Переключение табов
    loginTab.addEventListener('click', function() {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    registerTab.addEventListener('click', function() {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    // Показать/скрыть пароль
    const toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Обработка отправки формы входа
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Здесь будет логика входа
        console.log('Вход:', { email, password, rememberMe });

        // Имитация успешного входа
        alert('Вход выполнен успешно!');
        // window.location.href = 'create.html'; // Перенаправление на страницу создания
    });

    // Обработка отправки формы регистрации
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Простая валидация
        if (password !== confirmPassword) {
            alert('Пароли не совпадают!');
            return;
        }

        if (password.length < 6) {
            alert('Пароль должен содержать минимум 6 символов');
            return;
        }

        // Здесь будет логика регистрации
        console.log('Регистрация:', { name, email, password });

        // Имитация успешной регистрации
        alert('Регистрация прошла успешно!');
        // window.location.href = 'create.html'; // Перенаправление на страницу создания
    });

    // Проверяем параметры URL для открытия нужной вкладки
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'register') {
        registerTab.click();
    }
});