let cursor: HTMLElement | null = null;
let loopStarted = false;

function bindHoverElements(target: HTMLElement): void {
  const hoverElements = document.querySelectorAll('a, button, [role="button"]');
  hoverElements.forEach((el) => {
    el.addEventListener('mouseenter', () => target.classList.add('hover'));
    el.addEventListener('mouseleave', () => target.classList.remove('hover'));
  });
}

export function initCursor(): void {
  cursor = document.getElementById('cursor-dot');
  if (!cursor) return;

  bindHoverElements(cursor);

  if (loopStarted) return;
  loopStarted = true;

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor?.classList.add('active');
  });

  document.addEventListener('mouseleave', () => {
    cursor?.classList.remove('active');
  });

  function animate() {
    if (cursor) {
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
    }
    requestAnimationFrame(animate);
  }

  animate();
}