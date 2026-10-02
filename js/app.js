/**
 * 予約フォームの画面の動き
 *  ① 台数とオプションを＋−で選ぶ → 概算金額をその場で出す
 *  ② 予約情報の入力チェック → 受付GASへ送信 → 確認メールはGASが送る
 */
(function () {
  'use strict';
  const C = window.BOOKING_CONFIG;
  const P = window.Price;
  const $ = (id) => document.getElementById(id);
  const f = $('f');
  const yen = (n) => n.toLocaleString('ja-JP');

  // ── ① 台数とオプション ───────────────────────
  const SUB = {
    units: yen(P.PRICES.unit) + '円/台　<em>2台目からは1台あたり' + yen(P.PRICES.secondOff) + '円引き</em>',
    auto: '＋' + yen(P.PRICES.auto) + '円/台（お掃除機能付きは1台' + yen(P.PRICES.unit + P.PRICES.auto) + '円）',
    kanzen: '＋' + yen(P.PRICES.kanzen) + '円/台　本体を外して部品まで分解して洗います（※汚れの状態等によります）',
    highEnd: '＋' + yen(P.PRICES.highEnd) + '円/台　エオリア CS-X・白くまくん X・ノクリア AS-X・霧ヶ峰 FZ・エアレスト。霧ヶ峰 FZ とエアレストは完全分解洗浄のみお受けしています',
    coat: yen(P.PRICES.coat) + '円/台',
    outdoor: yen(P.PRICES.outdoor) + '円/台',
    drain: yen(P.PRICES.drain) + '円/台',
  };
  const LABEL = {
    units: 'エアコン台数（壁掛け）', auto: 'うち、お掃除機能付き', kanzen: 'うち、完全分解洗浄',
    highEnd: 'うち、高機能機種', coat: '防カビコート', outdoor: '室外機洗浄', drain: 'ドレンホース清掃',
  };
  const st = { units: 1, auto: 0, kanzen: 0, highEnd: 0, coat: 0, outdoor: 0, drain: 0 };

  const box = $('counters');
  P.ITEMS.forEach((it, i) => {
    if (it.key === 'coat') box.insertAdjacentHTML('beforeend', '<h3>オプション（台数分までお選びいただけます）</h3>');
    box.insertAdjacentHTML('beforeend',
      '<div class="ctr"><div><span class="t">' + LABEL[it.key] + '</span><span class="p">' + SUB[it.key] + '</span></div>' +
      '<div class="b"><button type="button" data-k="' + it.key + '" data-d="-1" aria-label="' + LABEL[it.key] + 'を1つ減らす">−</button>' +
      '<output id="o_' + it.key + '">0</output>' +
      '<button type="button" data-k="' + it.key + '" data-d="1" aria-label="' + LABEL[it.key] + 'を1つ増やす">＋</button></div></div>');
  });

  function render() {
    Object.assign(st, P.normalize(st));
    const q = P.quote(st);
    Object.keys(st).forEach((k) => { $('o_' + k).textContent = st[k]; });
    $('eTotal').textContent = yen(q.total);
    $('barTotal').textContent = yen(q.total);
    const t = $('eLines');
    t.replaceChildren();
    q.lines.forEach((l) => {
      const tr = document.createElement('tr');
      const a = document.createElement('td'); a.textContent = l.name + '　' + l.qty + '台';
      const b = document.createElement('td'); b.className = 'r'; b.textContent = (l.amount < 0 ? '−' : '') + yen(Math.abs(l.amount)) + '円';
      tr.append(a, b); t.append(tr);
    });
    box.querySelectorAll('button').forEach((b) => {
      const k = b.dataset.k, d = +b.dataset.d;
      const it = P.ITEMS.find((x) => x.key === k);
      if (d < 0) b.disabled = st[k] <= (k === 'units' ? 1 : 0);
      else b.disabled = it.limit ? st[k] >= st[it.limit] : st[k] >= P.MAX_UNITS;
    });
  }
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    st[b.dataset.k] += +b.dataset.d;
    render();
  });
  render();

  // ── ② 予約情報の選択肢 ────────────────────────
  function radios(boxId, name, values) {
    const el = $(boxId);
    values.forEach((v) => {
      const l = document.createElement('label');
      const i = document.createElement('input'); i.type = 'radio'; i.name = name; i.value = v;
      l.append(i, v); el.append(l);
    });
  }
  radios('housingChoices', 'housing', ['戸建て', 'マンション・アパート', '店舗・事務所など']);
  radios('parkingChoices', 'parking', ['敷地内に駐車できる', '近くのコインパーキングを使う', 'わからない・相談したい']);
  const TIMES = ['9時〜12時', '12時〜15時', '15時〜18時', 'どの時間でも可'];
  ['time1', 'time2', 'time3'].forEach((n, i) => {
    const s = f.elements[n];
    s.add(new Option(i === 0 ? '時間を選んでください' : '時間（任意）', ''));
    TIMES.forEach((t) => s.add(new Option(t, t)));
  });

  // 希望日の範囲（日本時間）
  const jstDate = (days) => new Date(Date.now() + 9 * 3600e3 + days * 864e5).toISOString().slice(0, 10);
  const minDate = jstDate(C.DATE_MIN_DAYS), maxDate = jstDate(C.DATE_MAX_DAYS);
  ['date1', 'date2', 'date3'].forEach((n) => { f.elements[n].min = minDate; f.elements[n].max = maxDate; });
  $('dateHint').textContent = minDate.replace(/-/g, '/') + '〜' + maxDate.replace(/-/g, '/') + ' の間でお選びください。ご希望日での対応が難しい場合は、別の日程をご相談します。';

  [$('doneTel'), $('footTel')].forEach((a) => { a.href = 'tel:' + C.TEL_LINK; a.textContent = C.TEL; });

  // 紹介リンク（?ref=）で来た方は紹介コードを自動で入れる。90日このブラウザに覚える
  (function () {
    const KEY = 'kh_ref';
    let code = '';
    try {
      const q = new URLSearchParams(location.search).get('ref');
      if (q) { code = q.trim().slice(0, 30); localStorage.setItem(KEY, JSON.stringify({ code: code, at: Date.now() })); }
      else {
        const v = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (v && Date.now() - v.at < C.REF_KEEP_DAYS * 864e5) code = v.code;
      }
    } catch (e) { /* 保存できない環境でも続ける */ }
    if (code) { $('ref').value = code; $('refnote').hidden = false; }
  })();

  // 送信先
  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const endpoint = C.GAS_URL || (isLocal ? C.LOCAL_TEST_URL : '');
  const banner = $('demoBanner');
  if (!C.GAS_URL && isLocal) {
    banner.innerHTML = '【動作確認モード】このパソコンの中の模擬の受付に届きます。本物のメールは送られません。届いた内容は <a href="api/state" target="_blank">こちら</a> で見られます。';
    banner.hidden = false;
  } else if (!endpoint) {
    banner.textContent = '【試験】受付（GAS）が未設定のため、送信しても届きません。送る中身を画面に表示します。';
    banner.hidden = false;
  }

  // ── 入力チェック ──────────────────────────────
  const val = (n) => { const el = f.elements[n]; return el ? String(el.value || '').trim() : ''; };
  function setErr(key, msg) {
    const box = f.querySelector('.field[data-key="' + key + '"]');
    if (!box) return;
    box.classList.toggle('invalid', !!msg);
    let p = box.querySelector('.err');
    if (msg) { if (!p) { p = document.createElement('p'); p.className = 'err'; box.append(p); } p.textContent = msg; }
    else if (p) p.remove();
  }
  const inRange = (d) => d >= minDate && d <= maxDate;
  function validate() {
    const e = {};
    if (!val('name')) e.name = 'お名前を入力してください。';
    if (!val('tel')) e.tel = '電話番号を入力してください。';
    else if (val('tel').replace(/[^0-9]/g, '').length < 10) e.tel = '電話番号をご確認ください。';
    if (!val('email')) e.email = 'メールアドレスを入力してください。';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('email'))) e.email = 'メールアドレスの形式をご確認ください。';
    if (val('zip') && !/^\d{3}-?\d{4}$/.test(val('zip'))) e.zip = '郵便番号は7桁の数字でお願いします。';
    if (!val('address')) e.address = 'ご住所を入力してください。';
    if (!val('housing')) e.housing = 'お住まいのタイプを選んでください。';
    if (!val('date1')) e.date1 = '第1希望日を選んでください。';
    else if (!inRange(val('date1'))) e.date1 = '第1希望日は ' + minDate.replace(/-/g, '/') + ' 以降の日付を選んでください。';
    else if (!val('time1')) e.date1 = '第1希望の時間を選んでください。';
    ['date2', 'date3'].forEach((n, i) => { if (val(n) && !inRange(val(n))) e[n] = '第' + (i + 2) + '希望日は選べる範囲の日付でお願いします。'; });
    if (!val('parking')) e.parking = '駐車場について選んでください。';
    ['name', 'tel', 'email', 'zip', 'address', 'housing', 'date1', 'date2', 'date3', 'parking'].forEach((k) => setErr(k, e[k]));
    return e;
  }

  // ── 送信 ─────────────────────────────────────
  const requestId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  let sending = false;
  const btn = $('submit'), msg = $('msg');

  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (sending) return;
    msg.hidden = true;
    const e = validate();
    const keys = Object.keys(e);
    if (keys.length) {
      msg.textContent = '⚠ ' + e[keys[0]];
      msg.hidden = false;
      const el = f.querySelector('.field[data-key="' + keys[0] + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const q = P.quote(st);
    const payload = {
      requestId: requestId,
      website: val('website'),
      name: val('name'), tel: val('tel'), email: val('email'), zip: val('zip'), address: val('address'),
      housing: val('housing'), parking: val('parking'),
      date1: val('date1'), time1: val('time1'), date2: val('date2'), time2: val('time2'), date3: val('date3'), time3: val('time3'),
      note: val('note'), ref: val('ref'),
      counts: q.counts,
      clientTotal: q.total, // 参考。GASは使わず計算し直す
    };

    sending = true;
    btn.disabled = true;
    btn.textContent = '送信しています…';
    try {
      if (!endpoint) {
        $('payload').textContent = JSON.stringify(payload, null, 2);
        $('payloadBox').hidden = false;
      } else {
        // text/plain で送ると、GASへの事前確認(CORS)が要らない
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!data.ok) { const err = new Error(data.error || ''); err.fromServer = true; throw err; }
        if (data.receiptNo) $('receipt').textContent = '受付番号：' + data.receiptNo;
      }
      f.hidden = true;
      $('bar').hidden = true;
      $('done').hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      msg.textContent = '⚠ ' + ((err && err.fromServer && err.message) ? err.message
        : '送信できませんでした。通信の良い場所でもう一度お試しいただくか、お電話ください（' + C.TEL + '）。');
      msg.hidden = false;
      sending = false; // 同じ requestId のまま再送できる（GAS側で2件目は捨てる）
      btn.disabled = false;
      btn.textContent = 'この内容で予約する';
    }
  });
})();
