// Loader awal: menutup halaman sampai semua aset selesai dimuat, dengan persentase progres yang sungguhan.
// Yang dihitung: font, setiap gambar yang langsung dimuat (bukan loading="lazy"), setiap video (cukup data untuk
// diputar sampai akhir bila preload="auto"/autoplay, metadata untuk yang lain), dan event load halaman.
// Angka di layar mengejar progres sebenarnya dengan halus dan hanya mencapai 100% saat semuanya selesai.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION, $, $$, store, motionOn } from './tokens';
import { getLenis } from '../lenis';

// Batas aman per aset: video yang macet (mis. jaringan putus) tidak boleh menahan halaman selamanya.
const ASSET_TIMEOUT = 60000;

const waitFor = (target: EventTarget, events: string[], ready: () => boolean) =>
  new Promise<void>((done) => {
    if (ready()) { done(); return; }
    const finish = () => { events.forEach((ev) => target.removeEventListener(ev, finish)); clearTimeout(t); done(); };
    const t = setTimeout(finish, ASSET_TIMEOUT);
    events.forEach((ev) => target.addEventListener(ev, finish));
  });

const tasks = (): Promise<void>[] => {
  const list: Promise<void>[] = [];
  list.push(document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve());
  $$<HTMLImageElement>('img').forEach((img) => {
    if (img.loading === 'lazy') return;
    list.push(waitFor(img, ['load', 'error'], () => img.complete));
  });
  $$<HTMLVideoElement>('video').forEach((v) => {
    const full = v.preload === 'auto' || v.autoplay;
    list.push(full
      ? waitFor(v, ['canplaythrough', 'error'], () => v.readyState >= 4 || !!v.error)
      : waitFor(v, ['loadedmetadata', 'error'], () => v.readyState >= 1 || !!v.error));
  });
  list.push(waitFor(window, ['load'], () => document.readyState === 'complete'));
  return list;
};

// Scroll ditahan lewat event (bukan overflow:hidden) supaya scrollbar tidak hilang-muncul dan tata letak
// tidak bergeser saat loader dilepas.
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
const blockScroll = (e: Event) => {
  if (e instanceof KeyboardEvent && !SCROLL_KEYS.has(e.key)) return;
  if (e.cancelable) e.preventDefault();
};
const lockScroll = (on: boolean) => {
  const fn = on ? addEventListener : removeEventListener;
  (['wheel', 'touchmove', 'keydown'] as const).forEach((ev) => fn(ev, blockScroll, { passive: false } as AddEventListenerOptions));
};

export function runLoader(after: () => void) {
  const root = document.documentElement, el = $('.loader');
  if (!el || !root.classList.contains('is-loading')) { after(); return; }
  const ctr = $('.ctr', el)!, bar = $('.loader-bar i', el);
  window.scrollTo(0, 0);
  getLenis()?.stop();
  lockScroll(true);

  const jobs = tasks();
  let doneCount = 0, finished = false, shown = 0;
  jobs.forEach((j) => j.then(() => { doneCount++; }));

  const render = () => {
    ctr.textContent = String(Math.floor(shown));
    if (bar) bar.style.transform = `scaleX(${shown / 100})`;
  };

  const exit = () => {
    store.set('bb-loaded', '1');
    // Hitung ulang posisi ScrollTrigger selagi halaman masih tertutup, supaya tidak menahan animasi sesudahnya.
    ScrollTrigger.refresh();
    const reveal = () => { after(); window.dispatchEvent(new Event('bb:loaded')); };
    const release = () => { root.classList.remove('is-loading'); lockScroll(false); getLenis()?.start(); };
    if (!motionOn()) { release(); reveal(); return; }
    // Animasi hilang: teks naik dan memudar, garis progres memudar, lalu panel terangkat seperti tirai dengan
    // tepi bawah melengkung (membesar di awal, merata lagi di akhir). Animasi muncul CSS dimatikan dulu karena
    // fill-nya akan menimpa nilai yang dianimasikan GSAP.
    const texts = $$('.loader-mark, .loader-note, .loader-num', el);
    const curve = $('.loader-curve', el);
    const lift = MOTION.slow * 1.05;
    gsap.set([...texts, $('.loader-bar', el)], { animation: 'none' });
    gsap.timeline({ delay: 0.3 })
      .to(texts, { y: -40, opacity: 0, duration: 0.55, ease: 'power3.in', stagger: 0.07 })
      .to($('.loader-bar', el), { opacity: 0, duration: 0.3, ease: 'none' }, '<0.1')
      .addLabel('lift', '-=0.1')
      .to(el, { y: () => -(innerHeight + (curve?.offsetHeight ?? 0)), duration: lift, ease: 'power3.inOut', onStart: () => { gsap.delayedCall(0.4, reveal); } }, 'lift')
      .fromTo(curve, { scaleY: 0 }, { scaleY: 1, duration: lift * 0.45, ease: 'power2.out' }, 'lift')
      .to(curve, { scaleY: 0, duration: lift * 0.55, ease: 'power2.in' }, `lift+=${lift * 0.45}`)
      .add(() => { release(); gsap.set([el, curve, $('.loader-bar', el), ...texts].filter(Boolean), { clearProps: 'all' }); });
  };

  // Angka mengejar progres sebenarnya; 100 hanya tercapai setelah semua tugas selesai. Loader tampil minimal
  // 1,6 detik supaya animasi muncul (CSS) selesai dulu sebelum animasi hilang dimulai.
  const t0 = performance.now();
  const tick = () => {
    const all = doneCount === jobs.length && (!motionOn() || performance.now() - t0 > 1600);
    const cap = all ? 100 : Math.min((doneCount / jobs.length) * 100, 99);
    shown += (cap - shown) * 0.12;
    if (cap - shown < 0.4) shown = cap;
    render();
    if (all && shown >= 100 && !finished) { finished = true; gsap.ticker.remove(tick); exit(); }
  };
  render();
  gsap.ticker.add(tick);
}
