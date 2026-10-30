/* 60-Day Quran Khatm: plan, progress, mushaf reader and verse-by-verse audio player. */
(function () {
  'use strict';

  // ---------- Plan: 60 days, day 2j-1 and 2j are the two halves of juz j (604-page Madani mushaf) ----------
  const days = [];
  for (let j = 1; j <= 30; j++) {
    const s = j === 1 ? 1 : 2 + 20 * (j - 1);
    const e = j === 30 ? 604 : 1 + 20 * j;
    const mid = j === 1 ? 11 : (j === 30 ? 593 : s + 9);
    [[s, mid], [mid + 1, e]].forEach((r, h) => {
      const n = r[1] - r[0] + 1, a = Math.ceil(n / 2);
      days.push({ juz: j, half: h + 1, from: r[0], to: r[1], n, s1: [r[0], r[0] + a - 1], s2: [r[0] + a, r[1]] });
    });
  }
  days.forEach((d, i) => {
    d.day = i + 1;
    const hue = Math.round((i * 137.508) % 360);
    d.color = `hsl(${hue},58%,42%)`;
    d.tint = `hsl(${hue},70%,96%)`;
  });
  const SIT_TIME = { 1: '1:00 PM', 2: '6:30 PM' };
  const rangeOf = (d, s) => (s === 1 ? d.s1 : d.s2);
  const pr = r => (r[0] === r[1] ? 'p. ' + r[0] : 'pp. ' + r[0] + '–' + r[1]);
  const key = (d, s) => d.day + '-' + s;
  const $ = id => document.getElementById(id);

  // ---------- Reciters (Al Quran Cloud verse-by-verse audio editions) ----------
  const RECITERS = [
    ['ar.alafasy', 'Mishary Rashid Alafasy'],
    ['ar.abdulbasitmurattal', 'Abdul Basit Abdus-Samad (Murattal)'],
    ['ar.abdurrahmaansudais', 'Abdur-Rahman As-Sudais'],
    ['ar.saoodshuraym', "Sa'ud Ash-Shuraym"],
    ['ar.mahermuaiqly', 'Maher Al-Muaiqly'],
    ['ar.husary', 'Mahmoud Khalil Al-Husary'],
    ['ar.husarymujawwad', 'Al-Husary (Mujawwad)'],
    ['ar.minshawi', 'Mohamed Siddiq Al-Minshawi'],
    ['ar.minshawimujawwad', 'Al-Minshawi (Mujawwad)'],
    ['ar.hudhaify', 'Ali Al-Hudhaify'],
    ['ar.shaatree', 'Abu Bakr Ash-Shatri'],
    ['ar.ahmedajamy', 'Ahmed ibn Ali Al-Ajamy'],
    ['ar.muhammadayyoub', 'Muhammad Ayyoub'],
    ['ar.muhammadjibreel', 'Muhammad Jibreel'],
    ['ar.hanirifai', 'Hani Ar-Rifai'],
    ['ar.abdullahbasfar', 'Abdullah Basfar'],
    ['ar.ibrahimakhbar', 'Ibrahim Al-Akhdar'],
    ['ar.aymanswoaid', 'Ayman Sowaid']
  ];
  const API = 'https://api.alquran.cloud/v1';

  // ---------- State ----------
  const LS = 'khatm60-state-v1';
  const state = { done: {}, reciter: 'ar.alafasy', speed: 1, follow: true, basmala: true };
  try { Object.assign(state, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) {}
  if (!state.done || typeof state.done !== 'object') state.done = {};
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} };

  function toast(msg, ms) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms || 2600);
  }

  // ---------- Home screen ----------
  let filter = 'all';
  function nextSitting() {
    for (const d of days) for (const s of [1, 2]) if (!state.done[key(d, s)]) return { d, s };
    return null;
  }
  function chips(d, s) {
    const r = rangeOf(d, s);
    let h = '<div class="chips">';
    h += `<button class="play" data-open="${d.day}" data-s="${s}" data-autoplay="1" style="background:${d.color}" aria-label="Listen to sitting ${s}">▶</button>`;
    for (let p = r[0]; p <= r[1]; p++) h += `<button data-open="${d.day}" data-s="${s}" data-p="${p}" style="background:${d.color}" aria-label="Open page ${p}">${p}</button>`;
    return h + '</div>';
  }
  function render() {
    const list = $('list'); list.innerHTML = '';
    let pages = 0, complete = 0;
    const nx = nextSitting();
    days.forEach(d => {
      const a = !!state.done[key(d, 1)], b = !!state.done[key(d, 2)];
      if (a) pages += d.s1[1] - d.s1[0] + 1;
      if (b) pages += d.s2[1] - d.s2[0] + 1;
      if (a && b) complete++;
      if (filter === 'todo' && a && b) return;
      if (filter === 'done' && !(a && b)) return;
      const el = document.createElement('div');
      el.className = 'day' + (a && b ? ' complete' : '') + (nx && nx.d === d ? ' is-next' : '');
      el.id = 'day-' + d.day;
      el.innerHTML =
        `<div class="num" style="background:${d.color}"><small>DAY</small>${d.day}</div>` +
        `<div class="body" style="background:${d.tint}">` +
          `<div class="top"><span class="dname">Day ${d.day}</span><span class="meta">Juz ${d.juz} · ${d.half === 1 ? '1st' : '2nd'} half · Hizb ${d.day}</span></div>` +
          `<div class="pages"><b>${pr([d.from, d.to])}</b> · ${d.n} pages</div>` +
          '<div class="sess">' + [1, 2].map(s => {
            const done = s === 1 ? a : b;
            return `<div class="col"><label class="${done ? 'done' : ''}"><input type="checkbox" data-k="${key(d, s)}" ${done ? 'checked' : ''}><span class="t">Sitting ${s} · ${pr(rangeOf(d, s))}<small>${SIT_TIME[s]}</small></span></label>${chips(d, s)}</div>`;
          }).join('') + '</div>' +
        '</div>';
      list.appendChild(el);
    });
    $('sPages').textContent = pages;
    $('sDays').textContent = complete + ' / 60';
    $('sPct').textContent = Math.round(pages / 604 * 100) + '%';
    $('bar').style.width = (pages / 604 * 100) + '%';

    const box = $('nextBox');
    if (!nx) {
      box.innerHTML = '<div class="big">Khatm complete. Alhamdulillah! 🌙</div>May Allah accept it from you.<div class="btnrow"><button class="btn ghost" id="again">Start a new khatm</button></div>';
      $('again').onclick = () => { if (askReset()) render(); };
    } else {
      const r = rangeOf(nx.d, nx.s);
      box.innerHTML = `<span class="meta">Next up</span><div class="big">Day ${nx.d.day} · Sitting ${nx.s}</div>Juz ${nx.d.juz} · ${pr(r)} · ${SIT_TIME[nx.s]}` +
        `<div class="btnrow"><button class="btn" style="background:${nx.d.color}" data-open="${nx.d.day}" data-s="${nx.s}">📖 Read</button>` +
        `<button class="btn" style="background:${nx.d.color}" data-open="${nx.d.day}" data-s="${nx.s}" data-autoplay="1">🎧 Read &amp; listen</button></div>`;
    }
  }
  function askReset() {
    const ok = window.confirm('Clear all ticks and start again from Day 1?');
    if (ok) { state.done = {}; save(); }
    return ok;
  }

  // ---------- Settings ----------
  function fillReciters(list) {
    [$('setReciter'), $('pReciter')].forEach(sel => {
      sel.innerHTML = list.map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
      sel.value = state.reciter;
      if (sel.value !== state.reciter) { sel.value = list[0][0]; }
    });
  }
  fillReciters(RECITERS);
  // Add any further Arabic reciters the API offers.
  fetch(API + '/edition/format/audio').then(r => r.json()).then(j => {
    if (!j || !Array.isArray(j.data)) return;
    const known = new Set(RECITERS.map(r => r[0]));
    const extra = j.data.filter(e => e.language === 'ar' && e.type === 'versebyverse' && !known.has(e.identifier))
      .map(e => [e.identifier, e.englishName || e.identifier]);
    if (extra.length) fillReciters(RECITERS.concat(extra.sort((a, b) => a[1].localeCompare(b[1]))));
  }).catch(() => {});

  $('setSpeed').value = String(state.speed);
  $('setFollow').checked = !!state.follow;
  $('setBasmala').checked = !!state.basmala;
  $('setReciter').onchange = e => { state.reciter = e.target.value; $('pReciter').value = state.reciter; save(); };
  $('setSpeed').onchange = e => { state.speed = +e.target.value; save(); applySpeed(); };
  $('setFollow').onchange = e => { state.follow = e.target.checked; save(); };
  $('setBasmala').onchange = e => { state.basmala = e.target.checked; save(); };
  $('resetBtn').onclick = () => { if (askReset()) { render(); toast('Progress cleared.'); } };

  // ---------- Reader ----------
  const reader = $('reader'), rbody = $('rbody');
  let cur = null; // {d, s, r}

  function openReader(dayNum, s, page, autoplay) {
    const d = days[dayNum - 1], r = rangeOf(d, s);
    if (cur && (cur.d !== d || cur.s !== s)) stopAudio(true);
    cur = { d, s, r };
    $('rhead').style.background = d.color;
    document.documentElement.style.setProperty('--pc', d.color);
    $('pPlay').style.background = d.color;
    $('rTitle').textContent = `Day ${d.day} · Sitting ${s} (${SIT_TIME[s]})`;
    $('rSub').textContent = `Juz ${d.juz} · ${pr(r)}`;
    const src = `s/${String(d.day).padStart(2, '0')}-${s}.webp`, n = r[1] - r[0] + 1;
    let h = '';
    for (let p = r[0]; p <= r[1]; p++) {
      const i = p - r[0], pos = n > 1 ? (i / (n - 1) * 100) : 0;
      h += `<div class="pg" id="pg-${p}"><div class="lbl"><span>Page ${p}</span><button data-playfrom="${p}">▶ Listen from here</button></div>` +
        `<div class="img" role="img" aria-label="Quran page ${p}" style="background-image:url(${src});background-size:100% ${n * 100}%;background-position:0 ${pos}%"></div></div>`;
    }
    const done = !!state.done[key(d, s)];
    const nextTxt = s === 1 ? `Sitting 2 (${SIT_TIME[2]}): ${pr(d.s2)}.` : (d.day < 60 ? `Next: Day ${d.day + 1}, ${pr([days[d.day].from, days[d.day].to])}.` : 'This completes the khatm, in shaa Allah.');
    h += `<div class="rfoot"><button class="btn" id="rDone" style="background:${d.color}">${done ? '✓ Already done · close' : '✓ Mark sitting ' + s + ' done'}</button><p>${nextTxt}</p></div>`;
    rbody.innerHTML = h;
    reader.classList.add('open'); document.body.classList.add('reading');
    rbody.scrollTop = 0;
    if (page && page !== r[0]) setTimeout(() => scrollToPage(page, false), 30);
    $('pReciter').value = state.reciter;
    updatePlayerUI();
    if (autoplay) startPlayback(page || r[0]);
  }
  function closeReader() {
    stopAudio(true);
    reader.classList.remove('open'); document.body.classList.remove('reading');
    rbody.innerHTML = ''; cur = null;
  }
  function scrollToPage(p, smooth) {
    const el = $('pg-' + p); if (!el) return;
    rbody.scrollTo({ top: el.offsetTop - rbody.offsetTop - 6, behavior: smooth ? 'smooth' : 'auto' });
  }
  $('rClose').onclick = closeReader;
  document.addEventListener('keydown', e => {
    if (!cur) return;
    if (e.key === 'Escape') closeReader();
    if (e.key === ' ' && e.target === document.body) { e.preventDefault(); togglePlay(); }
  });
  rbody.addEventListener('click', e => {
    const pf = e.target.closest('[data-playfrom]');
    if (pf) { startPlayback(+pf.dataset.playfrom); return; }
    if (e.target.id === 'rDone' && cur) {
      state.done[key(cur.d, cur.s)] = true; save();
      const dn = cur.d.day; closeReader(); render();
      const el = $('day-' + dn); if (el) el.scrollIntoView({ block: 'center' });
      toast('Sitting marked done. MashaAllah! ✓');
    }
  });

  // ---------- Audio engine ----------
  const audio = $('audio'), pre = $('preload');
  const pageCache = new Map(); // `${edition}:${page}` -> ayahs[]
  let queue = [], qi = -1, playing = false, loadToken = 0, repeatN = 1, repeatLeft = 0, basmalaUrl = {};

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    if (j.code !== 200) throw new Error(j.status || 'API error');
    return j.data;
  }
  async function getPage(edition, p) {
    const k = edition + ':' + p;
    if (pageCache.has(k)) return pageCache.get(k);
    const data = await fetchJSON(`${API}/page/${p}/${edition}`);
    const ayahs = (data.ayahs || []).map(a => ({
      number: a.number, page: a.page || p, n: a.numberInSurah,
      surah: a.surah ? a.surah.number : 0, sname: a.surah ? a.surah.englishName : '',
      urls: [a.audio].concat(a.audioSecondary || []).filter(Boolean)
    }));
    pageCache.set(k, ayahs);
    return ayahs;
  }
  async function getBasmala(edition) {
    if (basmalaUrl[edition]) return basmalaUrl[edition];
    const a = await fetchJSON(`${API}/ayah/1/${edition}`);
    basmalaUrl[edition] = [a.audio].concat(a.audioSecondary || []).filter(Boolean);
    return basmalaUrl[edition];
  }
  async function buildQueue(edition, r) {
    const pages = [];
    for (let p = r[0]; p <= r[1]; p++) pages.push(p);
    const lists = await Promise.all(pages.map(p => getPage(edition, p)));
    const q = [];
    let bas = null;
    for (const list of lists) for (const a of list) {
      if (state.basmala && a.n === 1 && a.surah !== 1 && a.surah !== 9) {
        try { bas = bas || await getBasmala(edition); q.push({ basmala: true, page: a.page, surah: a.surah, sname: a.sname, n: 0, urls: bas }); } catch (e) {}
      }
      q.push(a);
    }
    return q;
  }

  async function startPlayback(fromPage, keepIndexOfAyah) {
    if (!cur) return;
    const token = ++loadToken;
    const edition = state.reciter;
    setStatus('Loading recitation…', reciterName(edition));
    $('pPlay').textContent = '⏳';
    try {
      const q = await buildQueue(edition, cur.r);
      if (token !== loadToken) return;
      if (!q.length) throw new Error('No verses');
      queue = q;
      let idx = 0;
      if (keepIndexOfAyah) {
        const k = queue.findIndex(x => !x.basmala && x.number === keepIndexOfAyah);
        if (k >= 0) idx = k;
      } else if (fromPage) {
        const k = queue.findIndex(x => x.page >= fromPage);
        if (k >= 0) idx = k;
      }
      playIndex(idx);
    } catch (err) {
      if (token !== loadToken) return;
      $('pPlay').textContent = '▶';
      setStatus("Couldn't load the recitation", 'Check your internet connection and try again.');
      toast("Couldn't reach the recitation server. Check your connection.");
    }
  }

  function playIndex(i, urlTry) {
    if (i < 0 || i >= queue.length) { finishSitting(); return; }
    qi = i; urlTry = urlTry || 0;
    const item = queue[i];
    if (urlTry === 0) repeatLeft = item.basmala ? 0 : repeatN - 1;
    audio.src = item.urls[urlTry];
    audio.playbackRate = state.speed;
    audio.play().then(() => { playing = true; updatePlayerUI(); }).catch(err => {
      if (err && err.name === 'NotAllowedError') { playing = false; updatePlayerUI(); setStatus('Tap ▶ to start', describe(item)); }
    });
    audio.dataset.try = urlTry;
    // follow along
    document.querySelectorAll('.pg.playing').forEach(el => el.classList.remove('playing'));
    const pgEl = $('pg-' + item.page);
    if (pgEl) pgEl.classList.add('playing');
    const prev = queue[i - 1];
    if (state.follow && (!prev || prev.page !== item.page)) scrollToPage(item.page, true);
    // preload next verse
    const nx = queue[i + 1];
    if (nx) { pre.src = nx.urls[0]; try { pre.load(); } catch (e) {} }
    updatePlayerUI();
    updateMediaSession(item);
  }

  audio.addEventListener('ended', () => {
    if (repeatLeft > 0) { repeatLeft--; audio.currentTime = 0; audio.play(); return; }
    playIndex(qi + 1);
  });
  audio.addEventListener('error', () => {
    if (qi < 0 || !queue[qi] || !audio.getAttribute('src')) return;
    const t = (+audio.dataset.try || 0) + 1;
    if (t < queue[qi].urls.length) { playIndex(qi, t); return; }
    toast('This verse could not be played. Skipping…');
    setTimeout(() => playIndex(qi + 1), 600);
  });
  audio.addEventListener('pause', () => { playing = false; updatePlayerUI(); });
  audio.addEventListener('play', () => { playing = true; updatePlayerUI(); });

  function finishSitting() {
    playing = false; qi = -1;
    audio.removeAttribute('src');
    document.querySelectorAll('.pg.playing').forEach(el => el.classList.remove('playing'));
    updatePlayerUI();
    setStatus('Recitation finished ✓', 'Tap “Mark sitting done” below.');
    const done = $('rDone'); if (done) done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function stopAudio(clear) {
    loadToken++;
    try { audio.pause(); } catch (e) {}
    if (clear) { audio.removeAttribute('src'); queue = []; qi = -1; }
    playing = false; updatePlayerUI();
  }
  function togglePlay() {
    if (!cur) return;
    if (qi >= 0 && audio.getAttribute('src')) {
      if (audio.paused) { audio.playbackRate = state.speed; audio.play(); } else audio.pause();
    } else {
      startPlayback(firstVisiblePage());
    }
  }
  function firstVisiblePage() {
    if (!cur) return null;
    const top = rbody.scrollTop + 10;
    let best = cur.r[0];
    for (let p = cur.r[0]; p <= cur.r[1]; p++) { const el = $('pg-' + p); if (el && el.offsetTop - rbody.offsetTop <= top + 200) best = p; }
    return best;
  }
  function applySpeed() { audio.playbackRate = state.speed; $('pSpeed').textContent = state.speed + '×'; $('setSpeed').value = String(state.speed); }

  const reciterName = id => { const o = $('pReciter').querySelector(`option[value="${CSS.escape(id)}"]`); return o ? o.textContent : id; };
  const describe = it => it.basmala ? `Bismillah · ${it.sname}` : `${it.sname} ${it.surah}:${it.n}`;
  function setStatus(main, sub) { $('pStat').querySelector('b').textContent = main; $('pSub').textContent = sub || ' '; }

  function updatePlayerUI() {
    $('pPlay').textContent = playing ? '⏸' : '▶';
    $('pPlay').setAttribute('aria-label', playing ? 'Pause' : 'Play');
    applySpeed();
    $('pRepeat').textContent = '🔁 ' + repeatN;
    $('pRepeat').classList.toggle('on', repeatN > 1);
    if (qi >= 0 && queue[qi]) {
      const it = queue[qi];
      setStatus(describe(it), reciterName(state.reciter));
      const verses = queue.filter(x => !x.basmala).length;
      const pos = queue.slice(0, qi + 1).filter(x => !x.basmala).length;
      $('pCount').textContent = `${pos} / ${verses}`;
      $('pPage').textContent = 'Page ' + it.page;
    } else {
      $('pCount').textContent = ' '; $('pPage').textContent = ' ';
      if (!$('pStat').querySelector('b').textContent || $('pStat').querySelector('b').textContent === ' ') setStatus('Press ▶ to listen', reciterName(state.reciter));
    }
  }

  $('pPlay').onclick = togglePlay;
  $('pNext').onclick = () => { if (qi >= 0) playIndex(Math.min(qi + 1, queue.length)); };
  $('pPrev').onclick = () => {
    if (qi < 0) return;
    if (audio.currentTime > 2) { audio.currentTime = 0; return; }
    playIndex(Math.max(0, qi - 1));
  };
  $('pSpeed').onclick = () => {
    const opts = [0.75, 1, 1.25, 1.5];
    state.speed = opts[(opts.indexOf(state.speed) + 1) % opts.length] || 1; save(); applySpeed();
  };
  $('pRepeat').onclick = () => {
    const opts = [1, 2, 3, 5];
    repeatN = opts[(opts.indexOf(repeatN) + 1) % opts.length]; repeatLeft = repeatN - 1;
    updatePlayerUI(); toast(repeatN > 1 ? `Each verse will play ${repeatN} times` : 'Repeat off');
  };
  $('pReciter').onchange = e => {
    state.reciter = e.target.value; $('setReciter').value = state.reciter; save();
    if (qi >= 0 && queue[qi]) {
      const it = queue[qi]; const ayah = it.basmala ? (queue[qi + 1] && queue[qi + 1].number) : it.number;
      audio.pause(); startPlayback(null, ayah);
    } else updatePlayerUI();
  };

  function updateMediaSession(item) {
    if (!('mediaSession' in navigator) || !cur) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: describe(item), artist: reciterName(state.reciter),
        album: `Day ${cur.d.day} · Sitting ${cur.s} · Page ${item.page}`,
        artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => $('pNext').click());
      navigator.mediaSession.setActionHandler('previoustrack', () => playIndex(Math.max(0, qi - 1)));
    } catch (e) {}
  }

  // ---------- Global clicks / list ----------
  document.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('[data-open]'); if (!b) return;
    openReader(+b.dataset.open, +b.dataset.s, b.dataset.p ? +b.dataset.p : null, !!b.dataset.autoplay);
  });
  $('list').addEventListener('change', ev => {
    const t = ev.target; if (!t.dataset || !t.dataset.k) return;
    if (t.checked) state.done[t.dataset.k] = true; else delete state.done[t.dataset.k];
    save(); render();
  });
  $('filters').addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    filter = b.dataset.f;
    $('filters').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    render();
  });

  // ---------- Install prompt ----------
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    $('installCard').style.display = 'block';
    $('installText').textContent = 'Add Khatm 60 to your home screen so it opens like an app, full screen, and works offline.';
    $('installBtn').hidden = false;
  });
  $('installBtn').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('installCard').style.display = 'none'; };
  if (!standalone && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
    $('installCard').style.display = 'block';
    $('installText').innerHTML = 'In Safari, tap the <b>Share</b> button, then <b>Add to Home Screen</b>. It will open like an app.';
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  render();
})();
