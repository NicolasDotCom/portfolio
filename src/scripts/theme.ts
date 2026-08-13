export function applyTheme(): void {
  const html = document.documentElement;
  const stored = localStorage.getItem('theme');
  const theme =
    stored ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  html.classList.toggle('dark', theme === 'dark');
  if (!stored) localStorage.setItem('theme', theme);
}

export function toggleTheme(): void {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  html.classList.toggle('dark', newTheme === 'dark');
  localStorage.setItem('theme', newTheme);
}