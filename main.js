// for SW lifecycle: register => install => activate

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw_cached_site.js")
      .then((reg) => console.log("service worker registered"))
      .catch((err) => console.log(`service worker: Error: ${err}`));
  });
}

// Lenis Smooth Scroll Initialization
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
      });
    }, {
      root: null,
      threshold: 0.1
    });

    sectionsToWatch.forEach(item => observer.observe(item.el));
  }
});

// Preloader with circular progress simulation
window.addEventListener('load', () => {
  const preloader = document.querySelector('.preloader');
  const circle = document.querySelector('.progress-ring__circle');

  if (preloader && circle) {
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    const duration = 1000; // 1 second
    const startTime = Date.now();

    function updateProgress() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const offset = circumference - (progress * circumference);
      circle.style.strokeDashoffset = offset;

      if (progress < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        // Progress complete, fade out
        setTimeout(() => {
          preloader.classList.add('preloader-hidden');
          setTimeout(() => {
            preloader.style.display = 'none';
          }, 600);
        }, 200);
      }
    }
    requestAnimationFrame(updateProgress);
  }
});

// Full Page Scroll-Driven Image Sequence Animation
(function () {
  const canvas = document.getElementById("video-canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const frameCount = 75;
  const currentFrame = index => `ezgif/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`;

  const images = [];
  const airpods = { frame: 0 };

  // Preload images
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
  }

  function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const img = images[airpods.frame];
    if (!img || !img.complete) return;

    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;
    let drawWidth, drawHeight, drawX, drawY;

    if (canvasRatio > imgRatio) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / imgRatio;
      drawX = 0;
      drawY = (canvas.height - drawHeight) / 2;
    } else {
      drawWidth = canvas.height * imgRatio;
      drawHeight = canvas.height;
      drawX = (canvas.width - drawWidth) / 2;
      drawY = 0;
    }
    context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  const initScrollAnimation = () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      setTimeout(initScrollAnimation, 100);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Animation sequence
    gsap.to(airpods, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5
      },
      onUpdate: render
    });

    // Overlay shift if needed
    gsap.fromTo(".video-overlay",
      { backgroundColor: "rgba(255, 255, 255, 0.85)" },
      {
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: true
        }
      }
    );

    // Initial render
    if (images[0].complete) render();
    else images[0].onload = render;

    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render();
    });
  };

  // Set initial canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  initScrollAnimation();
})();



