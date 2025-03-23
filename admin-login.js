document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = {
        apiKey: "AIzaSyDrZgPq-Pi1QzpNGyM52uy2oAoerZ8zNMw",
        authDomain: "senai-6f084.firebaseapp.com",
        projectId: "senai-6f084",
        storageBucket: "senai-6f084.firebasestorage.app",
        messagingSenderId: "892791288823",
        appId: "1:892791288823:web:e6b7b27f22f7981cc234f2"
    };

    const app = firebase.initializeApp(firebaseConfig);

    const adminLoginForm = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const loginError = document.getElementById('loginError');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
    }

    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        const eyeIcon = this.querySelector('i');
        eyeIcon.classList.toggle('fa-eye');
        eyeIcon.classList.toggle('fa-eye-slash');
    });

    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        setFormLoading(true);

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function(userCredential) {

                if (rememberMeCheckbox.checked) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                window.location.href = 'admin-dashboard.html';
            })
            .catch(function(error) {

                setFormLoading(false);
                showError(getPortugueseErrorMessage(error.code));
            });
    });

    function setFormLoading(isLoading) {
        const loginBtn = document.querySelector('.login-btn');

        if (isLoading) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            emailInput.disabled = true;
            passwordInput.disabled = true;
            togglePasswordBtn.disabled = true;
        } else {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Entrar</span><i class="fas fa-arrow-right"></i>';
            emailInput.disabled = false;
            passwordInput.disabled = false;
            togglePasswordBtn.disabled = false;
        }
    }

    function showError(message) {
        loginError.querySelector('p').textContent = message;
        loginError.classList.add('active');

        adminLoginForm.classList.add('shake');
        setTimeout(() => {
            adminLoginForm.classList.remove('shake');
        }, 500);

        passwordInput.focus();
        passwordInput.select();
    }

    function getPortugueseErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-email':
                return 'Endereço de e-mail inválido. Verifique o formato.';
            case 'auth/user-disabled':
                return 'Esta conta foi desativada. Entre em contato com o administrador.';
            case 'auth/user-not-found':
                return 'Não existe uma conta com este e-mail. Verifique suas credenciais.';
            case 'auth/wrong-password':
                return 'Senha incorreta. Tente novamente ou redefina sua senha.';
            case 'auth/too-many-requests':
                return 'Muitas tentativas de login. Tente novamente mais tarde.';
            case 'auth/network-request-failed':
                return 'Erro de conexão. Verifique sua internet e tente novamente.';
            default:
                return 'Erro ao fazer login. Verifique suas credenciais e tente novamente.';
        }
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {

            window.location.href = 'admin-dashboard.html';
        }
    });
});