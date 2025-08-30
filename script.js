// Portfolio Tab System
class Portfolio {
    constructor() {
        this.container = document.getElementById('screensContainer');
        this.openTabs = ['home'];
        this.activeTabIndex = 0;

        // Gravity system
        this.gravityMode = false;
        this.gravityAnimationId = null;
        this.tabPhysics = new Map(); // Store physics data for each tab
        this.isDragging = false;
        this.dragData = null;
        this.gravity = 0.5; // Gravity strength
        this.bounce = 0.7; // Bounce factor
        this.friction = 0.98; // Air resistance

        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeTabIndex > 0) {
                this.closeTab(this.activeTabIndex);
            }
        });

        // Handle scroll to update active tab
        this.container.addEventListener('scroll', () => {
            this.updateActiveTab();
            this.updateScrollIndicators();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateScrollPosition();
            this.updateScrollIndicators();
        });

        // Initial scroll indicators update
        setTimeout(() => {
            this.updateScrollIndicators();
        }, 100);
    }

    getTabWidth() {
        const isMobile = window.innerWidth <= 768;
        return isMobile ? window.innerWidth : 393;
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    updateActiveTab() {
        const scrollLeft = this.container.scrollLeft;
        const tabWidth = this.getTabWidth();
        const containerWidth = this.container.clientWidth;

        // Calculate which tab is most centered
        const centerPosition = scrollLeft + (containerWidth / 2);
        const newActiveIndex = Math.round((centerPosition - (tabWidth / 2)) / tabWidth);

        if (newActiveIndex !== this.activeTabIndex &&
            newActiveIndex >= 0 &&
            newActiveIndex < this.openTabs.length) {
            this.activeTabIndex = newActiveIndex;
        }
    }

    scrollToTab(index) {
        const tabWidth = this.getTabWidth();
        const isMobile = this.isMobile();

        if (isMobile) {
            // Mobile: snap to exact tab position
            const scrollPosition = index * tabWidth;
            this.container.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        } else {
            // Desktop: center with edge checking
            const containerWidth = this.container.clientWidth;
            const marginFromEdge = 60;

            let scrollPosition = (index * tabWidth) - (containerWidth / 2) + (tabWidth / 2);

            // Check if tab would be too close to right edge
            const tabRightPosition = (index + 1) * tabWidth;
            const currentScrollLeft = scrollPosition;
            const tabRightOnScreen = tabRightPosition - currentScrollLeft;

            if (tabRightOnScreen > (containerWidth - marginFromEdge)) {
                scrollPosition = tabRightPosition - containerWidth + marginFromEdge;
            }

            scrollPosition = Math.max(0, scrollPosition);

            // Rough scroll animation for desktop
            const startPos = this.container.scrollLeft;
            const distance = scrollPosition - startPos;
            const steps = 3;
            const stepSize = distance / steps;

            for (let i = 1; i <= steps; i++) {
                setTimeout(() => {
                    this.container.scrollTo({
                        left: startPos + (stepSize * i),
                        behavior: 'auto'
                    });
                }, i * 50);
            }
        }
    }

    updateScrollPosition() {
        // Recalculate scroll position after resize
        setTimeout(() => {
            this.scrollToTab(this.activeTabIndex);
        }, 100);
    }

    scrollToTabWithEdgeCheck(index) {
        const isMobile = this.isMobile();

        if (isMobile) {
            // Mobile: just snap to tab, no edge checking needed
            this.scrollToTab(index);
            return;
        }

        // Desktop: edge checking behavior
        const tabWidth = this.getTabWidth();
        const containerWidth = this.container.clientWidth;
        const marginFromEdge = 60;
        const tabMargin = 20;

        const tabTotalWidth = tabWidth + (tabMargin * 2);
        const tabStartPosition = index * (tabWidth + tabMargin * 2);
        const tabEndPosition = tabStartPosition + tabTotalWidth;

        const currentScrollLeft = this.container.scrollLeft;
        const viewportEndPosition = currentScrollLeft + containerWidth;

        if (tabEndPosition > (viewportEndPosition - marginFromEdge)) {
            const newScrollPosition = tabEndPosition - containerWidth + marginFromEdge;

            const startPos = this.container.scrollLeft;
            const distance = newScrollPosition - startPos;
            const steps = 3;
            const stepSize = distance / steps;

            for (let i = 1; i <= steps; i++) {
                setTimeout(() => {
                    this.container.scrollTo({
                        left: startPos + (stepSize * i),
                        behavior: 'auto'
                    });
                }, i * 50);
            }
        } else {
            this.scrollToTab(index);
        }
    }

    updateScrollIndicators() {
        const appContainer = document.querySelector('.app-container');
        const scrollLeft = this.container.scrollLeft;
        const maxScrollLeft = this.container.scrollWidth - this.container.clientWidth;

        // Show scroll hint if there's more content to the right
        if (maxScrollLeft > 0 && scrollLeft < maxScrollLeft) {
            appContainer.classList.add('has-overflow');
        } else {
            appContainer.classList.remove('has-overflow');
        }
    }

    openTab(type, data = {}) {
        // Check tab count before creating new tab - only on desktop
        if (this.openTabs.length >= 4 && !this.gravityMode && !this.isMobile()) {
            this.activateGravityMode();
        }

        // Check if tab already exists
        const existingIndex = this.openTabs.indexOf(type);
        if (existingIndex !== -1) {
            this.activeTabIndex = existingIndex;
            if (!this.gravityMode) {
                this.scrollToTab(existingIndex);
            }
            return;
        }

        // Create new screen element
        const screen = this.createScreen(type, data);
        if (!screen) return;

        // Add screen to container
        this.container.appendChild(screen);
        this.openTabs.push(type);

        if (this.gravityMode) {
            // Initialize physics for gravity mode
            this.initTabPhysics(screen, this.openTabs.length - 1);
        } else {
            // Rough animate entrance
            screen.classList.add('entering');
            setTimeout(() => {
                screen.classList.remove('entering');
            }, 150);
        }

        // Set as active and scroll to it
        this.activeTabIndex = this.openTabs.length - 1;

        if (!this.gravityMode) {
            setTimeout(() => {
                this.scrollToTabWithEdgeCheck(this.activeTabIndex);
                this.updateScrollIndicators();
            }, 100);
        }
    }

    closeTab(index) {
        if (index === 0 || index >= this.openTabs.length) return; // Can't close home

        const screen = this.container.children[index];
        const tabType = this.openTabs[index];

        // Animate exit
        screen.classList.add('exiting');

        setTimeout(() => {
            // Remove from DOM and array
            screen.remove();
            this.openTabs.splice(index, 1);

            // Update active tab
            if (this.activeTabIndex >= index) {
                this.activeTabIndex = Math.max(0, this.activeTabIndex - 1);
            }

            this.scrollToTab(this.activeTabIndex);
        }, 150);
    }

    createScreen(type, data) {
        const screen = document.createElement('div');
        screen.className = 'screen';
        screen.setAttribute('data-screen-id', type);

        let content = '';

        switch (type) {
            case 'projects-graphic':
                content = this.createProjectsContent('graphic');
                break;
            case 'projects-product':
                content = this.createProjectsContent('product');
                break;
            case 'projects-all':
                content = this.createProjectsContent('all');
                break;
            case 'about':
                content = this.createAboutContent();
                break;
            case 'contact':
                content = this.createContactContent();
                break;
            case 'project-mai':
                content = this.createProjectContent('mai');
                break;
            case 'project-water':
                content = this.createProjectContent('water');
                break;
            case 'project-1121':
                content = this.createProjectContent('1121');
                break;
            case 'project-untangled':
                content = this.createProjectContent('untangled');
                break;
            case 'project-barber':
                content = this.createProjectContent('barber');
                break;
            default:
                return null;
        }

        screen.innerHTML = content;

        // Add close button event listener
        const closeBtn = screen.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const index = Array.from(this.container.children).indexOf(screen);
                this.closeTab(index);
            });
        }

        // Add project link event listeners
        const projectLinks = screen.querySelectorAll('.project-item');
        projectLinks.forEach(link => {
            link.addEventListener('click', () => {
                const projectId = link.getAttribute('data-project');
                this.openTab(`project-${projectId}`);
            });
        });

        // Add image click listeners for fullscreen
        const projectImages = screen.querySelectorAll('.project-image');
        projectImages.forEach(image => {
            image.addEventListener('click', () => {
                const imageUrl = image.style.backgroundImage.slice(5, -2); // Extract URL from CSS
                openFullscreen(imageUrl);
            });
        });

        return screen;
    }

    createProjectsContent(filter = 'all') {
        // Define projects with their categories
        const allProjects = [
            { id: 'mai', title: 'Mãi', category: 'graphic' },
            { id: 'water', title: 'As Water Erodes', category: 'graphic' },
            { id: 'barber', title: 'Barber zine', category: 'graphic' },
            { id: '1121', title: '1121', category: 'product' },
            { id: 'untangled', title: 'Untangled', category: 'product' }
        ];

        // Filter projects based on category
        const filteredProjects = filter === 'all'
            ? allProjects
            : allProjects.filter(project => project.category === filter);

        const projectsHtml = filteredProjects.map(project =>
            `<div class="project-item" data-project="${project.id}">${project.title}</div>`
        ).join('');

        const title = filter === 'graphic' ? 'Graphic Design Projects' :
            filter === 'product' ? 'Product Design Projects' :
                'All Projects';

        return `
            <button class="close-btn">close</button>
            <div class="screen-content">
                <div class="project-index">
                    
                    <div class="project-list">
                        ${projectsHtml}
                    </div>
                    ${filter !== 'all' ? `<div class="all-work" onclick="portfolio.openTab('projects-all')">view all work</div>` : ''}
                </div>
            </div>
        `;
    }

    createAboutContent() {
        return `
            <button class="close-btn">close</button>
            <div class="screen-content">
                <div class="about-content">
                    <div class="section-title">About</div>
                    <div class="section-text">
                        I'm a graphic and product designer based in Ho Chi Minh City, Vietnam. 
                        Currently working as a graphic designer at rice, I focus on creating 
                        meaningful design solutions that bridge the gap between aesthetics and functionality.
                    </div>
                    <div class="section-text">
                        My work spans across various mediums including branding, editorial design, 
                        web design, and digital experiences. I believe in the power of design 
                        to tell stories and create connections.
                    </div>
                    <div class="section-text">
                        When I'm not designing, you can find me exploring the city, reading, 
                        or experimenting with new creative techniques.
                    </div>
                </div>
            </div>
        `;
    }

    createContactContent() {
        return `
            <button class="close-btn">close</button>
            <div class="screen-content">
                <div class="contact-content">
                    <div class="section-title">Contact</div>
                    <div class="section-text">
                        Let's work together! I'm available for freelance projects, 
                        collaborations, or just to chat about design.
                    </div>
                    <div class="section-text">
                        Email: <a href="mailto:hello@hauhuynh.com" class="contact-link">hello@hauhuynh.com</a>
                    </div>
                    <div class="section-text">
                        LinkedIn: <a href="https://linkedin.com/in/hauhuynh" class="contact-link">linkedin.com/in/hauhuynh</a>
                    </div>
                    <div class="section-text">
                        Instagram: <a href="https://instagram.com/hauhuynh.design" class="contact-link">@hauhuynh.design</a>
                    </div>
                    <div class="section-text">
                        Based in Ho Chi Minh City, Vietnam<br>
                        Available for remote work worldwide
                    </div>
                </div>
            </div>
        `;
    }

    async loadProjectImages(projectId) {
        // Map project IDs to folder names
        const projectFolders = {
            'mai': 'Mãi',
            'water': 'As Water Erodes',
            'barber': 'Barber zine',
            '1121': '1121',
            'untangled': 'Untangled'
        };

        const folderName = projectFolders[projectId];
        if (!folderName) return [];

        // Common image extensions
        const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        const imagePaths = [];

        // Try to load images from the folder
        for (let i = 1; i <= 10; i++) { // Check up to 10 images
            for (const ext of imageExtensions) {
                const imagePath = `Image/${folderName}/${i}.${ext}`;
                try {
                    // Check if image exists by trying to load it
                    const response = await fetch(imagePath, { method: 'HEAD' });
                    if (response.ok) {
                        imagePaths.push({
                            url: imagePath,
                            height: 'auto' // Will be calculated based on aspect ratio
                        });
                        break; // Found image with this number, move to next
                    }
                } catch (error) {
                    // Image doesn't exist, continue checking
                    continue;
                }
            }
        }

        // If no images found, return fallback
        if (imagePaths.length === 0) {
            return [{
                url: `https://via.placeholder.com/369x300/f5f5f5/999?text=${encodeURIComponent(folderName)}`,
                height: '300px'
            }];
        }

        return imagePaths;
    }

    createProjectContent(projectId) {
        const projects = {
            'mai': {
                title: 'Mãi',
                description: `This project, by using the concept of mãi—the Vietnamese word for forever—explores the enduring nature of plastic as a material. Through bold, playful branding, we highlight the beauty and functionality that can be achieved through better design and responsible reuse.

We embrace the idea of repetition, loops, and recycling, shaping a visual language that reflects the continuous lifecycle of plastic. The website brings this concept to life with an infinity scroll, where two directions merge seamlessly, mirroring the endless cycle of reuse and reinvention. By creating an interactive experience that never truly ends, we reinforce the idea of mãi—endless.`
            },
            'water': {
                title: 'As water Erodes',
                description: `A poetic meditation on erosion—of memory, language, and landscapes—As Water Erodes is a photo book that explores the fleeting nature of time through typography, imagery, and narrative sequencing. Each page moves like waves against the shore, carrying fragments of thought, notes from the road, and the ever-shifting interplay between permanence and impermanence.

Inspired by the experience of travel—watching sceneries dissolve through windows, tracing the contours of the horizon, and confronting the vast unknown—this book captures a journey both personal and collective. It is a visual and textual reflection on standing at the edge of history, where the land meets the sea, and where stories, like stones, are slowly shaped by the tides.`
            },
            'barber': {
                title: 'Barber zine',
                description: 'An editorial design project celebrating traditional barbering culture. This zine combines contemporary design with classic barbering aesthetics to create a modern tribute to the craft.'
            },
            '1121': {
                title: '1121',
                description: 'A digital product design project focusing on user experience and interface design. This project examines how we can create intuitive and meaningful interactions in the digital space.'
            },
            'untangled': {
                title: 'Untangled',
                description: 'A UX/UI design project that explores the concept of simplifying complex user flows. Through careful user research and iterative design, this project demonstrates how to untangle complicated interfaces.'
            }
        };

        const project = projects[projectId];
        if (!project) return '';

        // Create initial HTML without images
        const baseHTML = `
            <button class="close-btn">close</button>
            <div class="screen-content">
                <div class="project-page">
                    <div class="project-title">${project.title}</div>
                    <div class="project-description">${project.description}</div>
                    <div class="images-container" id="images-${projectId}">
                        <div class="loading-images">Loading images...</div>
                    </div>
                </div>
            </div>
        `;

        // Load images asynchronously
        setTimeout(async () => {
            const images = await this.loadProjectImages(projectId);
            const imagesContainer = document.getElementById(`images-${projectId}`);

            if (imagesContainer) {
                const imagesHtml = images.map(img =>
                    `<div class="project-image" style="height: ${img.height === 'auto' ? '300px' : img.height}; background-image: url('${img.url}');"></div>`
                ).join('');

                imagesContainer.innerHTML = imagesHtml;

                // Add click listeners to new images
                const newImages = imagesContainer.querySelectorAll('.project-image');
                newImages.forEach(image => {
                    image.addEventListener('click', () => {
                        const imageUrl = image.style.backgroundImage.slice(5, -2);
                        openFullscreen(imageUrl);
                    });
                });
            }
        }, 100);

        return baseHTML;
    }
}

// Global functions for onclick handlers
function openTab(type, data = {}) {
    if (window.portfolio) {
        window.portfolio.openTab(type, data);
    }
}

// Email CTA function
function sendEmail() {
    const email = 'hello@hauhuynh.com';
    const subject = 'Portfolio Inquiry';
    const body = 'Hello Hau,\n\nI am interested in discussing a potential project/collaboration.\n\nBest regards,';

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
}

// Fullscreen image functions
function openFullscreen(imageUrl) {
    const overlay = document.getElementById('fullscreenOverlay');
    const image = document.getElementById('fullscreenImage');

    image.src = imageUrl;
    overlay.classList.add('active');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeFullscreen() {
    const overlay = document.getElementById('fullscreenOverlay');

    overlay.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = 'auto';
}

// Close fullscreen on ESC key or click outside image
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeFullscreen();
    }
});

document.getElementById('fullscreenOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'fullscreenOverlay') {
        closeFullscreen();
    }
});

// ===== GRAVITY SYSTEM METHODS =====

// Warning system removed

Portfolio.prototype.activateGravityMode = function () {
    if (this.gravityMode) return;

    this.gravityMode = true;
    document.body.classList.add('gravity-mode');

    // Initialize physics for all existing tabs
    const screens = this.container.querySelectorAll('.screen');
    screens.forEach((screen, index) => {
        this.initTabPhysics(screen, index);
    });

    // Start gravity animation loop
    this.startGravityAnimation();
};

Portfolio.prototype.initTabPhysics = function (screen, index) {
    const rect = screen.getBoundingClientRect();

    // Random starting position
    const x = Math.random() * (window.innerWidth - 393);
    const y = Math.random() * 200; // Start near top

    screen.style.left = x + 'px';
    screen.style.top = y + 'px';

    // Create physics object
    this.tabPhysics.set(screen, {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 5, // Random horizontal velocity
        vy: 0, // Start with no vertical velocity
        width: 393,
        height: 825,
        isDragging: false,
        dragOffsetX: 0,
        dragOffsetY: 0
    });

    // Add drag event listeners
    this.addTabDragListeners(screen);
};

Portfolio.prototype.addTabDragListeners = function (screen) {
    let startX, startY, initialX, initialY;

    const onMouseDown = (e) => {
        if (this.gravityMode) {
            this.isDragging = true;
            screen.classList.add('dragging');

            const physics = this.tabPhysics.get(screen);
            startX = e.clientX;
            startY = e.clientY;
            initialX = physics.x;
            initialY = physics.y;

            physics.isDragging = true;
            physics.vx = 0;
            physics.vy = 0;

            e.preventDefault();
        }
    };

    const onMouseMove = (e) => {
        if (this.isDragging && this.gravityMode) {
            const physics = this.tabPhysics.get(screen);
            if (physics.isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                physics.x = initialX + deltaX;
                physics.y = initialY + deltaY;

                screen.style.left = physics.x + 'px';
                screen.style.top = physics.y + 'px';
            }
            e.preventDefault();
        }
    };

    const onMouseUp = (e) => {
        if (this.isDragging && this.gravityMode) {
            this.isDragging = false;
            screen.classList.remove('dragging');

            const physics = this.tabPhysics.get(screen);
            physics.isDragging = false;

            // Add some velocity based on drag speed
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            physics.vx = deltaX * 0.1;
            physics.vy = deltaY * 0.1;
        }
    };

    screen.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Touch events for mobile
    screen.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault() });
    });

    document.addEventListener('touchmove', (e) => {
        if (this.isDragging) {
            const touch = e.touches[0];
            onMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault() });
        }
    });

    document.addEventListener('touchend', (e) => {
        if (this.isDragging) {
            const touch = e.changedTouches[0];
            onMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
        }
    });
};

Portfolio.prototype.startGravityAnimation = function () {
    const animate = () => {
        if (!this.gravityMode) return;

        const screens = this.container.querySelectorAll('.screen');
        screens.forEach(screen => {
            const physics = this.tabPhysics.get(screen);
            if (!physics || physics.isDragging) return;

            // Apply gravity
            physics.vy += this.gravity;

            // Apply friction
            physics.vx *= this.friction;
            physics.vy *= this.friction;

            // Update position
            physics.x += physics.vx;
            physics.y += physics.vy;

            // Collision with ground
            const groundY = window.innerHeight - physics.height - 50;
            if (physics.y > groundY) {
                physics.y = groundY;
                physics.vy *= -this.bounce; // Bounce
                if (Math.abs(physics.vy) < 1) physics.vy = 0; // Stop small bounces
            }

            // Collision with walls
            if (physics.x < 0) {
                physics.x = 0;
                physics.vx *= -this.bounce;
            } else if (physics.x > window.innerWidth - physics.width) {
                physics.x = window.innerWidth - physics.width;
                physics.vx *= -this.bounce;
            }

            // Collision with ceiling
            if (physics.y < 0) {
                physics.y = 0;
                physics.vy *= -this.bounce;
            }

            // Simple collision between tabs
            screens.forEach(otherScreen => {
                if (otherScreen === screen) return;
                const otherPhysics = this.tabPhysics.get(otherScreen);
                if (!otherPhysics) return;

                const dx = physics.x - otherPhysics.x;
                const dy = physics.y - otherPhysics.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = 200; // Minimum distance between tabs

                if (distance < minDistance && distance > 0) {
                    const force = (minDistance - distance) * 0.01;
                    const angle = Math.atan2(dy, dx);
                    physics.vx += Math.cos(angle) * force;
                    physics.vy += Math.sin(angle) * force;
                }
            });

            // Update DOM
            screen.style.left = physics.x + 'px';
            screen.style.top = physics.y + 'px';
        });

        this.gravityAnimationId = requestAnimationFrame(animate);
    };

    this.gravityAnimationId = requestAnimationFrame(animate);
};

Portfolio.prototype.resetGravity = function () {
    // Stop gravity mode
    this.gravityMode = false;
    document.body.classList.remove('gravity-mode');

    if (this.gravityAnimationId) {
        cancelAnimationFrame(this.gravityAnimationId);
        this.gravityAnimationId = null;
    }

    // Clear physics data
    this.tabPhysics.clear();

    // Reset all tabs to normal positions
    const screens = this.container.querySelectorAll('.screen');
    screens.forEach((screen, index) => {
        screen.style.left = '';
        screen.style.top = '';
        screen.classList.remove('dragging');
    });

    // Restore normal scroll behavior
    this.scrollToTab(this.activeTabIndex);
    this.updateScrollIndicators();
};

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.portfolio = new Portfolio();
});

// Expose for debugging
window.Portfolio = Portfolio;
