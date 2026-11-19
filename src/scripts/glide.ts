import { getLenis } from './lenis';

// Luncurkan halaman ke posisi scroll tertentu dengan input scroll dikunci; dipakai transisi sekali-scroll
// (hero, About us, kartu Selected works, footer).
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Di layar sentuh Lenis tidak menangani geseran jari (scroll native), jadi stop() tidak menahannya:
// jari dan sisa momentum melawan luncuran. Selama luncuran, touchmove diblok dan overflow html
// dikunci (menghentikan momentum iOS); window.scrollTo dari Lenis tetap berjalan.
const isTouch = () => matchMedia('(hover: none) and (pointer: coarse)').matches;
const blockTouch = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };
const lockTouch = (on: boolean) => {
  if (!isTouch()) return;
  document.documentElement.style.overflow = on ? 'hidden' : '';
  if (on) window.addEventListener('touchmove', blockTouch, { passive: false });
  else window.removeEventListener('touchmove', blockTouch);
};

let gliding = false;
let suppressUntil = 0;
// true selama luncuran berjalan, atau selama luncuran sengaja ditahan (mis. "Back to top" yang melintasi
// semua section sekaligus dan tidak boleh disela luncuran per section).
export const isGliding = () => gliding || performance.now() < suppressUntil;
export const suppressGlides = (ms: number) => { suppressUntil = performance.now() + ms; };

export const glideTo = (to: number, duration: number, easing?: (t: number) => number) => {
  const lenis = getLenis();
  if (lenis) {
    // stop() menahan wheel/touch pengguna selama luncuran; lock saja masih bisa disela scroll yang tersisa.
    lenis.stop();
    lockTouch(true);
    gliding = true;
    lenis.scrollTo(to, { duration, easing, lock: true, force: true, onComplete: () => {
      lockTouch(false);
      lenis.start();
      // Jeda singkat: posisi akhir bisa pecahan piksel (layar DPR tinggi) dan tidak boleh langsung memicu luncuran lain.
      setTimeout(() => { gliding = false; }, 150);
    } });
  }
  else window.scrollTo({ top: to, behavior: 'smooth' });
};
