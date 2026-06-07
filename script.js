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
            if (e.target.closest('a, button, input, textarea, .availability-badge, .skill-item')) {
                document.body.classList.add('cursor-hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a, button, input, textarea, .availability-badge, .skill-item')) {
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

    // 3. Smooth scrolling for internal links (excluding open-contact-btn which toggles the modal overlay)
    document.querySelectorAll('a[href^="#"]:not(.open-contact-btn)').forEach(anchor => {
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

    // 6. Navigation Active State on Scroll (ScrollSpy using IntersectionObserver)
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a');

    const navObserverOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentSectionId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (currentSectionId && currentSectionId !== 'contact') {
                        if (link.getAttribute('href') === `#${currentSectionId}`) {
                            link.classList.add('active');
                        }
                    }
                });
            }
        });
    }, navObserverOptions);

    sections.forEach(section => {
        navObserver.observe(section);
    });

    // Fallback for bottom of the page scrolling
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
            const lastSection = sections[sections.length - 1];
            if (lastSection) {
                const lastId = lastSection.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${lastId}`);
                });
            }
        }
    }, { passive: true });

    // 7. Skills Category Filtering
    const filterPills = document.querySelectorAll('.filter-pill');
    const skillItems = document.querySelectorAll('.skill-item');
    const skillsGrid = document.querySelector('.skills-grid');

    if (filterPills.length > 0 && skillItems.length > 0 && skillsGrid) {
        // Lock the grid's min-height to match the height of showing all items, preventing layout shifts
        const lockGridHeight = () => {
            // Save current visibility state of each item
            const itemsState = Array.from(skillItems).map(item => ({
                item: item,
                isHidden: item.classList.contains('hidden')
            }));

            // Temporarily show all items and clear inline min-height to measure natural max height
            skillItems.forEach(item => item.classList.remove('hidden'));
            skillsGrid.style.minHeight = 'auto';

            // Measure height
            const maxHeight = skillsGrid.offsetHeight;

            // Restore visibility state
            itemsState.forEach(state => {
                if (state.isHidden) {
                    state.item.classList.add('hidden');
                } else {
                    state.item.classList.remove('hidden');
                }
            });

            // Lock the min-height
            skillsGrid.style.minHeight = `${maxHeight}px`;
        };

        const debounce = (func, delay) => {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => func.apply(this, args), delay);
            };
        };

        // Initialize lock
        lockGridHeight();

        // Run again on window load and resize to ensure responsive layouts and loaded fonts/assets are correct
        window.addEventListener('load', lockGridHeight);
        window.addEventListener('resize', debounce(lockGridHeight, 150));

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
            <div class="project-modal-subtitle">${data.subtitle}</div>
            <p class="project-modal-text">${data.description}</p>
            ${featuresHtml}
            ${sectionsHtml}
            ${techHtml}
            ${linksHtml}
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

});
