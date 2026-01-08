document.body.classList.add('no-scroll');
const sections = document.querySelectorAll('section');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, {
  threshold: 0.3
});

sections.forEach(section => observer.observe(section));

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('revealCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const mainTitle = document.getElementById('mainTitle');
    const scrollHint = document.getElementById('scrollHint');
    const aboutSection = document.getElementById('aboutSection');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let triangleSize = 200;
    let isRevealed = false;
    let revealProgress = 0;
    let animationStartTime = null;
    const animationDuration = 1500;
    let hintAnimationId = null;
    let hintPulsePhase = 0;

    const CLICKABLE_AREA_SIZE = 100;
    const clickableArea = {
        x: window.innerWidth / 2 - CLICKABLE_AREA_SIZE / 2,
        y: window.innerHeight / 2 - CLICKABLE_AREA_SIZE / 2,
        width: CLICKABLE_AREA_SIZE,
        height: CLICKABLE_AREA_SIZE
    };

    const triangleGlowRadius = triangleSize / 2;
    const triangleGlowSpread = 60;
    const triangleGlowColor = '255, 255, 255';

    function resizeCanvas() {
        if (!canvas || !ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        clickableArea.x = window.innerWidth / 2 - CLICKABLE_AREA_SIZE / 2;
        clickableArea.y = window.innerHeight / 2 - CLICKABLE_AREA_SIZE / 2;
        drawCutout();
    }

    function drawCutout() {
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentTriangleBase = triangleSize;
        let currentTriangleHeight = triangleSize;

        if (isRevealed) {
            const maxDim = Math.max(canvas.width, canvas.height);
            currentTriangleBase = triangleSize + (maxDim * 2) * revealProgress;
            currentTriangleHeight = triangleSize + (maxDim * 2) * revealProgress;
        }

        const p1x = mouseX;
        const p1y = mouseY + currentTriangleHeight / 2;
        const p2x = mouseX - currentTriangleBase / 2;
        const p2y = mouseY - currentTriangleHeight / 2;
        const p3x = mouseX + currentTriangleBase / 2;
        const p3y = mouseY - currentTriangleHeight / 2;

        if (!isRevealed && isMouseOverClickableArea(mouseX, mouseY)) {
            ctx.save();
            const pulseFactor = (Math.sin(hintPulsePhase) + 1) / 2;
            const currentGlowSpread = triangleGlowSpread * (0.8 + 0.4 * pulseFactor);

            const gradient = ctx.createRadialGradient(
                mouseX, mouseY, 0,
                mouseX, mouseY, triangleGlowRadius + currentGlowSpread
            );
            gradient.addColorStop(0, `rgba(${triangleGlowColor}, ${0.8 * (1 - pulseFactor * 0.3)})`);
            gradient.addColorStop(0.5, `rgba(${triangleGlowColor}, ${0.4 * (1 - pulseFactor * 0.2)})`);
            gradient.addColorStop(1, `rgba(${triangleGlowColor}, 0)`);

            ctx.fillStyle = gradient;
            if (!isRevealed && isMouseOverClickableArea(mouseX, mouseY)) {
                ctx.save();

                const p1 = { x: mouseX, y: mouseY + currentTriangleHeight / 2 };
                const p2 = { x: mouseX - currentTriangleBase / 2, y: mouseY - currentTriangleHeight / 2 };
                const p3 = { x: mouseX + currentTriangleBase / 2, y: mouseY - currentTriangleHeight / 2 };

                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 100;

                ctx.fillStyle = 'rgba(0, 17, 255, 0.77)'; 
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }
        }
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(p3x, p3y);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    function isMouseOverClickableArea(x, y) {
        return x >= clickableArea.x && x <= clickableArea.x + clickableArea.width &&
               y >= clickableArea.y && y <= clickableArea.y + clickableArea.height;
    }

    function animateReveal(timestamp) {
        if (!animationStartTime) animationStartTime = timestamp;
        const elapsed = timestamp - animationStartTime;
        revealProgress = Math.min(elapsed / animationDuration, 1);
        drawCutout();

        if (revealProgress < 1) {
            requestAnimationFrame(animateReveal);
        } else {
            canvas.style.opacity = '0';
            canvas.style.pointerEvents = 'none';

            setTimeout(() => {
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }, 1000);

            mainTitle.style.opacity = '1';
            mainTitle.style.pointerEvents = 'auto';

            setTimeout(() => document.querySelector('.word-cocoon')?.classList.add('show'), 300);
            setTimeout(() => document.querySelector('.word-tower')?.classList.add('show'), 500);

            setTimeout(() => {
                if (!scrollHint) return;
                scrollHint.classList.add('show', 'blink');
                document.body.classList.remove('no-scroll');
            }, 1000);
        }
    }

    function animateHint() {
        if (!isRevealed && isMouseOverClickableArea(mouseX, mouseY)) {
            hintPulsePhase += 0.05;
            if (hintPulsePhase > Math.PI * 2) hintPulsePhase -= Math.PI * 2;
            drawCutout();
            hintAnimationId = requestAnimationFrame(animateHint);
        } else {
            stopHintAnimation();
            drawCutout();
        }
    }

    function startHintAnimation() {
        if (!hintAnimationId) {
            hintPulsePhase = 0;
            hintAnimationId = requestAnimationFrame(animateHint);
        }
    }

    function stopHintAnimation() {
        if (hintAnimationId) {
            cancelAnimationFrame(hintAnimationId);
            hintAnimationId = null;
        }
    }

    window.addEventListener('mousemove', (e) => {
        if (isRevealed) {
            stopHintAnimation();
            return;
        }
        mouseX = e.clientX;
        mouseY = e.clientY;
        isMouseOverClickableArea(mouseX, mouseY) ? startHintAnimation() : stopHintAnimation();
        drawCutout();
    });

    canvas.addEventListener('click', (e) => {
        if (isRevealed) return;
        if (isMouseOverClickableArea(e.clientX, e.clientY)) {
            isRevealed = true;
            stopHintAnimation();
            animationStartTime = null;
            requestAnimationFrame(animateReveal);
        }
    });

    window.addEventListener('scroll', () => {
        if (!scrollHint || !isRevealed) return;
        const introSection = document.getElementById('introSection');
        const rect = introSection.getBoundingClientRect();
        if (rect.bottom < 0) {
            scrollHint.classList.remove('blink');
            scrollHint.style.opacity = '0';
        }
    });

    if (aboutSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                } else {
                    entry.target.classList.remove('visible');
                }
            });
        }, { threshold: 0.2 });
        observer.observe(aboutSection);
    }

    window.addEventListener('resize', resizeCanvas);
    window.onload = () => {
        if (canvas && ctx) {
            resizeCanvas();
            drawCutout();
        }
    };
});

document.addEventListener('DOMContentLoaded', () => {
  const infoBlocks = document.querySelectorAll('#stackedInfoSection .info-block');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 200);
      }
    });
  }, { threshold: 0.3 });

  infoBlocks.forEach(block => observer.observe(block));
});

const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
}

document.querySelector('.prev').addEventListener('click', () => {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(currentSlide);
});

document.querySelector('.next').addEventListener('click', () => {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
});

showSlide(currentSlide); 
const noteText = document.querySelector('.note-text');
const animatedWords = document.querySelectorAll('#animatedFollowUp .animated-word');
const followUpContainer = document.getElementById('animatedFollowUp');

if (noteText && followUpContainer) {
  const noteObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        noteText.classList.add('visible');

        setTimeout(() => {
          followUpContainer.classList.add('visible');

          animatedWords.forEach((word, index) => {
            setTimeout(() => {
              word.classList.add('show');
            }, index * 1500);
          });
        }, 2000);

        observer.unobserve(noteText);
      }
    });
  }, { threshold: 0.2 });

  noteObserver.observe(noteText);
}



document.addEventListener("DOMContentLoaded", () => {
  const phoneSection = document.getElementById("phoneDemoSection");
  const footer = document.querySelector(".footer");

  phoneSection.addEventListener("scroll", () => {
    const scrollBottom = phoneSection.scrollTop + phoneSection.clientHeight;
    const totalHeight = phoneSection.scrollHeight;

    if (scrollBottom >= totalHeight - 20) {
      footer.classList.add("show");
    } else {
      footer.classList.remove("show");
    }
  });
});
