// Interaksi yang tetap jalan walau gerak dimatikan: menu, akordeon, filter, video, jam.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION, $, $$, motionOn, finePointer } from './tokens';
import { getLenis } from '../lenis';
import { suppressGlides } from '../glide';

export function initMenu() {
  const menu = $('#menu'), btn = $('.menu-btn'); if (!menu || !btn) return;
  const close = $('.menu-close', menu)!;
  const syncActive = () => {
    const cur = location.pathname.replace(/\/$/, '') || '/';
    $$('.menu-list a', menu).forEach((a) => {
      const h = (a.getAttribute('href') || '').replace(/\/$/, '') || '/';
      const on = h === '/' ? cur === '/' : cur === h || cur.startsWith(h + '/');
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  };
  syncActive();
  const open = () => {
    syncActive();
    menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true'); getLenis()?.stop();
    if (motionOn()) gsap.timeline()
      .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: MOTION.base, ease: MOTION.c2 })
      .from($$('.menu-list a', menu), { y: 20, opacity: 0, duration: MOTION.base, ease: MOTION.ease, stagger: 0.05, clearProps: 'opacity,transform' }, '-=0.25')
      .from(close, { y: 20, opacity: 0, duration: MOTION.base, ease: MOTION.ease, clearProps: 'opacity,transform' }, '<')
      .fromTo($$('.menu-info > *', menu), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: MOTION.base, ease: MOTION.ease, stagger: 0.05, clearProps: 'opacity,transform' }, '<');
    setTimeout(() => close.focus(), 50);
  };
  const shut = () => {
    if (!menu.classList.contains('open')) return;
    const done = () => { menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); btn.setAttribute('aria-expanded', 'false'); getLenis()?.start(); btn.focus(); };
    if (motionOn()) gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: MOTION.base * 0.8, ease: MOTION.c2, onComplete: () => { gsap.set(menu, { clearProps: 'clipPath' }); done(); } });
    else done();
  };
  btn.addEventListener('click', open); close.addEventListener('click', shut);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') shut(); });
}

export function initAccordions() {
  $$('.acc-item').forEach((it) => {
    const btn = $('.acc-btn', it)!, panel = $('.acc-panel', it)!;
    btn.addEventListener('click', () => {
      const open = !it.classList.contains('open');
      // Panel yang membuka/menutup mengubah tinggi halaman. Tanpa penahan, perubahan posisi scroll terbaca
      // sebagai scroll pengguna dan memicu luncuran section (mis. ke footer). Jadi luncuran ditahan selama animasi.
      // Posisi scroll tidak dikoreksi: panel membuka ke bawah seperti accordion biasa.
      // Item lain yang sedang terbuka TIDAK ditutup: setiap item buka/tutup sendiri, beberapa boleh terbuka bersamaan.
      suppressGlides(MOTION.base * 1000 + 400);
      const top0 = btn.getBoundingClientRect().top;
      // Tinggi diukur SEBELUM kelas open berubah; sesudahnya CSS sudah membuatnya 0, panel kolaps seketika
      // dan halaman melompat alih-alih menutup halus.
      const h0 = panel.offsetHeight;
      it.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
      if (motionOn()) gsap.fromTo(panel, { height: open ? 0 : h0 }, { height: open ? 'auto' : 0, duration: MOTION.base, ease: MOTION.ease, clearProps: 'height', onComplete: () => ScrollTrigger.refresh() });
      // Pengaman: bila judul yang diklik terpotong di atas layar, halaman di-scroll pelan supaya judul
      // berhenti ~120px dari atas layar.
      const minTop = 120;
      if (top0 < minTop) {
        const to = window.scrollY + top0 - minTop, lenis = getLenis();
        if (lenis) lenis.scrollTo(to, { duration: MOTION.base, force: true });
        else window.scrollTo({ top: to, behavior: 'smooth' });
      }
    });
  });
  // Akordeon hover (data-hover): di perangkat ber-mouse, item terbuka saat kursor masuk dan
  // semua tertutup saat kursor keluar dari daftar. Jeda kecil mencegah buka-tutup beruntun saat kursor lewat cepat.
  if (!finePointer()) return;
  $$('.acc[data-hover]').forEach((list) => {
    let t = 0;
    const set = (target: HTMLElement | null) => $$('.acc-item', list).forEach((it) => {
      const want = it === target, open = it.classList.contains('open'); if (want === open) return;
      const panel = $('.acc-panel', it)!, h0 = panel.offsetHeight; it.classList.toggle('open', want); $('.acc-btn', it)!.setAttribute('aria-expanded', String(want));
      if (motionOn()) gsap.fromTo(panel, { height: want ? 0 : h0 }, { height: want ? 'auto' : 0, duration: MOTION.base, ease: MOTION.ease, clearProps: 'height', overwrite: true, onComplete: () => ScrollTrigger.refresh() });
    });
    set(null);
    $$('.acc-item', list).forEach((it) => it.addEventListener('pointerenter', () => { clearTimeout(t); t = window.setTimeout(() => set(it), 90); }));
    list.addEventListener('pointerleave', () => { clearTimeout(t); t = window.setTimeout(() => set(null), 120); });
  });
}

export function initFilters() {
  $$('[data-filter]').forEach((bar) => {
    const list = $(bar.dataset.filter!); if (!list) return;
    $$<HTMLButtonElement>('button', bar).forEach((b) => b.addEventListener('click', () => {
      $$('button', bar).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.f!; const items = $$('[data-cat]', list);
      list.closest<HTMLElement>('[data-preview]')?.dispatchEvent(new Event('preview:hide'));
      items.forEach((it) => { it.hidden = !(f === 'all' || it.dataset.cat!.split(' ').includes(f)); });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }));
  });
}

export function initVideo() {
  // Tombol pause dihapus atas permintaan owner: video hero berputar otomatis hanya bila gerak menyala
  // (reduced-motion / panel Gerak mati = video diam di poster).
  $$<HTMLVideoElement>('.frame video').forEach((v) => { if (motionOn()) v.play().catch(() => {}); else v.pause(); });
}
