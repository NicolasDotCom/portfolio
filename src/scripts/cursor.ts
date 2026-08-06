export function initCursor(): void {
  const cursor = document.getElementById('cursor-dot');
  if (!cursor) return;

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.classList.add('active');
  });

  document.addEventListener('mouseleave', () => {
    cursor.classList.remove('active');
  });

  // Hover effect on interactive elements
  const hoverElements = document.querySelectorAll('a, button, [role="button"]');
  hoverElements.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });

  // Smooth follow
  function animate() {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    requestAnimationFrame(animate);
  }

  animate();
}
