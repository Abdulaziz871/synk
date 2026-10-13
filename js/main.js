/* سِنك — تفاعلات الصفحة */
(() => {
  'use strict';

  // لو عندك endpoint لاستقبال النموذج (Formspree / Google Apps Script / API) حطه هنا
  const FORM_ENDPOINT = '';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMQ = window.matchMedia('(max-width: 960px)');
  const arNum = new Intl.NumberFormat('ar-SA-u-nu-arab');
  const fmt = (n) => arNum.format(Math.round(n));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- شريط التنقل ---------- */
  const nav = $('#nav');
  const burger = $('.burger', nav);

  const closeMenu = () => {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'فتح القائمة');
  };
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'سكّر القائمة' : 'فتح القائمة');
  });
  $$('.nav-links a').forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  mobileMQ.addEventListener('change', closeMenu);

  // تمييز رابط القسم الحالي
  const navLinks = $$('.nav-links a[href^="#"]:not(.mobile-cta)');
  const linkFor = (id) => navLinks.find((a) => a.getAttribute('href') === '#' + id);
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const link = linkFor(en.target.id);
      if (!link) return;
      navLinks.forEach((a) => a.classList.toggle('active', a === link));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'services', 'process', 'why', 'faq'].forEach((id) => { const el = document.getElementById(id); if (el) sectionIO.observe(el); });

  /* ---------- الظهور عند التمرير ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach((el) => revealIO.observe(el));

  /* ---------- أداء: نوقف حركات SVG للأقسام اللي برا الشاشة ---------- */
  const animIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.target.classList.toggle('is-visible', en.isIntersecting));
  });
  $$('[data-anim]').forEach((el) => animIO.observe(el));

  /* ---------- حلقة تمرير واحدة (Navbar + خط الخطوات) ---------- */
  const stepsEl = $('.steps');
  let ticking = false;
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 24);
    if (stepsEl) {
      const r = stepsEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = reduceMotion ? 1 : clamp((vh * 0.85 - r.top) / (r.height * 0.75), 0, 1);
      stepsEl.style.setProperty('--progress', p.toFixed(3));
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- 【3】 قبل وبعد ---------- */
  const ba = $('.ba');
  if (ba) {
    const btns = $$('.ba-toggle button', ba);
    let touched = false;
    const setBA = (state) => {
      ba.classList.toggle('is-after', state === 'after');
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === state)));
    };
    btns.forEach((b) => b.addEventListener('click', () => { touched = true; setBA(b.dataset.state); }));

    // يتبدّل تلقائياً مرة وحدة لما يوصل المستخدم للقسم
    const baIO = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      baIO.disconnect();
      setTimeout(() => { if (!touched) setBA('after'); }, reduceMotion ? 300 : 1400);
    }, { threshold: 0.55 });
    baIO.observe($('.ba-board', ba));
  }

  /* ---------- 【4】 أزرار الخدمات تختار الخدمة في النموذج ---------- */
  const serviceSelect = $('#f-service');
  const msgField = $('#f-msg');
  $$('[data-service]').forEach((a) => a.addEventListener('click', () => {
    serviceSelect.value = a.dataset.service;
    serviceSelect.closest('.field').classList.remove('invalid');
    // الخدمات الإضافية: نكتب اسم الخدمة في الرسالة لو كانت فاضية
    if (a.dataset.detail && !msgField.value.trim()) {
      msgField.value = 'أبي أعرف أكثر عن: ' + a.dataset.detail + '\n';
      msgField.closest('.field').classList.remove('invalid');
    }
  }));

  /* ---------- 【5】 كيف نشتغل ---------- */
  const steps = $$('.step');
  if (steps.length) {
    let current = 0;
    let stopped = false;
    let timer = null;
    let inView = false;

    const activate = (i) => {
      current = i;
      steps.forEach((s, j) => {
        const on = j === i;
        s.classList.toggle('active', on);
        $('.step-head', s).setAttribute('aria-expanded', String(on));
      });
    };

    const stopAuto = () => { stopped = true; clearInterval(timer); timer = null; };
    const syncAuto = () => {
      const should = inView && !stopped && !reduceMotion && !mobileMQ.matches;
      if (should && !timer) timer = setInterval(() => activate((current + 1) % steps.length), 5000);
      if (!should && timer) { clearInterval(timer); timer = null; }
    };

    steps.forEach((s, i) => {
      $('.step-head', s).addEventListener('click', () => {
        stopAuto();
        // على الجوال: Accordion ينفتح ويتسكّر
        if (mobileMQ.matches && s.classList.contains('active')) {
          s.classList.remove('active');
          $('.step-head', s).setAttribute('aria-expanded', 'false');
          current = -1;
          return;
        }
        activate(i);
      });
      $$('[data-step-go]', s).forEach((b) => b.addEventListener('click', () => {
        stopAuto();
        const next = b.dataset.stepGo === 'next' ? i + 1 : i - 1;
        if (next >= 0 && next < steps.length) {
          activate(next);
          $('.step-head', steps[next]).focus({ preventScroll: true });
        }
      }));
    });

    // أسهم الكيبورد بين الخطوات
    $('.steps').addEventListener('keydown', (e) => {
      if (!e.target.classList.contains('step-head') || mobileMQ.matches) return;
      const idx = steps.indexOf(e.target.closest('.step'));
      let to = null;
      if (e.key === 'ArrowLeft') to = Math.min(idx + 1, steps.length - 1);
      if (e.key === 'ArrowRight') to = Math.max(idx - 1, 0);
      if (to === null) return;
      e.preventDefault(); stopAuto(); activate(to);
      $('.step-head', steps[to]).focus();
    });

    new IntersectionObserver(([en]) => { inView = en.isIntersecting; syncAuto(); }, { threshold: 0.35 })
      .observe($('.steps'));
    mobileMQ.addEventListener('change', () => {
      if (current < 0) activate(0);
      syncAuto();
    });
  }

  /* ---------- 【6】 حاسبة الوقت ---------- */
  const rEmp = $('#r-emp');
  const rHrs = $('#r-hrs');
  if (rEmp && rHrs) {
    const vEmp = $('#v-emp');
    const vHrs = $('#v-hrs');
    const outWeek = $('#out-week');
    const outYear = $('#out-year');
    const shown = { week: 50, year: 2400 };
    const anims = {};

    const countTo = (key, el, to) => {
      cancelAnimationFrame(anims[key]);
      const from = shown[key];
      if (reduceMotion || from === to) { shown[key] = to; el.textContent = fmt(to); return; }
      const start = performance.now();
      const dur = 650;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        shown[key] = from + (to - from) * e;
        el.textContent = fmt(shown[key]);
        if (t < 1) anims[key] = requestAnimationFrame(tick);
        else shown[key] = to;
      };
      anims[key] = requestAnimationFrame(tick);
    };

    const paint = (input) => {
      const p = ((input.value - input.min) / (input.max - input.min)) * 100;
      input.style.setProperty('--p', p + '%');
    };

    const update = () => {
      const emp = +rEmp.value;
      const hrs = +rHrs.value;
      vEmp.textContent = fmt(emp);
      vHrs.textContent = fmt(hrs);
      rEmp.setAttribute('aria-valuetext', fmt(emp) + ' موظف');
      rHrs.setAttribute('aria-valuetext', fmt(hrs) + ' ساعة');
      paint(rEmp); paint(rHrs);
      const week = emp * hrs;
      countTo('week', outWeek, week);
      countTo('year', outYear, week * 48);
    };
    rEmp.addEventListener('input', update);
    rHrs.addEventListener('input', update);
    update();
  }

  /* ---------- 【8】 الأسئلة الشائعة (وحدة مفتوحة بس) ---------- */
  const faqItems = $$('.faq-item');
  faqItems.forEach((item) => {
    $('.faq-q', item).addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      faqItems.forEach((it) => {
        const on = it === item && willOpen;
        it.classList.toggle('open', on);
        $('.faq-q', it).setAttribute('aria-expanded', String(on));
      });
    });
  });

  /* ---------- 【9】 نموذج التواصل ---------- */
  const form = $('#contact-form');
  if (form) {
    const card = form.closest('.form-card');
    const fields = $$('input, select, textarea', form);

    const check = (el) => {
      const ok = el.value.trim() !== '';
      const field = el.closest('.field');
      field.classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      const err = $('.err', field);
      if (!err.id) err.id = el.id + '-err';
      if (ok) el.removeAttribute('aria-describedby'); else el.setAttribute('aria-describedby', err.id);
      return ok;
    };

    fields.forEach((el) => {
      const evt = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(evt, () => { if (el.closest('.field').classList.contains('invalid')) check(el); });
      el.addEventListener('blur', () => { if (el.dataset.touched) check(el); });
      el.addEventListener('focus', () => { el.dataset.touched = '1'; });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bad = fields.filter((el) => !check(el));
      if (bad.length) { bad[0].focus(); return; }

      const btn = $('button[type="submit"]', form);
      btn.classList.add('loading');
      const fail = $('.form-fail', form);
      fail.hidden = true;
      try {
        if (FORM_ENDPOINT) {
          const res = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(form))),
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        }
      } catch (err) {
        console.error(err);
        btn.classList.remove('loading');
        fail.hidden = false;
        return;
      }
      btn.classList.remove('loading');
      card.classList.add('done');
      $('.form-success', card).focus({ preventScroll: true });
    });
  }
})();
