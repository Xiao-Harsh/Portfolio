document.addEventListener('DOMContentLoaded', () => {
    // Remove preload class after page load to enable transitions
    if (document.readyState === 'complete') {
        document.body.classList.remove('preload');
    } else {
        window.addEventListener('load', () => {
            document.body.classList.remove('preload');
        });
    }

    // Common DOM Elements
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a');
    const siteHeader = document.querySelector('header');

    // 1. Custom Cursor Logic (Optimized for idle CPU and GPU acceleration)
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    if (window.matchMedia("(pointer: fine)").matches) {
        // Only hide default cursor if JS successfully executes
        document.body.classList.add('has-custom-cursor');

        let posX = 0, posY = 0;
        let mouseX = 0, mouseY = 0;
        let isRunning = false;
        let rafId = null;

        // GPU-accelerated follower animation using requestAnimationFrame
        const updateCursor = () => {
            const dx = mouseX - posX;
            const dy = mouseY - posY;

            // Linear interpolation for smooth trailing
            posX += dx * 0.15;
            posY += dy * 0.15;

            // Use transform: translate3d for GPU acceleration (avoids layout thrashing)
            if (follower) follower.style.transform = `translate3d(${posX}px, ${posY}px, 0) translate(-50%, -50%)`;
            if (cursor) cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

            // Sleep the animation loop when follower has settled
            if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
                posX = mouseX;
                posY = mouseY;
                isRunning = false;
                return;
            }

            rafId = requestAnimationFrame(updateCursor);
        };

        const startCursorLoop = () => {
            if (!isRunning && !document.hidden) {
                isRunning = true;
                rafId = requestAnimationFrame(updateCursor);
            }
        };

        let firstMove = true;
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (firstMove) {
                posX = mouseX;
                posY = mouseY;
                firstMove = false;
            }

            startCursorLoop();
        }, { passive: true });

        // Pause cursor loop when tab is hidden to save CPU/battery
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                isRunning = false;
                if (rafId) cancelAnimationFrame(rafId);
            } else if (!firstMove) {
                startCursorLoop();
            }
        });

        // Event Delegation for hover effects (automatically handles dynamically added elements)
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('a, button, input, textarea, .availability-badge, .skill-item')) {
                document.body.classList.add('cursor-hover');
            }
        }, { passive: true });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a, button, input, textarea, .availability-badge, .skill-item')) {
                document.body.classList.remove('cursor-hover');
            }
        }, { passive: true });
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
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.05, // Trigger when 5% visible
        rootMargin: "0px 0px -50px 0px" // Offset a bit to reveal cleanly
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 3. Smooth scrolling for internal links (excluding open-contact-btn which toggles the modal overlay)
    document.querySelectorAll('a[href^="#"]:not(.open-contact-btn)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            // Immediately clear/update active state on nav links
            if (targetId === '#contact') {
                navLinks.forEach(link => link.classList.remove('active'));
            } else {
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === targetId);
                });
            }

            if (targetId === '#home') {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                return;
            }

            if (targetId === '#contact') {
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth'
                });
                return;
            }

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

    // Determine initial theme state (default to dark mode on first visit)
    const savedTheme = getSavedTheme();
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : true;

    if (shouldBeDark) {
        document.body.classList.add('dark-mode');
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-label', 'Toggle Light Mode');
    } else {
        document.body.classList.remove('dark-mode');
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-label', 'Toggle Dark Mode');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');

            saveTheme(isDark ? 'dark' : 'light');

            if (isDark) {
                themeToggleBtn.setAttribute('aria-label', 'Toggle Light Mode');
            } else {
                themeToggleBtn.setAttribute('aria-label', 'Toggle Dark Mode');
            }
        });
    }

    // 5. Mobile Menu Toggle
    const menuToggleBtn = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav');

    if (menuToggleBtn && navMenu) {
        const closeMobileMenu = () => {
            if (navMenu.classList.contains('open')) {
                menuToggleBtn.classList.remove('active');
                navMenu.classList.remove('open');
                document.body.style.overflow = '';
            }
        };

        menuToggleBtn.addEventListener('click', () => {
            menuToggleBtn.classList.toggle('active');
            navMenu.classList.toggle('open');
            // Prevent scrolling on body when menu is open
            document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
        });

        // Close menu when clicking a link
        const navMenuLinks = navMenu.querySelectorAll('a');
        navMenuLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close menu when clicking anywhere outside of it
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('open') && 
                !navMenu.contains(e.target) && 
                !menuToggleBtn.contains(e.target)) {
                closeMobileMenu();
            }
        });

        // Close menu on pressing the Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMobileMenu();
            }
        });

        // Clean up mobile menu states and release scroll lock if viewport is resized to desktop sizes
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) {
                closeMobileMenu();
            }
        }, { passive: true });
    }

    // 6. Navigation Active State on Scroll (ScrollSpy with rAF throttling)
    let isScrollTicking = false;

    const updateActiveNav = () => {
        const headerHeight = siteHeader ? siteHeader.offsetHeight : 80;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const scrollPosition = scrollY + headerHeight + 50;
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const isNearBottom = (winHeight + scrollY) >= (docHeight - 100);

        let currentSectionId = '';

        if (isNearBottom) {
            currentSectionId = 'contact';
        } else if (scrollY < 100) {
            currentSectionId = 'home';
        } else {
            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                if (scrollPosition >= top && scrollPosition < top + height) {
                    currentSectionId = section.getAttribute('id');
                }
            });
        }

        // Update active class on nav links
        navLinks.forEach(link => {
            if (currentSectionId === 'contact' || !currentSectionId) {
                link.classList.remove('active');
            } else {
                link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
            }
        });

        isScrollTicking = false;
    };

    const onScroll = () => {
        if (!isScrollTicking) {
            isScrollTicking = true;
            requestAnimationFrame(updateActiveNav);
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateActiveNav();

    // 7. Skills Category Filtering
    const filterPills = document.querySelectorAll('.filter-pill');
    const skillItems = document.querySelectorAll('.skill-item');

    if (filterPills.length > 0 && skillItems.length > 0) {
        filterPills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.preventDefault();
                if (pill.classList.contains('active')) return;

                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');

                const category = pill.getAttribute('data-category');

                skillItems.forEach(item => {
                    const itemCat = item.getAttribute('data-category');
                    if (category === 'all' || itemCat === category) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });
    }

    // 8. Project Details Modal Logic
    const projectData = {
        xiwat: {
            title: "Xiwat Watch Store",
            subtitle: "React-based High-Performance E-commerce Frontend",
            description: "An advanced e-commerce frontend demonstrating optimization patterns, responsive grids, and custom state management mechanisms.",
            sections: [
                {
                    title: "Key Features & Capabilities",
                    content: "Built a fully functional checkout process, instant real-time product search, catalog sorting/filtering, and shopping cart logic. Fully optimized for fluid performance with minimum external dependencies."
                },
                {
                    title: "Engineering & Architecture Highlights",
                    content: "Engineered state management from scratch to handle real-time product querying and catalog operations without bloating the bundle. Designed a mobile-first responsive layout utilizing CSS Grid and Flexbox for seamless device support."
                },
                {
                    title: "Optimization & Outcomes",
                    content: "Reduced initial load times by prioritizing standard React components and custom hooks over third-party component libraries. Attained fluid 60fps scrolling and interface transitions."
                }
            ],
            features: [
                "Custom State Management",
                "Real-time Catalog Search",
                "Interactive Shopping Cart",
                "Mobile-First Grid Layout",
                "Dynamic Category Filters",
                "Optimized Bundle Footprint"
            ],
            tech: ["React", "JavaScript", "CSS Grid", "State Management", "Vercel"],
            liveLink: "https://xiwat.vercel.app/",
            githubLink: "https://github.com/Xiao-Harsh/Xiwat"
        },
        retrokey: {
            title: "Retrokey",
            subtitle: "Java-based Typing Challenger & OOP Showcase",
            description: "A robust desktop application designed to challenge and train typing speed, utilizing proper Object-Oriented principles and localized state persistence.",
            sections: [
                {
                    title: "Key Features & Capabilities",
                    content: "Implements real-time CPM (Characters Per Minute) and WPM (Words Per Minute) calculation engines. Features a dynamic typing UI, custom vocabulary datasets, and persistent user stat history."
                },
                {
                    title: "Engineering & Architecture Highlights",
                    content: "Engineered using clean Java OOP practices, emphasizing inheritance, polymorphism, and modular architectures. Organized components to avoid memory leaks by managing lifecycle states and facilitating garbage collection."
                },
                {
                    title: "Database Optimization",
                    content: "Integrated optimized SQL queries to load and persist user game logs, high scores, and typing history instantly. Normalized data models for local offline storage stability."
                }
            ],
            features: [
                "Real-time WPM/CPM Tracker",
                "SQL State Persistence",
                "OOP Software Architecture",
                "Garbage Collection Optimization",
                "Leaderboards & Stats",
                "Custom Difficulty Levels"
            ],
            tech: ["Java", "SQL", "OOP", "Data Structures", "Garbage Collection"],
            liveLink: null,
            githubLink: "https://github.com/Xiao-Harsh/RetroKey"
        },
        sonexa: {
            title: "Sonexa",
            subtitle: "Decentralized Music Player & High-Performance Audio Gateway",
            description: "A modern web-based music streaming platform built on the Audius Music Protocol, integrating custom node failover routing and low-latency Redis caching.",
            sections: [
                {
                    title: "Key Features & Capabilities",
                    content: "Delivers decentralized audio playback with secure JWT user authentication, dynamic playlist queueing, real-time track search, and automatic discovery node routing."
                },
                {
                    title: "Engineering & Architecture Highlights",
                    content: "Built a background routing service in Java that regularly pings Audius network bootstrap nodes, caches active discovery instances in Redis, and dynamically reroutes API requests to bypass offline or slow nodes."
                },
                {
                    title: "Optimization & Performance",
                    content: "Utilized Redis caching for search queries, trending charts, and track details to reduce external API requests and deliver near-instantaneous audio playback start times."
                }
            ],
            features: [
                "Audius Protocol Audio Streaming",
                "Automated Node Failover Routing",
                "Redis Query & Chart Caching",
                "Expandable Animated Music Player",
                "Spring Security & JWT Authentication",
                "Zustand State Synchronization"
            ],
            tech: ["React 19", "TypeScript", "Spring Boot", "Redis", "MySQL", "Tailwind CSS"],
            liveLink: "https://sonexamusic.vercel.app/",
            githubLink: "https://github.com/Xiao-Harsh/Sonexa"
        }
    };

    const projectModal = document.getElementById('project-modal');
    const openProjectBtns = document.querySelectorAll('.project-details-btn');
    const closeProjectModalBtn = document.querySelector('.close-project-modal');
    const projectModalTitle = document.getElementById('project-modal-title');
    const projectModalBody = document.querySelector('.project-modal-body');
    let projectTriggerElement = null;

    const openProjectModal = (projectId) => {
        projectTriggerElement = document.activeElement;
        const data = projectData[projectId];
        if (!data) return;

        projectModalTitle.textContent = data.title;
        projectModalBody.classList.remove('is-scrolling');

        // Build features list HTML
        let featuresHtml = '';
        if (data.features && data.features.length > 0) {
            featuresHtml = `
                <div class="project-modal-section">
                    <h3 class="project-modal-section-title">Key Features</h3>
                    <ul class="project-features-list">
                        ${data.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Build tech stack tags HTML
        let techHtml = '';
        if (data.tech && data.tech.length > 0) {
            techHtml = `
                <div class="project-modal-section">
                    <h3 class="project-modal-section-title">Technologies Used</h3>
                    <div class="project-tech-tags">
                        ${data.tech.map(t => `<span class="tech-pill">${t}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Build sections HTML
        let sectionsHtml = '';
        data.sections.forEach(sec => {
            sectionsHtml += `
                <div class="project-modal-section">
                    <h3 class="project-modal-section-title">${sec.title}</h3>
                    <p class="project-modal-text">${sec.content}</p>
                </div>
            `;
        });

        // Build links HTML
        let linksHtml = '';
        if (data.liveLink || data.githubLink) {
            linksHtml = `<div class="project-modal-links">`;
            if (data.liveLink) {
                linksHtml += `
                    <a href="${data.liveLink}" target="_blank" rel="noopener noreferrer" class="contact-btn">
                        View Live
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 0.4rem;" aria-hidden="true">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                    </a>
                `;
            }
            if (data.githubLink) {
                linksHtml += `
                    <a href="${data.githubLink}" target="_blank" rel="noopener noreferrer" class="contact-btn" style="background-color: var(--card-bg); color: var(--text-color); border: 1px solid var(--border-color);">
                        Source Code
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 0.4rem;" aria-hidden="true">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                    </a>
                `;
            }
            linksHtml += `</div>`;
        }

        projectModalBody.innerHTML = `
            <div class="project-modal-scroll-inner">
                <div class="project-modal-subtitle">${data.subtitle}</div>
                <p class="project-modal-text">${data.description}</p>
                ${featuresHtml}
                ${sectionsHtml}
                ${techHtml}
                ${linksHtml}
            </div>
        `;

        const triggerBtn = document.querySelector(`.project-details-btn[data-project="${projectId}"]`);
        if (triggerBtn) {
            triggerBtn.setAttribute('aria-expanded', 'true');
        }

        projectModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            if (closeProjectModalBtn) closeProjectModalBtn.focus();
        }, 100);
    };

    const closeProjectModal = () => {
        if (projectModal) {
            projectModal.classList.remove('active');
            document.body.style.overflow = '';
            openProjectBtns.forEach(btn => btn.setAttribute('aria-expanded', 'false'));
            if (projectTriggerElement) {
                projectTriggerElement.focus();
            }
            setTimeout(() => {
                projectModalBody.innerHTML = '';
                projectModalBody.classList.remove('is-scrolling');
            }, 300);
        }
    };

    openProjectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const projectId = btn.getAttribute('data-project');
            openProjectModal(projectId);
        });
    });

    if (closeProjectModalBtn) {
        closeProjectModalBtn.addEventListener('click', closeProjectModal);
    }

    if (projectModal) {
        projectModal.addEventListener('click', (e) => {
            if (e.target === projectModal) {
                closeProjectModal();
            }
        });
        projectModal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const focusables = projectModal.querySelectorAll('button, a, [tabindex="0"]');
                if (focusables.length > 0) {
                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                        last.focus();
                        e.preventDefault();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        first.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProjectModal();
        }
    });

    // 9. Scrollbar Visibility fading on inactivity
    if (projectModalBody) {
        let scrollTimeout;
        projectModalBody.addEventListener('scroll', () => {
            projectModalBody.classList.add('is-scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                projectModalBody.classList.remove('is-scrolling');
            }, 800);
        }, { passive: true });
    }

});
