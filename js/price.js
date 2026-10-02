/**
 * 料金の計算（画面とテストで共用）
 *
 * 料金は 新サイト制作/02_料金表.md が唯一の正（税込）。
 * gas/Code.gs にも同じ計算があり、シートやメールにはGAS側で計算し直した金額だけを使う。
 * 両方が一致していることは test/run_tests.js で確かめる。
 */
(function (root) {
  'use strict';

  const PRICES = {
    unit: 6800,        // 壁掛けエアコン（通常タイプ）1台
    auto: 6000,        // お掃除機能付きの加算（12,800 − 6,800）
    kanzen: 8000,      // 完全分解洗浄（オプション）
    highEnd: 5000,     // 高機能機種対応（お掃除機能付きに加算）
    coat: 2000,        // 防カビコート
    outdoor: 3000,     // 室外機洗浄
    drain: 2500,       // ドレンホース清掃
    secondOff: 500,    // 2台目以降の割引（1台あたり）
  };
  const MAX_UNITS = 10;

  /** 項目ごとの名前・単価と、その項目の上限（どの数を超えられないか） */
  const ITEMS = [
    { key: 'units',   name: 'エアコンクリーニング（壁掛け）', price: PRICES.unit,    limit: null },
    { key: 'auto',    name: 'お掃除機能付きの加算',          price: PRICES.auto,    limit: 'units' },
    { key: 'kanzen',  name: '完全分解洗浄',                  price: PRICES.kanzen,  limit: 'units' },
    { key: 'highEnd', name: '高機能機種対応',                price: PRICES.highEnd, limit: 'auto' },
    { key: 'coat',    name: '防カビコート',                  price: PRICES.coat,    limit: 'units' },
    { key: 'outdoor', name: '室外機洗浄',                    price: PRICES.outdoor, limit: 'units' },
    { key: 'drain',   name: 'ドレンホース清掃',              price: PRICES.drain,   limit: 'units' },
  ];

  /** 台数を整える：整数・0以上・上限以下・ほかの項目を超えない */
  function normalize(input) {
    const st = {};
    ITEMS.forEach((it) => {
      let n = Math.floor(Number(input && input[it.key]));
      if (!(n >= 0)) n = 0;
      st[it.key] = n;
    });
    st.units = Math.min(st.units, MAX_UNITS);
    ITEMS.forEach((it) => { if (it.limit) st[it.key] = Math.min(st[it.key], st[it.limit]); });
    st.highEnd = Math.min(st.highEnd, st.auto); // auto が上で減った場合に合わせ直す
    return st;
  }

  /** 内訳と合計（税込） */
  function quote(input) {
    const st = normalize(input);
    const lines = [];
    ITEMS.forEach((it) => {
      if (st[it.key] > 0) lines.push({ key: it.key, name: it.name, qty: st[it.key], unit: it.price, amount: it.price * st[it.key] });
    });
    if (st.units >= 2) {
      const qty = st.units - 1;
      lines.push({ key: 'discount', name: '2台目以降の割引', qty, unit: -PRICES.secondOff, amount: -PRICES.secondOff * qty });
    }
    return { counts: st, lines, total: lines.reduce((a, l) => a + l.amount, 0) };
  }

  const api = { PRICES, MAX_UNITS, ITEMS, normalize, quote };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Price = api;
})(typeof window !== 'undefined' ? window : globalThis);
