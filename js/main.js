/* ===========================================
   Main JavaScript
   Intersection Observer, Scroll, Theme Toggle
   =========================================== */

// Intersection Observer for fade-in animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Parallax effect on hero graphics
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const tree = document.querySelector('.tree-illustration');
    const orbital = document.querySelector('.hero-graphic-industrial');
    const castle = document.querySelector('.castle-illustration');

    if (tree && scrolled < window.innerHeight) {
        tree.style.transform = `translateY(${scrolled * 0.15}px)`;
    }
    if (orbital && scrolled < window.innerHeight) {
        orbital.style.transform = `translateY(${scrolled * 0.2}px)`;
    }
    if (castle && scrolled < window.innerHeight) {
        castle.style.transform = `translateY(${scrolled * 0.12}px)`;
    }
});

// Theme Toggle Functionality - 3-Way Cycle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const themes = ['forest', 'industrial', 'fantasy'];

// Check for saved theme preference or default to 'forest'
const savedTheme = localStorage.getItem('theme') || 'forest';
if (savedTheme !== 'forest') {
    html.setAttribute('data-theme', savedTheme);
}

// Get current theme
function getCurrentTheme() {
    return html.getAttribute('data-theme') || 'forest';
}

// Toggle theme on button click - cycles: forest -> industrial -> fantasy -> forest
themeToggle.addEventListener('click', () => {
    const currentTheme = getCurrentTheme();
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

    if (nextTheme === 'forest') {
        html.removeAttribute('data-theme');
    } else {
        html.setAttribute('data-theme', nextTheme);
    }

    localStorage.setItem('theme', nextTheme);
});
