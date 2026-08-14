// Minimal JS for mobile menu and accessibility
document.addEventListener('DOMContentLoaded', function(){
  const nav = document.querySelector('header nav');
  if (!nav) return;
  // simple mobile toggle if nav becomes stacked
  const btn = document.createElement('button');
  btn.className = 'menu-toggle';
  btn.setAttribute('aria-expanded','false');
  btn.innerHTML = '☰';
  btn.style.marginLeft = '12px';
  btn.addEventListener('click', function(){
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open');
  });
  // insert before nav on small viewports
  const header = document.querySelector('.site-header');
  if (header) header.appendChild(btn);
});
