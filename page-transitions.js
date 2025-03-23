document.addEventListener('DOMContentLoaded', function() {

    document.body.classList.add('page-transition-in');

    setTimeout(() => {
        document.body.classList.remove('page-transition-in');
    }, 500);

    const navLinks = document.querySelectorAll('.admin-nav-item, .navbar-link, a[href]:not([href^="#"]):not([target="_blank"])');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {

            const href = this.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || this.hasAttribute('target')) {
                return;
            }

            e.preventDefault();
            const destino = this.href;

            document.body.classList.add('page-transition-out');

            setTimeout(() => {
                window.location.href = destino;
            }, 300);
        });
    });
});