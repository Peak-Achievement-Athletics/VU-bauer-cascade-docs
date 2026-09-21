/* VU Customizers guide — theme toggle, scrollspy, heading permalinks, glossary filter. */
(function () {
  'use strict';

  /* ---- dark / light ---- */
  var K = 'vu-guide-theme';
  function set(t) {
    document.documentElement.setAttribute('data-theme', t);
    var b = document.getElementById('tt');
    if (b) { b.textContent = t === 'dark' ? 'Light' : 'Dark'; b.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' mode'); }
    try { localStorage.setItem(K, t); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem(K); } catch (e) {}
  set(saved || (window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'));
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#tt');
    if (b) set(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });


  /* ---- site navigation: one source of truth for all pages ---- */
  var NAV = [
    ['Overview', [
      ['index.html', 'Index'],
      ['glossary.html', 'Terms']
    ]],
    ['Bauer', [
      ['bauer.html', 'Architecture'],
      ['code-reference.html', 'Code reference', 'sub'],
      ['operations-guide.html', 'Operations'],
      ['sentry.html', 'Sentry'],
      ['restore.html', 'Restore selections']
    ]],
    ['Cascade', [
      ['cascade.html', 'Cascade']
    ]],
    ['Projects', [
      ['roadmap.html', 'Upcoming projects']
    ]],
    ['Reference', [
      ['troubleshooting.html', 'Troubleshooting'],
      ['dependencies.html', 'Dependencies']
    ]]
  ];

  var here = location.pathname.split('/').pop() || 'index.html';
  var wrap = document.querySelector('.wrap');

  if (wrap) {
    var aside = document.createElement('aside');
    aside.id = 'sitenav';
    aside.setAttribute('aria-label', 'Site navigation');

    var html = '<div class="navclose"><span>Contents</span>' +
               '<button type="button" id="navx" aria-label="Close navigation">&times;</button></div>';
    NAV.forEach(function (g) {
      html += '<div class="grp"><p class="lbl">' + g[0] + '</p>';
      g[1].forEach(function (it) {
        var on = it[0] === here;
        var cls = (it[2] === 'sub' ? 'sub' : '') + (on ? (it[2] === 'sub' ? ' here' : 'here') : '');
        cls = cls.trim();
        html += '<a href="./' + it[0] + '"' + (cls ? ' class="' + cls + '"' : '') +
                (on ? ' aria-current="page"' : '') + '>' + it[1] + '</a>';
      });
      html += '</div>';
    });
    aside.innerHTML = html;
    wrap.insertBefore(aside, wrap.firstChild);

    var scrim = document.createElement('div');
    scrim.id = 'navscrim';
    document.body.appendChild(scrim);

    var burger = document.createElement('button');
    burger.className = 'burger';
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Open navigation');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    var bar = document.querySelector('.top-in');
    if (bar) bar.insertBefore(burger, bar.firstChild);

    function setNav(open) {
      document.body.classList.toggle('navopen', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    burger.addEventListener('click', function () {
      setNav(!document.body.classList.contains('navopen'));
    });
    scrim.addEventListener('click', function () { setNav(false); });
    aside.addEventListener('click', function (e) {
      if (e.target.id === 'navx' || e.target.closest('#navx')) { setNav(false); return; }
      if (e.target.closest('a')) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('navopen')) {
        setNav(false); burger.focus();
      }
    });
  }

  /* ---- permalink on every headed section ---- */
  [].forEach.call(document.querySelectorAll('main h2[id], main h3[id]'), function (h) {
    var a = document.createElement('a');
    a.className = 'anchor';
    a.href = '#' + h.id;
    a.textContent = '#';
    a.setAttribute('aria-label', 'Link to this section');
    h.appendChild(a);
  });

  /* ---- sidebar highlights the section you are reading ---- */
  var links = [].slice.call(document.querySelectorAll('.toc-d a[href^="#"]'));
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var seen = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      var cur = null;
      for (var id in map) { if (seen[id]) { cur = id; break; } }
      if (cur) {
        links.forEach(function (a) { a.classList.remove('on'); });
        if (map[cur]) map[cur].classList.add('on');
      }
    }, { rootMargin: '-70px 0px -72% 0px' });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---- right rail follows main in the DOM so focus order matches visual order ---- */
  var rail = document.querySelector('.toc-d'), mainEl = document.querySelector('main');
  if (rail && mainEl && wrap && rail.compareDocumentPosition(mainEl) & Node.DOCUMENT_POSITION_FOLLOWING) {
    wrap.appendChild(rail);
  }

  /* ---- glossary: type to filter ---- */
  var box = document.getElementById('glfilter');
  if (box) {
    var terms = [].slice.call(document.querySelectorAll('.gl .term'));
    var groups = [].slice.call(document.querySelectorAll('.gl-group'));
    var count = document.getElementById('glcount');
    var none = document.getElementById('glnone');
    function run() {
      var q = box.value.trim().toLowerCase();
      var hits = 0;
      terms.forEach(function (t) {
        var on = !q || t.textContent.toLowerCase().indexOf(q) > -1;
        t.style.display = on ? '' : 'none';
        if (on) hits++;
      });
      groups.forEach(function (g) {
        var any = [].some.call(g.querySelectorAll('.term'), function (t) { return t.style.display !== 'none'; });
        g.style.display = any ? '' : 'none';
      });
      if (count) count.textContent = q ? hits + ' of ' + terms.length : terms.length + ' terms';
      if (none) none.style.display = hits ? 'none' : 'block';
    }
    box.addEventListener('input', run);
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { box.value = ''; run(); } });
    run();
  }
})();
