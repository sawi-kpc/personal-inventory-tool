// Manual light/dark toggle. Initial theme is applied by an inline script in
// <head> (before first paint); this just flips it and remembers the choice.
function toggleTheme(){
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('sk_theme', next);
}
