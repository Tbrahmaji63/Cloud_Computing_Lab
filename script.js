document.addEventListener('DOMContentLoaded', () => {
    // Basic micro-animations for elements inside the glass panel
    const cards = document.querySelectorAll('.feature-card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.transitionDelay = `${index * 0.1 + 0.5}s`;
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    });

    // Particle effect background creation
    const particlesContainer = document.getElementById('particles');
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
        createParticle();
    }

    function createParticle() {
        const particle = document.createElement('div');
        
        // Random size between 2px and 6px
        const size = Math.random() * 4 + 2;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = 'rgba(255, 255, 255, 0.3)';
        particle.style.position = 'absolute';
        particle.style.borderRadius = '50%';
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        
        // Animation
        const duration = Math.random() * 20 + 10;
        particle.style.transition = `all ${duration}s linear`;
        
        particlesContainer.appendChild(particle);

        setTimeout(() => {
            moveParticle(particle, duration);
        }, 100);
    }

    function moveParticle(particle, duration) {
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        
        setInterval(() => {
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.left = `${Math.random() * 100}%`;
        }, duration * 1000);
    }

    // Interactive button click
    const exploreBtn = document.getElementById('explore-btn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', function() {
            this.innerHTML = '<span>Loading...</span>';
            setTimeout(() => {
                this.innerHTML = `
                    <span>Welcome!</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                this.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                this.style.boxShadow = '0 10px 20px rgba(16, 185, 129, 0.3)';
            }, 1200);
        });
    }
    
    // Auth Form Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorBox = document.getElementById('login-error');
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Loading State
            submitBtn.innerHTML = '<span>Verifying...</span>';
            submitBtn.style.opacity = '0.7';
            errorBox.style.display = 'none';
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    submitBtn.innerHTML = '<span>Success!</span>';
                    submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    setTimeout(() => {
                        window.location.href = '/page';
                    }, 500);
                } else {
                    errorBox.textContent = data.message;
                    errorBox.style.display = 'block';
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.style.opacity = '1';
                }
            } catch (err) {
                errorBox.textContent = 'Network or server error. Ensure server is running.';
                errorBox.style.display = 'block';
                submitBtn.innerHTML = originalBtnText;
                submitBtn.style.opacity = '1';
            }
        });
    }
});
