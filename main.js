if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw_cached_site.js")
      .then((reg) => console.log("service worker registered"))
      .catch((err) => console.log(`service worker: Error: ${err}`));
  });
}

// Smooth fade loop for hero background video
document.addEventListener('DOMContentLoaded', () => {
  const heroVideo = document.querySelector('.hero-bg-video');
  if (heroVideo) {
    const fadeDuration = 1; // seconds before end to start fading

    heroVideo.addEventListener('timeupdate', () => {
      const timeLeft = heroVideo.duration - heroVideo.currentTime;
      if (timeLeft <= fadeDuration) {
        heroVideo.style.opacity = Math.max(0, timeLeft / fadeDuration);
      } else if (heroVideo.currentTime < fadeDuration) {
        heroVideo.style.opacity = Math.min(1, heroVideo.currentTime / fadeDuration);
      } else {
        heroVideo.style.opacity = 1;
      }
    });
  }
});


// Wait for Lenis to load (now deferred) before initializing
function initLenis() {
  if (typeof Lenis === 'undefined') {
    setTimeout(initLenis, 50);
    return;
  }

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // Integrate Lenis with GSAP ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  // Smooth scroll to anchor links using Lenis
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      lenis.scrollTo(this.getAttribute('href'));
    });
  });
}

initLenis();

// Hobbies Toast Visibility Observer
document.addEventListener('DOMContentLoaded', () => {
  const toastWrapper = document.querySelector('.hobbies-toast-wrapper');
  const sectionsToWatch = [
    { el: document.getElementById('Home'), show: true },
    { el: document.getElementById('Contact'), show: true }
  ].filter(item => item.el !== null);

  if (toastWrapper && sectionsToWatch.length > 0) {
    const activeShowSections = new Set();
    const activeHideSections = new Set();
    const contactEl = document.getElementById('Contact');
    const navbarEl = document.getElementById('Navbar');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const config = sectionsToWatch.find(s => s.el === entry.target);
        if (!config) return;

        if (entry.isIntersecting) {
          if (config.show) activeShowSections.add(entry.target);
          else activeHideSections.add(entry.target);
        } else {
          if (config.show) activeShowSections.delete(entry.target);
          else activeHideSections.delete(entry.target);
        }

        if (activeShowSections.size > 0 && activeHideSections.size === 0) {
          toastWrapper.classList.remove('toast-hidden');
        } else {
          toastWrapper.classList.add('toast-hidden');
        }

        // Toggle contact-visible class for hobbies toast styling
        if (contactEl && activeShowSections.has(contactEl)) {
          toastWrapper.classList.add('contact-visible');
        } else {
          toastWrapper.classList.remove('contact-visible');
        }
      });
    }, {
      root: null,
      threshold: 0.1
    });

    sectionsToWatch.forEach(item => observer.observe(item.el));
  }

  // Dedicated observer for Navbar dark mode starting from About section
  const aboutEl = document.getElementById('About');
  const faqEl = document.getElementById('FAQ');
  const contactEl = document.getElementById('Contact');
  const navbarEl = document.getElementById('Navbar');

  if (navbarEl) {
    let activeDarkSections = new Set();
    const navDarkObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeDarkSections.add(entry.target.id);
        } else {
          activeDarkSections.delete(entry.target.id);
        }
      });

      if (activeDarkSections.size > 0) {
        navbarEl.classList.add('nav-dark');
      } else {
        navbarEl.classList.remove('nav-dark');
      }
    }, {
      root: null,
      rootMargin: '-80px 0px 0px 0px', // Trigger slightly after it hits the top
      threshold: 0
    });

    if (contactEl) navDarkObserver.observe(contactEl);
  }
});

// Preloader — fade out once page is fully loaded
window.addEventListener('load', () => {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    if (window.isRecruiterBypass) {
      const msg = document.getElementById('recruiter-msg');
      if (msg) msg.style.display = 'block';
      setTimeout(() => {
        preloader.classList.add('preloader-hidden');
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 300);
      }, 0);
    } else {
      preloader.classList.add('preloader-hidden');
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 300);
    }
  }
});

// Active section highlighting for nav links
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll('#Navbar .div-block a[href^="#"]');
  const sectionIds = Array.from(navLinks).map(link => link.getAttribute('href').substring(1));
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  function setActiveLink(sectionId) {
    navLinks.forEach(link => {
      if (link.getAttribute('href') === '#' + sectionId) {
        link.classList.add('nav-active');
      } else {
        link.classList.remove('nav-active');
      }
    });
  }

  // Highlight on click immediately
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const id = link.getAttribute('href').substring(1);
      setActiveLink(id);
    });
  });

  // Highlight on scroll via IntersectionObserver
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // When Home section is in view, clear all active states
        if (entry.target.id === 'Home') {
          navLinks.forEach(link => link.classList.remove('nav-active'));
        } else {
          setActiveLink(entry.target.id);
        }
      }
    });
  }, observerOptions);

  // Also observe Home section so we can clear highlights when in hero area
  const homeSection = document.getElementById('Home');
  if (homeSection) observer.observe(homeSection);
  sections.forEach(section => observer.observe(section));
});

// Lazy load Contact section background video
document.addEventListener("DOMContentLoaded", () => {
  const contactSection = document.getElementById("Contact");
  const bgVideo = document.querySelector(".contact-bg-video");

  if (contactSection && bgVideo) {
    const videoObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const source = bgVideo.querySelector("source");
          if (source && source.dataset.src) {
            source.src = source.dataset.src;
            bgVideo.load();
            bgVideo.play().then(() => {
              let isFading = false;
              const fadeDuration = 0.8; // Match the CSS transition time

              // Use native timeupdate event instead of infinite requestAnimationFrame polling
              bgVideo.addEventListener('timeupdate', () => {
                const timeLeft = bgVideo.duration - bgVideo.currentTime;

                // Trigger fade out right before the video ends
                if (timeLeft <= fadeDuration && !isFading) {
                  isFading = true;
                  bgVideo.classList.add('fade-out');
                }

                // Remove fade out once it has looped back to the beginning
                if (bgVideo.currentTime < fadeDuration && isFading) {
                  isFading = false;
                  bgVideo.classList.remove('fade-out');
                }
              });
            }).catch(e => console.log("Autoplay prevented:", e));
            // Stop observing once loaded
            observer.unobserve(contactSection);
          }
        }
      });
    }, {
      // Start loading when the contact section is 800px away from the viewport
      rootMargin: "800px 0px"
    });

    videoObserver.observe(contactSection);
  }
});
