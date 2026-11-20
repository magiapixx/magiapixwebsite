// Panel oranye + nama halaman tujuan (scramble). Full page load (MPA), back/forward aman.
import { gsap } from 'gsap';
import { MOTION, $, store } from './tokens';

const NAMES: Record<string, string> = { '/': 'Home', '/projects/': 'Projects', '/about/': 'About us', '/blog/': 'Journal' };
const label = (a: HTMLAnchorElement) => NAMES[new URL(a.href).pathname] ?? (a.textContent?.trim().split('\n')[0].slice(0, 28) || 'Magiapix');

export function initPageTransition() {
  const pt = $('.pt')!, txt = $('.pt span')!;
  gsap.set(pt, { yPercent: document.documentElement.classList.contains('pt-cover') ? 0 : 100 });
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank') return;
    const url = new URL(a.href); if (url.origin !== location.origin || url.hash && url.pathname === location.pathname) return;
    if (/\.(xml|png|jpg|pdf)$/.test(url.pathname)) return;
    e.preventDefault(); const name = a.matches('.prow,.next') ? (a.querySelector('.nm,.next-title')?.textContent ?? a.textContent ?? '').trim() : label(a);
    txt.textContent = ''; pt.style.visibility = 'visible';
    gsap.timeline({ onComplete: () => { store.set('bb-pt', name); location.href = a.href; } })
      .fromTo(pt, { yPercent: 100 }, { yPercent: 0, duration: MOTION.base, ease: MOTION.c2 })
      .to(txt, { duration: 0.5, scrambleText: { text: name, chars: 'lowerCase', speed: 0.6 } }, '-=0.2');
  });
  addEventListener('pageshow', (e) => { if (e.persisted) { gsap.set(pt, { yPercent: 100 }); pt.style.visibility = ''; document.documentElement.classList.remove('pt-cover'); } });
}

// Tunggu halaman tujuan selesai dimuat (maks. 2,5 detik) plus dua frame. Panel diangkat oleh GSAP di main thread;
// bila diangkat sambil halaman masih menyiapkan diri (ScrollTrigger.refresh saat load, inisialisasi beranda,
// decoding video) gerakannya tersendat. Selama menunggu, panel tetap menutup layar dengan nama halaman.
const settled = () => new Promise<void>((done) => {
  const go = () => requestAnimationFrame(() => requestAnimationFrame(() => done()));
  if (document.readyState === 'complete') { go(); return; }
  const t = setTimeout(go, 2500);
  addEventListener('load', () => { clearTimeout(t); setTimeout(go, 60); }, { once: true });
});

export function pageIn(after: () => void) {
  const pt = $('.pt')!, txt = $('.pt span')!, name = store.get('bb-pt'); store.del('bb-pt');
  const root = document.documentElement;
  if (!name) { root.classList.remove('pt-cover'); after(); return; }
  txt.textContent = name; gsap.set(pt, { yPercent: 0 }); pt.style.visibility = 'visible';
  settled().then(() => {
    root.classList.remove('pt-cover');
    gsap.to(pt, { yPercent: -100, duration: MOTION.slow * 0.8, ease: MOTION.c2, onComplete: () => { gsap.set(pt, { yPercent: 100 }); pt.style.visibility = ''; } });
    // Animasi masuk halaman (mis. intro hero beranda) mulai saat panel mulai terangkat.
    gsap.delayedCall(0.2, () => { after(); window.dispatchEvent(new Event('bb:loaded')); });
  });
  const h1 = $('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
}
