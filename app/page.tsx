'use client';

import { CustomCursor } from '@/components/luxora-jmal';
import GazePanel from '@/components/gaze-panel';

const NAV_LINKS = [
  { href: '#collection', label: 'المجموعة' },
  { href: '#craft', label: 'الحرفة' },
  { href: '#hospitality', label: 'الضيافة 360°' },
  { href: '#contact', label: 'تواصل' },
];

const CITIES = [
  'فاس',
  'مراكش',
  'طنجة',
  'الرباط',
  'أكادير',
  'الصويرة',
  'شفشاون',
  'تطوان',
  'ورزازات',
  'مكناس',
];

const FEATURES = [
  {
    title: 'حرفية أصيلة',
    body: 'زليج منقّش، نحاس مطروق، وجلود مدبوغة باليد من محترفات فاس و مراكش.',
    icon: '✦',
  },
  {
    title: 'ضيافة مغربية',
    body: 'أتاي بالنعناع، طاجين، وريحة العود — خدمة كاملة لمناسباتك، من الضيافة للديكور.',
    icon: '❖',
  },
  {
    title: 'توصيل 360°',
    body: 'من طنجة حتى الكويرة. التغليف بلاستيك مصنوع من الورق المعاد تدويره و التتبع مباشر.',
    icon: '✧',
  },
];

const HOSPITALITY_STEPS = [
  { n: '01', t: 'التشخيص', d: 'كنفهمو المناسبة، العدد، والذوق: تقليدي، عصري ولا مزيج.' },
  { n: '02', t: 'الإبداع', d: 'كنصممو الميناج، الزليج، والمائدة على قياس المكان.' },
  { n: '03', t: 'التنفيذ', d: 'فريق في المكان: خدمة، أتاي، وعدّة مغربية أصيلة.' },
];

export default function Home() {
  return (
    <>
      <CustomCursor />

      <div className="relative min-h-screen overflow-x-hidden bg-[#070a14]">
        {/* خلفية: زليج + توهج */}
        <div className="pointer-events-none absolute inset-0 luxora-zellige" />
        <div className="pointer-events-none absolute left-1/2 top-[18vh] h-[70vh] w-[70vw] -translate-x-1/2 luxora-glow" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#070a14] to-transparent" />

        {/* ===================== Header ===================== */}
        <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-6">
          <a href="#" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-300/20 to-amber-700/10 text-lg font-bold text-amber-200">
              ل
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-wide luxora-gold-text">LUXORA MA</span>
              <span className="block text-[11px] tracking-[0.3em] text-amber-200/50">360° MAROC</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-amber-100/70 transition hover:text-amber-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className="rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20"
          >
            طلب عرض ثمن
          </a>
        </header>

        {/* ===================== Hero ===================== */}
        <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24">
          <section className="grid items-center gap-12 pt-6 lg:grid-cols-[1.05fr_1fr] lg:pt-12">
            <div className="order-2 lg:order-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs text-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                متوفرين دابا · خدمة في كل المملكة
              </span>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.25] sm:text-5xl lg:text-[3.4rem]">
                ضيافة مغربية <span className="luxora-gold-text">بروح 360°</span>
                <br />
                من قلب المحترفات للدر ديالك
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-amber-100/70">
                لوكسورا كاتجمع الحرفية التقليدية مع نظرة عصرية: زليج، نحاس، أتاي بالنعناع، وخدمة
                للضيافة كاملة. <span className="text-amber-200">حرّك الماوس</span> — الجمل بالطربوش
                كايتبعك، و الكاس ديال الأتاي هو المؤشر ديالك.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#collection"
                  className="rounded-full bg-gradient-to-l from-amber-300 to-amber-500 px-7 py-3.5 text-sm font-bold text-[#1b1206] shadow-lg shadow-amber-500/20 transition hover:brightness-110"
                >
                  شوف المجموعة
                </a>
                <a
                  href="#hospitality"
                  className="rounded-full border border-amber-400/30 px-7 py-3.5 text-sm font-semibold text-amber-100/90 transition hover:border-amber-400/70 hover:text-amber-200"
                >
                  الضيافة 360°
                </a>
              </div>

              <div className="mt-10 flex gap-8">
                {[
                  { v: '+120', k: 'قطعة حرفية' },
                  { v: '24-48h', k: 'التوصيل' },
                  { v: '4.9/5', k: 'رضا العملاء' },
                ].map((s) => (
                  <div key={s.k}>
                    <p className="text-2xl font-bold text-amber-200">{s.v}</p>
                    <p className="text-xs text-amber-100/50">{s.k}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <GazePanel />
            </div>
          </section>

          {/* ===================== Marquee ===================== */}
          <section className="mt-20 overflow-hidden rounded-2xl border border-amber-400/15 bg-[#0b0f1c]/60 py-4">
            <div className="flex w-max animate-luxora-marquee items-center gap-10 px-6">
              {[...CITIES, ...CITIES].map((city, i) => (
                <span key={`${city}-${i}`} className="flex items-center gap-10 text-sm tracking-[0.3em] text-amber-200/60">
                  {city}
                  <span className="text-amber-400/50">✦</span>
                </span>
              ))}
            </div>
          </section>

          {/* ===================== Features ===================== */}
          <section id="craft" className="mt-24 scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-[0.4em] text-amber-400/70">LUXORA 360°</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  ثلاثة أعمدة، <span className="luxora-gold-text">تجربة واحدة</span>
                </h2>
              </div>
              <p className="max-w-md text-sm text-amber-100/60">
                من اختيار الحرفة حتى تقديم الأتاي — كل تفصيل محسوب باش المناسبة ديالك تبقى في الذاكرة.
              </p>
            </div>

            <div id="collection" className="mt-10 grid gap-5 scroll-mt-24 md:grid-cols-3">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="interactive group rounded-2xl border border-amber-400/15 bg-gradient-to-b from-[#0d1224]/90 to-[#0b0f1c]/70 p-7 transition hover:border-amber-400/45 hover:shadow-[0_0_40px_-12px_rgba(242,193,78,0.35)]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-xl text-amber-300">
                    {f.icon}
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-amber-100">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-amber-100/60">{f.body}</p>
                  <span className="mt-6 inline-block text-xs tracking-widest text-amber-400/70 transition group-hover:text-amber-300">
                    تفاصيل ←
                  </span>
                </article>
              ))}
            </div>
          </section>

          {/* ===================== Hospitality ===================== */}
          <section id="hospitality" className="mt-24 scroll-mt-24 rounded-3xl border border-amber-400/15 bg-[#0b0f1c]/70 p-8 sm:p-12">
            <p className="text-[11px] tracking-[0.4em] text-amber-400/70">SERVICE</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">الضيافة على طريقة لوكسورا</h2>

            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {HOSPITALITY_STEPS.map((s) => (
                <div key={s.n} className="relative border-t border-amber-400/20 pt-6">
                  <span className="absolute -top-px left-0 h-px w-12 bg-amber-400" />
                  <span className="font-mono text-sm text-amber-400/70">{s.n}</span>
                  <h3 className="mt-3 text-lg font-bold text-amber-100">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-amber-100/60">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ===================== Contact ===================== */}
          <section
            id="contact"
            className="interactive mt-24 scroll-mt-24 overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-l from-amber-500/15 via-[#0d1224] to-[#0b0f1c] p-8 text-center sm:p-14"
          >
            <h2 className="text-3xl font-bold sm:text-4xl">
              واش عندك مناسبة؟ <span className="luxora-gold-text">نحن واجدين</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-amber-100/65">
              عرّفنا على المناسبة ديالك و غادي نرجعو ليك ف 24 ساعة بعرض كامل: الديكور، المائدة، و
              خدمة الأتاي.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="mailto:hello@luxora.ma"
                className="rounded-full bg-gradient-to-l from-amber-300 to-amber-500 px-7 py-3.5 text-sm font-bold text-[#1b1206] transition hover:brightness-110"
              >
                hello@luxora.ma
              </a>
              <a
                href="tel:+212600000000"
                className="rounded-full border border-amber-400/40 px-7 py-3.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/10"
              >
                +212 6 00 00 00 00
              </a>
            </div>
          </section>
        </main>

        {/* ===================== Footer ===================== */}
        <footer className="relative z-10 border-t border-amber-400/10">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-amber-100/45 sm:flex-row">
            <p>© {new Date().getFullYear()} LUXORA MA — صناعة مغربية أصيلة 360°.</p>
            <p className="flex items-center gap-3">
              <span>🍵 المؤشر: كاس أتاي بالنعناع</span>
              <span className="text-amber-400/40">|</span>
              <span>🐪 الجمل: كايتبع الماوس · كاينعس من بعد 7 ثواني</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
