// ===================================================================
// DYNAMIC FEATURES: TYPING, PARTICLES, SCROLL, PROJECT LOADING, AOS
// ===================================================================

// --- 1. TYPING EFFECT LOGIC ---
const typingTextElement = document.querySelector('.typing-text');
const textToType = "Cloud Engineer";
const TYPING_SPEED = 50;
const BACK_SPEED = 25;
const PAUSE_DELAY = 1500;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    if (!typingTextElement) return;

    const currentText = textToType;
    if (!isDeleting) {
        if (charIndex < currentText.length) {
            typingTextElement.textContent += currentText.charAt(charIndex);
            charIndex++;
            setTimeout(typeEffect, TYPING_SPEED);
        } else {
            isDeleting = true;
            setTimeout(typeEffect, PAUSE_DELAY);
        }
    } else {
        if (charIndex > 0) {
            typingTextElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            setTimeout(typeEffect, BACK_SPEED);
        } else {
            isDeleting = false;
            setTimeout(typeEffect, TYPING_SPEED);
        }
    }
}
if (typingTextElement) {
    typeEffect();
}


// --- 2. MAIN DOM CONTENT LOADED LOGIC (Project Loading, Menu, AOS, Particles) ---
document.addEventListener('DOMContentLoaded', () => {

    // A. Project Card Rendering — fetched from the backend API (MongoDB Atlas)
    const projectList = document.getElementById('project-list');
    if (projectList) {
        const apiBase = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || '/api';
        fetch(`${apiBase}/projects`)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load projects: ${response.status}`);
                return response.json();
            })
            .then(projectsData => {
                projectsData.forEach((project, index) => {
                    const techSpans = project.tech.map(t => `<span>${t}</span>`).join('');

                    const cardHTML = `
                        <div class="project-card" data-aos="zoom-in" data-aos-delay="${500 + (index * 100)}">
                            <div class="project-header">
                                <i class="fas fa-cubes"></i>
                                <h3>${project.title}</h3>
                            </div>
                            <p>${project.description}</p>
                            <div class="tech-stack">
                                ${techSpans}
                            </div>
                            <a href="${project.link}" class="view-repo-btn" target="_blank">View Repository <i class="fab fa-github"></i></a>
                        </div>
                    `;

                    projectList.insertAdjacentHTML('beforeend', cardHTML);
                });

                // Refresh AOS so it picks up the newly-inserted, dynamically-loaded cards
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
            })
            .catch(err => {
                console.error(err);
                projectList.innerHTML = '<p class="project-load-error">Unable to load projects right now. Please check back later.</p>';
            });
    }

    // B. Mobile Menu Toggle Logic
    const menuBtn = document.getElementById('menu-btn');
    const navbar = document.querySelector('header .navbar');
    const navLinks = document.querySelectorAll('header .navbar ul li a');

    const toggleMenu = () => {
        navbar.classList.toggle('nav-toggle');
        menuBtn.classList.toggle('fa-bars');
        menuBtn.classList.toggle('fa-times');
    };

    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMenu);
    }

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('nav-toggle')) {
                toggleMenu();
            }
        });
    });


    // C. AOS INITIALIZATION (repeats on scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            delay: 200,
            duration: 800,
            once: false,     // animation replays every time the element re-enters view
            mirror: true,    // resets animation when element scrolls out
        });
    }


    // D. Particles.js background — inline config (no external file dependency)
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 60, density: { enable: true, value_area: 900 } },
                color: { value: "#00c9ff" },
                shape: { type: "circle" },
                opacity: { value: 0.4, random: true },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 140,
                    color: "#00c9ff",
                    opacity: 0.25,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1.2,
                    direction: "none",
                    random: true,
                    straight: false,
                    out_mode: "out",
                    bounce: false
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "grab" },
                    onclick: { enable: true, mode: "push" },
                    resize: true
                },
                modes: {
                    grab: { distance: 160, line_linked: { opacity: 0.5 } },
                    push: { particles_nb: 3 }
                }
            },
            retina_detect: true
        });
        console.log("particles.js initialized");
    }

    // E. Contact Form Submission — posts to the backend API (saved in MongoDB Atlas)
    const contactForm = document.getElementById('contact-form');
    const contactStatus = document.getElementById('contact-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const apiBase = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || '/api';
            const submitBtn = contactForm.querySelector('.submit-button-new');

            const payload = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                message: document.getElementById('message').value.trim()
            };

            if (submitBtn) submitBtn.disabled = true;
            if (contactStatus) {
                contactStatus.textContent = 'Sending...';
                contactStatus.className = 'contact-status-new';
            }

            try {
                const response = await fetch(`${apiBase}/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Something went wrong');
                }

                if (contactStatus) {
                    contactStatus.textContent = "Thanks! Your message has been sent — I'll get back to you soon.";
                    contactStatus.className = 'contact-status-new success';
                }
                contactForm.reset();
            } catch (err) {
                if (contactStatus) {
                    contactStatus.textContent = err.message || 'Failed to send message. Please try again.';
                    contactStatus.className = 'contact-status-new error';
                }
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
});


// --- 3. SCROLL EVENT FOR ACTIVE LINK HIGHLIGHT ---
const sections = document.querySelectorAll(".section");
const navLinksArray = document.querySelectorAll(".navbar ul li a");

window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach((section) => {
        // Offset by ~100px to account for the fixed header
        const sectionTop = section.offsetTop - 100;
        if (scrollY >= sectionTop) {
            current = section.getAttribute("id");
        }
    });

    // Check for the "home" section specifically
    const aboutEl = document.getElementById('about');
    if (aboutEl && window.scrollY < aboutEl.offsetTop - 100) {
        current = "home";
    }

    navLinksArray.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + current) {
            link.classList.add("active");
        }
    });
});


// --- 4. jQuery Ready Function for Click Handlers ---
$(document).ready(function() {

    // Smooth scrolling for hash links (NAV LINKS & FOOTER LINKS)
    $('a[href*="#"]').on('click', function (e) {
        // Only prevent default if the link is a section ID
        if ($(this).attr('href').startsWith('#') && $(this).attr('href').length > 1) {
            e.preventDefault();

            // Get target position and adjust for fixed header (70px)
            const targetId = $(this).attr('href');
            const targetOffset = $(targetId).offset().top - 70;

            $('html, body').animate({
                scrollTop: targetOffset,
            }, 500, 'linear');
        }
    });

    // Scroll-to-Top Button Toggle and Animation
    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 50) {
            $('#scroll-top').addClass('active');
        } else {
            $('#scroll-top').removeClass('active');
        }
    });

    $('#scroll-top').on('click', function() {
        $('html, body').animate({ scrollTop: 0 }, 800);
        return false;
    });
});
