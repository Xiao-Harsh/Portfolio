document.addEventListener('DOMContentLoaded', () => {
    // 1. Custom Cursor Logic
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    if (window.matchMedia("(pointer: fine)").matches) {
        // Only hide default cursor if JS successfully executes
        document.body.classList.add('has-custom-cursor');
        
        let posX = 0, posY = 0;
        let mouseX = 0, mouseY = 0;

        // GPU-accelerated follower animation using requestAnimationFrame
        const updateCursor = () => {
            // Linear interpolation for smooth trailing
            posX += (mouseX - posX) * 0.15;
            posY += (mouseY - posY) * 0.15;

            // Use transform: translate3d for GPU acceleration (avoids layout thrashing)
            follower.style.transform = `translate3d(${posX}px, ${posY}px, 0) translate(-50%, -50%)`;
            cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

            requestAnimationFrame(updateCursor);
        };

        let firstMove = true;
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (firstMove) {
                posX = mouseX;
                posY = mouseY;
                firstMove = false;
                updateCursor(); // Boot loop on first mouse movement to save idle CPU
            }
        });

        // Event Delegation for hover effects (automatically handles dynamically added elements)
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('a, button, input, textarea, .availability-badge, .skill-item, .stat-card')) {
                document.body.classList.add('cursor-hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a, button, input, textarea, .availability-badge, .skill-item, .stat-card')) {
                document.body.classList.remove('cursor-hover');
            }
        });
    } else {
        // Hide cursor elements completely on touch devices
        if (cursor) cursor.style.display = 'none';
        if (follower) follower.style.display = 'none';
    }

    // 2. Scroll Reveal Animation Logic
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: "0px 0px 0px 0px"
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 3. Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 4. Theme Toggle Logic
    const themeToggleBtn = document.querySelector('.theme-toggle');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');

    // Safe wrappers for localStorage to prevent security exceptions in private mode
    const getSavedTheme = () => {
        try {
            return localStorage.getItem('theme');
        } catch (e) {
            return null;
        }
    };

    const saveTheme = (theme) => {
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            // Silence exceptions in private browsing
        }
    };

    // Determine initial theme state (saved preference or system setting)
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = getSavedTheme();

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.body.classList.add('dark-mode');
        if (moonIcon) moonIcon.style.display = 'none';
        if (sunIcon) sunIcon.style.display = 'block';
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-label', 'Toggle Light Mode');
    } else {
        document.body.classList.remove('dark-mode');
        if (moonIcon) moonIcon.style.display = 'block';
        if (sunIcon) sunIcon.style.display = 'none';
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-label', 'Toggle Dark Mode');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');

            saveTheme(isDark ? 'dark' : 'light');

            if (isDark) {
                if (moonIcon) moonIcon.style.display = 'none';
                if (sunIcon) sunIcon.style.display = 'block';
                themeToggleBtn.setAttribute('aria-label', 'Toggle Light Mode');
            } else {
                if (moonIcon) moonIcon.style.display = 'block';
                if (sunIcon) sunIcon.style.display = 'none';
                themeToggleBtn.setAttribute('aria-label', 'Toggle Dark Mode');
            }
        });
    }

    // 5. Mobile Menu Toggle
    const menuToggleBtn = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav');

    if (menuToggleBtn && navMenu) {
        menuToggleBtn.addEventListener('click', () => {
            menuToggleBtn.classList.toggle('active');
            navMenu.classList.toggle('open');
            // Prevent scrolling on body when menu is open
            document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
        });

        // Close menu when clicking a link
        const navMenuLinks = navMenu.querySelectorAll('a');
        navMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggleBtn.classList.remove('active');
                navMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // 6. Navigation Active State on Scroll (ScrollSpy)
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a');

    function updateActiveNav() {
        let currentSectionId = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            // Check if the section occupies the top portion of the screen
            if (rect.top <= 300 && rect.bottom >= 100) {
                currentSectionId = section.getAttribute('id');
            }
        });

        // Fallback: if we are at the very bottom of the page, select the last section
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
            const lastSection = sections[sections.length - 1];
            if (lastSection) {
                currentSectionId = lastSection.getAttribute('id');
            }
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (currentSectionId && currentSectionId !== 'contact') {
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);
    window.addEventListener('load', updateActiveNav);
    updateActiveNav(); // Trigger initially to set correct state

    // 7. Skills Category Filtering
    const filterPills = document.querySelectorAll('.filter-pill');
    const skillItems = document.querySelectorAll('.skill-item');

    if (filterPills.length > 0 && skillItems.length > 0) {
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                // If clicked pill is already active, do nothing
                if (pill.classList.contains('active')) return;

                // Remove active class from all pills
                filterPills.forEach(p => p.classList.remove('active'));
                // Add active class to clicked pill
                pill.classList.add('active');

                const category = pill.getAttribute('data-category');

                const itemsToHide = [];
                const itemsToShow = [];

                skillItems.forEach(item => {
                    const itemCat = item.getAttribute('data-category');
                    if (category === 'all' || itemCat === category) {
                        itemsToShow.push(item);
                    } else {
                        itemsToHide.push(item);
                    }
                });

                // Phase 1: Fade out items that don't match
                itemsToHide.forEach(item => {
                    if (!item.classList.contains('hidden')) {
                        item.classList.add('fade-exit-active');
                    }
                });

                // Wait for fade-out transition, then swap display and trigger fade-in
                setTimeout(() => {
                    itemsToHide.forEach(item => {
                        item.classList.add('hidden');
                        item.classList.remove('fade-exit-active');
                    });

                    itemsToShow.forEach(item => {
                        if (item.classList.contains('hidden')) {
                            item.classList.remove('hidden');
                            item.classList.add('fade-enter');
                            
                            // Trigger reflow to restart animation
                            void item.offsetWidth;
                            
                            item.classList.add('fade-enter-active');
                            item.classList.remove('fade-enter');
                            
                            // Clean up classes after animation completes
                            setTimeout(() => {
                                item.classList.remove('fade-enter-active');
                            }, 350);
                        }
                    });
                }, 250); // Match style.css exit transition duration (0.25s)
            });
        });
    }
});
