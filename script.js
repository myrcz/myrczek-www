// Wspólne skrypty strony myrczek.com (PL i EN)
  // Mobile menu
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileMenu.style.display = open ? 'flex' : 'none';
    requestAnimationFrame(() => { if (open) mobileMenu.classList.add('open'); });
    document.body.style.overflow = open ? 'hidden' : '';
  });
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.style.display = 'none';
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Gallery drag scroll
  const strip = document.getElementById('galleryStrip');
  let isDown = false, dragMoved = false, startX, scrollLeft;
  strip.addEventListener('mousedown', e => { isDown = true; dragMoved = false; strip.classList.add('active'); startX = e.pageX - strip.offsetLeft; scrollLeft = strip.scrollLeft; });
  strip.addEventListener('mouseleave', () => { isDown = false; });
  strip.addEventListener('mouseup', () => { isDown = false; });
  strip.addEventListener('mousemove', e => { if (!isDown) return; e.preventDefault(); dragMoved = true; const x = e.pageX - strip.offsetLeft; const walk = (x - startX) * 1.5; strip.scrollLeft = scrollLeft - walk; });

  // Lightbox
  const photos = Array.from(document.querySelectorAll('.gallery-item img')).map(i => i.getAttribute('src'));
  let currentIdx = 0;
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCounter = document.getElementById('lbCounter');

  function openLightbox(idx) {
    currentIdx = idx;
    lbImg.src = photos[idx];
    lbCounter.textContent = (idx + 1) + ' / ' + photos.length;
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
  }
  function navigate(dir) {
    currentIdx = (currentIdx + dir + photos.length) % photos.length;
    lbImg.src = photos[currentIdx];
    lbCounter.textContent = (currentIdx + 1) + ' / ' + photos.length;
  }

  document.querySelectorAll('.gallery-item').forEach((item, i) => {
    item.addEventListener('click', () => { if (!dragMoved) openLightbox(i); dragMoved = false; });
  });
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbPrev').addEventListener('click', () => navigate(-1));
  document.getElementById('lbNext').addEventListener('click', () => navigate(1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  // Nav scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.12 });
  reveals.forEach(el => observer.observe(el));

  // Album covers via Spotify oEmbed
  const albums = [
    { id: 'cover-1', spotifyUrl: 'https://open.spotify.com/album/1Q1IlOzLosQtui8Yl2ic03' },
    { id: 'cover-2', spotifyUrl: 'https://open.spotify.com/album/4rGHpMm7eetsK0WCP9mJiZ' },
  ];
  albums.forEach(({ id, spotifyUrl }) => {
    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`)
      .then(r => r.json())
      .then(data => {
        const img = document.getElementById(id);
        if (img && data.thumbnail_url) { img.src = data.thumbnail_url; }
      })
      .catch(() => {});
  });

// ===== KONCERTY (kalendarz Google „KONCERTY PUBLICZNE”) =====
(function () {
  // ============ USTAWIENIA ============
  // Klucz API z Google Cloud (ograniczony do myrczek.com i do Google Calendar API)
  var API_KEY = 'AIzaSyB_eiR59HJtY74v6RQnA_Lgw8NalsQwDng';
  var CALENDAR_ID = 'ce738138ab9576f222a610dd684a39f2cf4f4e21b5fc6b4bd35888a1f10fd266@group.calendar.google.com';
  var VISIBLE = 6;      // ile koncertów widać od razu
  var MAX_EVENTS = 30;  // ile maksymalnie pobrać
  // ====================================

  var params = new URLSearchParams(location.search);
  // Na stronie EN: document.documentElement.lang === 'en' wystarczy (jest w myrczek_en.html)
  var LANG = params.get('lang') === 'en' || document.documentElement.lang === 'en' ? 'en' : 'pl';
  var DEMO = params.has('demo') || API_KEY.indexOf('WKLEJ') === 0;
  var CACHE_KEY = 'myrczek_koncerty_v2';

  var T = {
    pl: { label: 'Koncerty', title: 'Najbliższe <em>koncerty</em>', loading: 'Wczytywanie…',
          tickets: 'Bilety', free: 'Wstęp wolny', info: 'Organizator', map: 'mapa', more: 'Wszystkie terminy',
          empty: 'Nowe terminy wkrótce. Zaproszenia i booking: <a href="mailto:myrczek.office@gmail.com">myrczek.office@gmail.com</a>',
          locale: 'pl-PL' },
    en: { label: 'Concerts', title: 'Upcoming <em>concerts</em>', loading: 'Loading…',
          tickets: 'Tickets', free: 'Free entry', info: 'Organiser', map: 'map', more: 'All dates',
          empty: 'New dates coming soon. Booking: <a href="mailto:myrczek.office@gmail.com">myrczek.office@gmail.com</a>',
          locale: 'en-GB' }
  }[LANG];

  document.querySelectorAll('#concerts [data-i18n]').forEach(function (e) { e.textContent = T[e.dataset.i18n]; });
  document.querySelectorAll('#concerts [data-i18n-html]').forEach(function (e) { e.innerHTML = T[e.dataset.i18nHtml]; });

  var box = document.getElementById('gigs');
  var srcInfo = document.getElementById('srcInfo');
  function setInfo(t) { if (srcInfo) srcInfo.textContent = t; }

  // ---------- przetwarzanie wydarzeń z Google ----------

  // Opis z Google bywa w HTML — zamiana na czysty tekst (bez wykonywania kodu)
  function descToText(html) {
    if (!html) return '';
    var doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    doc.querySelectorAll('a[href]').forEach(function (a) { a.replaceWith(doc.createTextNode(a.getAttribute('href'))); });
    doc.querySelectorAll('br').forEach(function (b) { b.replaceWith(doc.createTextNode('\n')); });
    doc.querySelectorAll('p,div,li').forEach(function (b) { b.appendChild(doc.createTextNode('\n')); });
    return (doc.body.textContent || '')
      .replace(/ /g, ' ')
      .replace(/https:\/\/www\.google\.com\/url\?q=([^&\s]+)\S*/g, function (m, u) {
        try { return decodeURIComponent(u); } catch (e) { return u; }
      });
  }

  // Linie „WWW…:” z opisu → nadpisania
  function wwwLines(text) {
    var map = { '': 'title', en: 'title_en', miejsce: 'place', place: 'place',
                godzina: 'time', time: 'time', bilety: 'tickets', tickets: 'tickets',
                organizator: 'info', organizer: 'info', info: 'info' };
    var out = {};
    text.split('\n').forEach(function (l) {
      var m = l.match(/^\s*WWW(?:\s+(EN|miejsce|place|godzina|time|bilety|tickets|organizator|organizer|info))?\s*:\s*(.+?)\s*$/i);
      if (m) { var k = map[(m[1] || '').toLowerCase()]; if (!(k in out)) out[k] = m[2]; }
    });
    return out;
  }

  function warsawParts(iso) {
    var f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    var p = {}; f.formatToParts(new Date(iso)).forEach(function (x) { p[x.type] = x.value; });
    return { date: p.year + '-' + p.month + '-' + p.day, time: p.hour + ':' + p.minute };
  }

  function clip(s) { return String(s).replace(/\s+/g, ' ').trim().slice(0, 140); }

  function toPublic(ev) {
    var summary = (ev.summary || '').trim();
    var desc = descToText(ev.description);
    var www = wwwLines(desc);
    if (!summary || ev.status === 'cancelled' || /^\s*(\?|ODWO[ŁL]ANY)/i.test(summary)) return null;
    if (www.title && www.title.toLowerCase() === 'ukryj') return null;

    var date, time = '';
    if (ev.start && ev.start.date) { date = ev.start.date; }
    else if (ev.start && ev.start.dateTime) { var w = warsawParts(ev.start.dateTime); date = w.date; time = w.time; }
    else return null;
    var tm = www.time && www.time.match(/^(\d{1,2})[:.](\d{2})$/);
    if (tm) time = ('0' + tm[1]).slice(-2) + ':' + tm[2];

    var location = (ev.location || '').replace(/\n/g, ', ').replace(/,?\s*(Polska|Poland)\s*$/i, '').trim();
    // Mapa tylko dla wydarzeń otwartych i tylko przy pełnym adresie (z numerem budynku)
    var closed = /zamkni[eę]t|private event/i.test(summary + ' ' + (www.title || ''));
    var mapOk = !closed && /\d/.test(location);
    var tickets = null;
    if (www.tickets && /^https?:\/\/\S+$/i.test(www.tickets)) tickets = www.tickets;
    // „WWW bilety: wstęp wolny” (także: wolny, bezpłatny, free) → napis zamiast przycisku
    var free = !tickets && !!www.tickets && /wolny|bezp[łl]atn|free/i.test(www.tickets);

    return {
      date: date, time: time,
      title: clip(www.title || summary),
      title_en: www.title_en ? clip(www.title_en) : null,
      place: www.place ? clip(www.place) : (location ? clip(location) : null),
      map: mapOk ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location) : null,
      tickets: tickets,
      free: free,
      info: (www.info && /^https?:\/\/\S+$/i.test(www.info)) ? www.info : null
    };
  }

  // ---------- wyświetlanie ----------

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : null; }

  function render(events) {
    var today = warsawParts(new Date().toISOString()).date;
    events = events.filter(function (g) { return g.date >= today; });
    box.innerHTML = '';
    if (!events.length) { var p = el('p', 'gig-empty'); p.innerHTML = T.empty; box.appendChild(p); return; }

    var month = new Intl.DateTimeFormat(T.locale, { month: 'short' });
    var weekday = new Intl.DateTimeFormat(T.locale, { weekday: 'long' });
    var thisYear = today.slice(0, 4);
    var ul = el('ul', 'gig-list');

    events.forEach(function (g, i) {
      var p = g.date.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2], 12);
      var li = el('li', 'gig');
      if (i >= VISIBLE) li.hidden = true;

      var dateBox = el('div', 'gig-date');
      dateBox.appendChild(el('div', 'gig-day', String(d.getDate())));
      dateBox.appendChild(el('div', 'gig-month', month.format(d).replace('.', '')));
      if (p[0] !== thisYear) dateBox.appendChild(el('div', 'gig-year', p[0]));

      var info = el('div');
      info.appendChild(el('div', 'gig-title', (LANG === 'en' && g.title_en) ? g.title_en : g.title));
      var meta = el('div', 'gig-meta');
      var bits = [weekday.format(d) + (g.time ? ', ' + g.time : '')];
      if (g.place) bits.push(g.place);
      bits.forEach(function (b, k) {
        if (k) meta.appendChild(el('span', 'sep', '·'));
        meta.appendChild(document.createTextNode(b));
      });
      if (safeUrl(g.map)) {
        meta.appendChild(el('span', 'sep', '·'));
        var m = el('a', null, T.map); m.href = g.map; m.target = '_blank'; m.rel = 'noopener';
        meta.appendChild(m);
      }
      info.appendChild(meta);

      var actions = el('div', 'gig-actions');
      if (safeUrl(g.tickets)) {
        var a = el('a', 'gig-btn', T.tickets); a.href = g.tickets; a.target = '_blank'; a.rel = 'noopener';
        actions.appendChild(a);
      } else if (g.free) {
        actions.appendChild(el('span', 'gig-free', T.free));
      }
      if (safeUrl(g.info) && g.info !== g.tickets) {
        var o = el('a', 'gig-btn gig-btn-ghost', T.info); o.href = g.info; o.target = '_blank'; o.rel = 'noopener';
        actions.appendChild(o);
      }

      li.appendChild(dateBox); li.appendChild(info); li.appendChild(actions);
      ul.appendChild(li);
    });
    box.appendChild(ul);

    if (events.length > VISIBLE) {
      var btn = el('button', 'gig-more', T.more);
      btn.addEventListener('click', function () {
        ul.querySelectorAll('.gig[hidden]').forEach(function (x) { x.hidden = false; });
        btn.remove();
      });
      box.appendChild(btn);
    }
  }

  // ---------- kopia awaryjna w przeglądarce ----------
  function saveCopy(events) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(events)); } catch (e) {} }
  function loadCopy() { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch (e) { return null; } }

  // ---------- start ----------
  if (DEMO) {
    setInfo('demo' + (API_KEY.indexOf('WKLEJ') === 0 ? ' (brak klucza API)' : ''));
    var dd = function (n) { var x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
    render([
      { date: dd(5), time: '19:00', title: 'Starsi Panowie', title_en: 'Starsi Panowie — songs of Przybora & Wasowski', place: 'Elektrownia, Radom', map: 'https://www.google.com/maps/search/?api=1&query=Elektrownia%20Radom', tickets: 'https://example.com' },
      { date: dd(12), time: '', title: 'Młynarski. Bynajmniej.', title_en: null, place: 'Teatr Ziemi Rybnickiej, Rybnik', map: 'https://www.google.com/maps/search/?api=1&query=Teatr%20Ziemi%20Rybnickiej', tickets: null, free: true },
      { date: dd(30), time: '20:00', title: 'Big Band Akademii Muzycznej', title_en: 'Lodz Academy of Music Big Band', place: 'Sala Koncertowa AM, Łódź', map: null, tickets: 'https://example.com' },
      { date: dd(48), time: '17:00', title: 'Koncert świąteczny', title_en: 'Christmas concert', place: 'Teatr Capitol, Warszawa', map: null, tickets: null }
    ]);
    return;
  }

  // dzień wstecz, żeby trwające/dzisiejsze koncerty też były widoczne
  var timeMin = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  var url = 'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(CALENDAR_ID) + '/events'
    + '?key=' + encodeURIComponent(API_KEY)
    + '&singleEvents=true&orderBy=startTime&maxResults=' + MAX_EVENTS
    + '&timeMin=' + encodeURIComponent(timeMin)
    + '&fields=' + encodeURIComponent('items(summary,description,location,start,status)');

  fetch(url)
    .then(function (r) {
      if (r.ok) return r.json();
      return r.json().catch(function () { return {}; }).then(function (j) {
        var why = j && j.error && (j.error.message || j.error.status);
        throw new Error('HTTP ' + r.status + (why ? ': ' + why : ''));
      });
    })
    .then(function (data) {
      var events = (data.items || []).map(toPublic).filter(Boolean);
      saveCopy(events);
      setInfo('Google · ' + events.length + ' wyd.');
      render(events);
    })
    .catch(function (err) {
      var copy = loadCopy();
      setInfo('błąd (' + err.message + ')' + (copy ? ' — pokazuję ostatnią kopię' : ''));
      render(copy || []);
    });
})();
