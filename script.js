/* ==========================================================================
   Abhi Ka Music @ Deep Heart - JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------------------------------
       1. Navigation Menu (Sticky header, Hamburger Toggle, Active Link Indicator)
       -------------------------------------------------------------------------- */
    const header = document.querySelector('.header');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    // Sticky navbar on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        highlightActiveLink();
    });

    // Mobile menu toggle
    if (mobileToggle && navbar) {
        mobileToggle.addEventListener('click', () => {
            navbar.classList.toggle('mobile-active');
            mobileToggle.classList.toggle('active');
            // Toggle hamburger animation state
            const bars = mobileToggle.querySelectorAll('.bar');
            if (mobileToggle.classList.contains('active')) {
                bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
    }

    // Close mobile menu when nav link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('mobile-active')) {
                navbar.classList.remove('mobile-active');
                mobileToggle.classList.remove('active');
                const bars = mobileToggle.querySelectorAll('.bar');
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
    });

    // Highlight active link on scroll
    function highlightActiveLink() {
        let scrollPos = window.scrollY + 150; // offset for nav height
        sections.forEach(section => {
            if (scrollPos >= section.offsetTop && scrollPos < (section.offsetTop + section.offsetHeight)) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${section.id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    /* --------------------------------------------------------------------------
       2. Scroll Reveal Animations (Intersection Observer)
       -------------------------------------------------------------------------- */
    const revealElements = document.querySelectorAll('.reveal-left, .reveal-right, .reveal-item');
    
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // Animates once
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback for older browsers
        revealElements.forEach(el => el.classList.add('active'));
    }

    /* --------------------------------------------------------------------------
       3. Interactive Custom Music Player (with fallsback Web Audio Synthesizer)
       -------------------------------------------------------------------------- */
    // Track Playlist Data
    const tracksList = [
        {
            title: "Unconditional Love",
            artist: "Abhi Ka Music @ Deep Heart",
            duration: "3:42",
            file: "unconditional_love.mp3",
            note: "Beautiful romantic melody with acoustic piano and live strings."
        },
        {
            title: "Deep Heart Symphony",
            artist: "Abhi Ka Music",
            duration: "4:15",
            file: "deep_heart_symphony.mp3",
            note: "Electric fusion instrumental showcase with progressive lead guitar."
        },
        {
            title: "Live Concert Energy Medley",
            artist: "Abhi & Deep Heart Band",
            duration: "5:28",
            file: "concert_energy.mp3",
            note: "Upbeat high-octane live crowd medley of rock and dance hits."
        }
    ];

    let currentTrackIndex = 0;
    let isPlaying = false;
    let isLooping = false;
    let isShuffled = false;
    let playTimer = null;
    let playProgress = 0; // percentage
    let volumeLevel = 80;

    // Web Audio Synthesizer for live sound demo
    let audioCtx = null;
    let synthInterval = null;
    let synthNotes = [130.81, 164.81, 196.00, 220.00, 261.63, 329.63, 392.00, 440.00]; // C major pentatonic
    let synthNoteIndex = 0;

    // Visualizer Elements
    const canvas = document.getElementById('visualizer-canvas');
    const canvasCtx = canvas.getContext('2d');
    let visualizerFrameId = null;

    // Player Dom nodes
    const trackArtImg = document.getElementById('track-art-img');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const playerArt = document.getElementById('player-art');
    const progressSlider = document.getElementById('progress-slider');
    const currentTimeText = document.getElementById('current-time');
    const totalDurationText = document.getElementById('total-duration');
    const playBtn = document.getElementById('btn-play');
    const playIcon = document.getElementById('play-icon');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const loopBtn = document.getElementById('btn-loop');
    const shuffleBtn = document.getElementById('btn-shuffle');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const playlistContainer = document.getElementById('playlist-items');

    // Build Playlist DOM
    function initPlaylist() {
        playlistContainer.innerHTML = '';
        tracksList.forEach((track, index) => {
            const trackEl = document.createElement('div');
            trackEl.classList.add('playlist-track');
            if (index === currentTrackIndex) trackEl.classList.add('active-track');
            
            trackEl.innerHTML = `
                <span class="track-num">${String(index + 1).padStart(2, '0')}</span>
                <div class="track-info-side">
                    <h4>${track.title}</h4>
                    <p>${track.artist}</p>
                </div>
                <div class="track-play-indicator">
                    <i class="fa-solid ${index === currentTrackIndex && isPlaying ? 'fa-volume-high' : 'fa-play'}"></i>
                </div>
            `;
            
            trackEl.addEventListener('click', () => {
                selectTrack(index);
            });
            playlistContainer.appendChild(trackEl);
        });
    }

    // Load selected track metadata
    function loadTrack(index) {
        currentTrackIndex = index;
        const track = tracksList[currentTrackIndex];
        trackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;
        
        // Alternate album art based on track index
        if (index === 0) trackArtImg.src = "assets/images/artist_profile.png";
        if (index === 1) trackArtImg.src = "assets/images/band_live.png";
        if (index === 2) trackArtImg.src = "assets/images/hero_concert.png";
        
        currentTimeText.textContent = "0:00";
        totalDurationText.textContent = track.duration;
        progressSlider.value = 0;
        playProgress = 0;

        // Update active class in playlist list
        const trackElements = playlistContainer.querySelectorAll('.playlist-track');
        trackElements.forEach((el, idx) => {
            el.classList.remove('active-track');
            const indicatorIcon = el.querySelector('.track-play-indicator i');
            indicatorIcon.className = 'fa-solid fa-play';
            if (idx === index) {
                el.classList.add('active-track');
                if (isPlaying) indicatorIcon.className = 'fa-solid fa-volume-high';
            }
        });
    }

    // Web Audio Synthesizer: Play synthesized tones when user clicks play
    function startSynthesis() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Trigger notes sequence to represent a guitar/keyboard arpeggio
        synthInterval = setInterval(() => {
            if (!isPlaying) return;
            
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            // Choose type based on track
            if (currentTrackIndex === 0) osc.type = 'sine'; // piano style
            if (currentTrackIndex === 1) osc.type = 'triangle'; // acoustic string style
            if (currentTrackIndex === 2) osc.type = 'sawtooth'; // synth synth style
            
            // Note frequency
            const freqIndex = Math.floor(Math.random() * synthNotes.length);
            osc.frequency.setValueAtTime(synthNotes[freqIndex], audioCtx.currentTime);
            
            // Volume envelopes (fades out nicely)
            gainNode.gain.setValueAtTime((volumeLevel / 100) * 0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 1.2);
        }, 350);
    }

    function stopSynthesis() {
        if (synthInterval) {
            clearInterval(synthInterval);
            synthInterval = null;
        }
    }

    // Toggle Play/Pause
    function togglePlay() {
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    }

    function playTrack() {
        isPlaying = true;
        playIcon.className = 'fa-solid fa-pause';
        playerArt.classList.add('playing');
        
        // Update playlist icons
        const activeIndicator = playlistContainer.querySelector('.active-track .track-play-indicator i');
        if (activeIndicator) activeIndicator.className = 'fa-solid fa-volume-high';

        startSynthesis();
        startVisualizer();

        // Simulate track progress
        const track = tracksList[currentTrackIndex];
        const durationParts = track.duration.split(':');
        const totalSecs = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
        
        let elapsedSecs = Math.floor((playProgress / 100) * totalSecs);

        playTimer = setInterval(() => {
            elapsedSecs++;
            playProgress = (elapsedSecs / totalSecs) * 100;
            progressSlider.value = playProgress;

            // Update timer texts
            const m = Math.floor(elapsedSecs / 60);
            const s = Math.floor(elapsedSecs % 60);
            currentTimeText.textContent = `${m}:${String(s).padStart(2, '0')}`;

            if (elapsedSecs >= totalSecs) {
                clearInterval(playTimer);
                if (isLooping) {
                    playProgress = 0;
                    playTrack();
                } else {
                    nextTrack();
                }
            }
        }, 1000);
    }

    function pauseTrack() {
        isPlaying = false;
        playIcon.className = 'fa-solid fa-play';
        playerArt.classList.remove('playing');
        
        // Update playlist icons
        const activeIndicator = playlistContainer.querySelector('.active-track .track-play-indicator i');
        if (activeIndicator) activeIndicator.className = 'fa-solid fa-play';

        clearInterval(playTimer);
        stopSynthesis();
        cancelAnimationFrame(visualizerFrameId);
        // Clear canvas
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function selectTrack(index) {
        pauseTrack();
        loadTrack(index);
        playTrack();
    }

    function nextTrack() {
        let nextIndex = currentTrackIndex + 1;
        if (isShuffled) {
            nextIndex = Math.floor(Math.random() * tracksList.length);
        } else if (nextIndex >= tracksList.length) {
            nextIndex = 0;
        }
        selectTrack(nextIndex);
    }

    function prevTrack() {
        let prevIndex = currentTrackIndex - 1;
        if (isShuffled) {
            prevIndex = Math.floor(Math.random() * tracksList.length);
        } else if (prevIndex < 0) {
            prevIndex = tracksList.length - 1;
        }
        selectTrack(prevIndex);
    }

    // Slider actions
    progressSlider.addEventListener('input', () => {
        playProgress = progressSlider.value;
        const track = tracksList[currentTrackIndex];
        const durationParts = track.duration.split(':');
        const totalSecs = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
        const elapsedSecs = Math.floor((playProgress / 100) * totalSecs);
        const m = Math.floor(elapsedSecs / 60);
        const s = Math.floor(elapsedSecs % 60);
        currentTimeText.textContent = `${m}:${String(s).padStart(2, '0')}`;
        
        // If playing, reset timer to track from new progress
        if (isPlaying) {
            clearInterval(playTimer);
            playTrack();
        }
    });

    volumeSlider.addEventListener('input', () => {
        volumeLevel = volumeSlider.value;
        // Update volume icons
        if (volumeLevel == 0) {
            volumeIcon.className = 'fa-solid fa-volume-xmark';
        } else if (volumeLevel < 50) {
            volumeIcon.className = 'fa-solid fa-volume-low';
        } else {
            volumeIcon.className = 'fa-solid fa-volume-high';
        }
    });

    // Loop & Shuffle buttons
    loopBtn.addEventListener('click', () => {
        isLooping = !isLooping;
        loopBtn.classList.toggle('active', isLooping);
    });

    shuffleBtn.addEventListener('click', () => {
        isShuffled = !isShuffled;
        shuffleBtn.classList.toggle('active', isShuffled);
    });

    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    playBtn.addEventListener('click', togglePlay);

    // Canvas visualizer rendering loop
    function startVisualizer() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        
        const barWidth = 4;
        const gap = 3;
        const totalBars = Math.floor(canvas.width / (barWidth + gap));
        const barsHeights = new Array(totalBars).fill(2);
        
        function draw() {
            if (!isPlaying) return;
            
            visualizerFrameId = requestAnimationFrame(draw);
            
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Create nice glowing pink/purple gradient
            const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, '#7A22FF'); // purple
            gradient.addColorStop(0.5, '#FF2E93'); // magenta
            gradient.addColorStop(1, '#00E5FF'); // cyan
            
            canvasCtx.fillStyle = gradient;

            for (let i = 0; i < totalBars; i++) {
                // Simulate frequency wave oscillation
                const targetHeight = Math.random() * (canvas.height - 10) * (Math.sin(i * 0.15 + Date.now() * 0.005) * 0.5 + 0.5);
                
                // Smooth bar transition
                barsHeights[i] += (targetHeight - barsHeights[i]) * 0.2;
                
                const x = i * (barWidth + gap);
                const y = canvas.height - barsHeights[i];
                
                // Draw rounded bars
                canvasCtx.beginPath();
                canvasCtx.roundRect(x, y, barWidth, barsHeights[i], [2, 2, 0, 0]);
                canvasCtx.fill();
            }
        }
        
        draw();
    }

    // Initialize track list & load first track
    initPlaylist();
    loadTrack(0);

    // Resize visualizer canvas on window resize
    window.addEventListener('resize', () => {
        if (canvas) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
    });

    /* --------------------------------------------------------------------------
       4. Video Modal / Lightbox (YouTube Embed Control)
       -------------------------------------------------------------------------- */
    const videoModal = document.getElementById('video-modal');
    const videoModalOverlay = document.getElementById('video-modal-overlay');
    const videoModalClose = document.getElementById('video-modal-close');
    const videoIframe = document.getElementById('video-iframe');
    const videoTriggers = document.querySelectorAll('.video-card, .btn-play-featured');

    videoTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const videoSrc = trigger.getAttribute('data-video-src');
            if (videoSrc && videoModal && videoIframe) {
                // Append autoplay settings
                videoIframe.src = `${videoSrc}?autoplay=1`;
                videoModal.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Lock scrolling
            }
        });
    });

    function closeVideoModal() {
        if (videoModal && videoIframe) {
            videoModal.style.display = 'none';
            videoIframe.src = ''; // reset iframe to stop audio
            document.body.style.overflow = ''; // Release scrolling
        }
    }

    if (videoModalClose) videoModalClose.addEventListener('click', closeVideoModal);
    if (videoModalOverlay) videoModalOverlay.addEventListener('click', closeVideoModal);

    /* --------------------------------------------------------------------------
       5. Photo Gallery (Filter categories, Image Lightbox)
       -------------------------------------------------------------------------- */
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            galleryItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (filterValue === 'all' || itemCategory === filterValue) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // Image Lightbox Modal
    const photoModal = document.getElementById('photo-modal');
    const photoModalOverlay = document.getElementById('photo-modal-overlay');
    const photoModalClose = document.getElementById('photo-modal-close');
    const photoModalImg = document.getElementById('photo-modal-img');
    const photoModalCaption = document.getElementById('photo-modal-caption');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('.gallery-img');
            const title = item.querySelector('h4').textContent;
            const subtitle = item.querySelector('p').textContent;

            if (photoModal && photoModalImg && photoModalCaption) {
                photoModalImg.src = img.src;
                photoModalCaption.textContent = `${title} - ${subtitle}`;
                photoModal.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Lock scrolling
            }
        });
    });

    function closePhotoModal() {
        if (photoModal) {
            photoModal.style.display = 'none';
            document.body.style.overflow = ''; // Release scrolling
        }
    }

    if (photoModalClose) photoModalClose.addEventListener('click', closePhotoModal);
    if (photoModalOverlay) photoModalOverlay.addEventListener('click', closePhotoModal);

    /* --------------------------------------------------------------------------
       6. Testimonials Auto-playing Carousel
       -------------------------------------------------------------------------- */
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const dotsContainer = document.getElementById('slider-dots');
    const prevSlideBtn = document.getElementById('slider-prev');
    const nextSlideBtn = document.getElementById('slider-next');
    let activeSlideIndex = 0;
    let testimonialTimer = null;

    // Create Navigation Dots
    if (dotsContainer && testimonialSlides.length > 0) {
        testimonialSlides.forEach((_, idx) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (idx === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                goToSlide(idx);
                resetTestimonialTimer();
            });
            dotsContainer.appendChild(dot);
        });
    }

    function goToSlide(index) {
        testimonialSlides[activeSlideIndex].classList.remove('active');
        activeSlideIndex = index;
        
        // Handle boundary resets
        if (activeSlideIndex >= testimonialSlides.length) activeSlideIndex = 0;
        if (activeSlideIndex < 0) activeSlideIndex = testimonialSlides.length - 1;

        testimonialSlides[activeSlideIndex].classList.add('active');
        
        // Update Dots
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === activeSlideIndex);
        });
    }

    function nextSlide() {
        goToSlide(activeSlideIndex + 1);
    }

    function prevSlide() {
        goToSlide(activeSlideIndex - 1);
    }

    if (prevSlideBtn) prevSlideBtn.addEventListener('click', () => { prevSlide(); resetTestimonialTimer(); });
    if (nextSlideBtn) nextSlideBtn.addEventListener('click', () => { nextSlide(); resetTestimonialTimer(); });

    // Auto rotate
    function startTestimonialTimer() {
        testimonialTimer = setInterval(nextSlide, 5000);
    }

    function resetTestimonialTimer() {
        clearInterval(testimonialTimer);
        startTestimonialTimer();
    }

    if (testimonialSlides.length > 0) {
        startTestimonialTimer();
    }

    /* --------------------------------------------------------------------------
       7. Form Validations & Mock Submissions
       -------------------------------------------------------------------------- */
    
    // Booking Form Submission Handler
    const bookingForm = document.getElementById('booking-form');
    const bookingSuccess = document.getElementById('booking-success');
    const resetBookingBtn = document.getElementById('btn-booking-reset');

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate date is not in past
            const dateInput = document.getElementById('book-date');
            const selectedDate = new Date(dateInput.value);
            const today = new Date();
            today.setHours(0,0,0,0);

            if (selectedDate < today) {
                alert("Please select a date in the future or today.");
                dateInput.focus();
                return;
            }

            // Mock submit transition
            const submitBtn = document.getElementById('booking-submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnIcon = submitBtn.querySelector('i');
            
            submitBtn.disabled = true;
            btnText.textContent = "Sending details...";
            btnIcon.className = "fa-solid fa-spinner fa-spin";

            setTimeout(() => {
                bookingForm.style.display = 'none';
                bookingSuccess.style.display = 'flex';
                submitBtn.disabled = false;
                btnText.textContent = "Submit Booking Request";
                btnIcon.className = "fa-solid fa-paper-plane";
                bookingForm.reset();
            }, 1800);
        });
    }

    if (resetBookingBtn) {
        resetBookingBtn.addEventListener('click', () => {
            bookingSuccess.style.display = 'none';
            bookingForm.style.display = 'flex';
        });
    }

    // Contact Form Submission Handler
    const contactForm = document.getElementById('contact-form');
    const contactSuccess = document.getElementById('contact-success');
    const resetContactBtn = document.getElementById('btn-contact-reset');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('contact-submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnIcon = submitBtn.querySelector('i');
            
            submitBtn.disabled = true;
            btnText.textContent = "Sending message...";
            btnIcon.className = "fa-solid fa-spinner fa-spin";

            setTimeout(() => {
                contactForm.style.display = 'none';
                contactSuccess.style.display = 'flex';
                submitBtn.disabled = false;
                btnText.textContent = "Send Message";
                btnIcon.className = "fa-solid fa-paper-plane";
                contactForm.reset();
            }, 1500);
        });
    }

    if (resetContactBtn) {
        resetContactBtn.addEventListener('click', () => {
            contactSuccess.style.display = 'none';
            contactForm.style.display = 'flex';
        });
    }

    // Newsletter Form Submission Handler
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterFeedback = document.getElementById('newsletter-feedback');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletter-email').value;
            
            // Simple mockup feedback
            newsletterFeedback.style.display = 'block';
            newsletterForm.reset();
            
            setTimeout(() => {
                newsletterFeedback.style.display = 'none';
            }, 4000);
        });
    }

    /* --------------------------------------------------------------------------
       8. Back to Top Button Control
       -------------------------------------------------------------------------- */
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
