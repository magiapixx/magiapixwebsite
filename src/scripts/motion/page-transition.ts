// Lingkaran oranye + nama halaman tujuan (scramble). Full page load (MPA), back/forward aman.
import { gsap } from 'gsap';
import { MOTION, $, store } from './tokens';

const NAMES: Record<string, string> = { '/': 'Home', '/projects/': 'Projects', '/about/': 'About us', '/blog/': 'Journal' };
const label = (a: HTMLAnchorElement) => NAMES[new URL(a.href).pathname] ?? (a.textContent?.trim().split('\n')[0].slice(0, 28) || 'Magiapix');
const BLOB_POINTS = 48;
const pointPolygon = (x: number, y: number) => `polygon(${Array.from({ length: BLOB_POINTS }, () => `${x}px ${y}px`).join(', ')})`;
const coverRadius = (x: number, y: number) => Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 1.2;
const coverCircle = (x: number, y: number) => {
  const radius = coverRadius(x, y);
  const points = Array.from({ length: BLOB_POINTS }, (_, i) => {
    const angle = (i / BLOB_POINTS) * Math.PI * 2;
    return `${(x + Math.cos(angle) * radius).toFixed(1)}px ${(y + Math.sin(angle) * radius).toFixed(1)}px`;
  });
  return `polygon(${points.join(', ')})`;
};
const randomBlob = (x: number, y: number) => {
  const radius = coverRadius(x, y);
  const phases = [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2];
  const points = Array.from({ length: BLOB_POINTS }, (_, i) => {
    const angle = (i / BLOB_POINTS) * Math.PI * 2;
    const variation = Math.sin(angle * 2 + phases[0]) * 0.04
      + Math.sin(angle * 3 + phases[1]) * 0.025
      + Math.sin(angle * 5 + phases[2]) * 0.015;
    const distance = radius * (1 + variation);
    return `${(x + Math.cos(angle) * distance).toFixed(1)}px ${(y + Math.sin(angle) * distance).toFixed(1)}px`;
  });
  return `polygon(${points.join(', ')})`;
};
const burgerOrigin = () => {
  const burger = $('.menu-btn')?.getBoundingClientRect();
  return {
    x: burger ? burger.left + burger.width / 2 : innerWidth / 2,
    y: burger ? burger.top + burger.height / 2 : innerHeight / 2,
  };
};

export function initPageTransition() {
  const pt = $('.pt')!, txt = $('.pt span')!;
  const root = document.documentElement;
  const cover = getComputedStyle(root).getPropertyValue('--pt-circle').trim();
  gsap.set(pt, { clipPath: root.classList.contains('pt-cover') && cover ? cover : 'circle(0px at 50% 50%)' });
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank') return;
    const url = new URL(a.href); if (url.origin !== location.origin || url.hash && url.pathname === location.pathname) return;
    if (/\.(xml|png|jpg|pdf)$/.test(url.pathname)) return;
    e.preventDefault(); const name = a.matches('.prow,.next') ? (a.querySelector('.nm,.next-title')?.textContent ?? a.textContent ?? '').trim() : label(a);
    const rect = a.getBoundingClientRect();
    const click = e as MouseEvent;
    const originX = Math.max(0, Math.min(innerWidth, click.detail > 0 ? click.clientX : rect.left + rect.width / 2));
    const originY = Math.max(0, Math.min(innerHeight, click.detail > 0 ? click.clientY : rect.top + rect.height / 2));
    const start = pointPolygon(originX, originY);
    const circle = coverCircle(originX, originY);
    const blob = randomBlob(originX, originY);
    root.style.setProperty('--pt-x', `${originX}px`);
    root.style.setProperty('--pt-y', `${originY}px`);
    root.style.setProperty('--pt-circle', circle);
    root.style.setProperty('--pt-blob', blob);
    txt.textContent = ''; pt.style.visibility = 'visible';
    gsap.timeline({ onComplete: () => {
      store.set('bb-pt', name);
      store.set('bb-pt-origin', `${originX},${originY}`);
      store.set('bb-pt-circle', circle);
      store.set('bb-pt-blob', blob);
      location.href = a.href;
    } })
      .fromTo(pt, { clipPath: start }, { clipPath: circle, duration: MOTION.base, ease: MOTION.c2 })
      .to(txt, { duration: 0.5, scrambleText: { text: name, chars: 'lowerCase', speed: 0.6 } }, '-=0.2');
  });
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    gsap.set(pt, { clipPath: 'circle(0px at 50% 50%)' });
    pt.style.visibility = '';
    root.classList.remove('pt-cover');
    root.style.removeProperty('--pt-x');
    root.style.removeProperty('--pt-y');
    root.style.removeProperty('--pt-circle');
    root.style.removeProperty('--pt-blob');
  });
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
  store.del('bb-pt-origin');
  store.del('bb-pt-circle');
  store.del('bb-pt-blob');
  if (!name) { root.classList.remove('pt-cover'); after(); return; }
  const { x, y } = burgerOrigin();
  const circle = getComputedStyle(root).getPropertyValue('--pt-circle').trim();
  const blob = getComputedStyle(root).getPropertyValue('--pt-blob').trim();
  txt.textContent = name; gsap.set(pt, { clipPath: circle || 'circle(150vmax at 50% 50%)' }); pt.style.visibility = 'visible';
  settled().then(() => {
    root.classList.remove('pt-cover');
    gsap.timeline({ onComplete: () => {
      gsap.set(pt, { clearProps: 'clipPath' });
      pt.style.visibility = '';
      root.style.removeProperty('--pt-x');
      root.style.removeProperty('--pt-y');
      root.style.removeProperty('--pt-circle');
      root.style.removeProperty('--pt-blob');
    } })
      .to(pt, { clipPath: blob || circle, duration: MOTION.fast * 0.5, ease: 'power1.inOut' })
      .to(pt, { clipPath: pointPolygon(x, y), duration: MOTION.slow * 0.8, ease: MOTION.c2 });
    // Animasi masuk halaman mulai saat panel mulai terangkat. Intro hero beranda (bb:loaded) baru mulai setelah
    // panel lewat setengah jalan, supaya pekerjaan intro tidak berebut frame dengan panel yang sedang terangkat.
    gsap.delayedCall(0.2, after);
    gsap.delayedCall(MOTION.slow * 0.45, () => window.dispatchEvent(new Event('bb:loaded')));
  });
  const h1 = $('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
}
