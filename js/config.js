/**
 * 予約フォームの設定。GASをデプロイしたら GAS_URL に /exec のURLを入れる。
 */
window.BOOKING_CONFIG = {
  /**
   * 受付GASのURL（ウェブアプリとしてデプロイした /exec のURL）
   * 空のとき：手元サーバー（localhost）で開いていれば模擬の受付へ、
   * それ以外では送らずに「送る中身」を画面に出すだけ。
   */
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzYjC6d5XruZT-Vt46055OvX9xrZisM6V30DVX4SIrzNMZTvW-ngvnRAZ96Hz9lAdk/exec',
  LOCAL_TEST_URL: '/api/book',

  TEL: '090-4143-4127',
  TEL_LINK: '09041434127',

  /** 作業希望日は何日後から選べるか（2＝明後日から）。24時間以内のご連絡のあとで日程を決めるため */
  DATE_MIN_DAYS: 2,
  DATE_MAX_DAYS: 90,

  /** 紹介コードをブラウザに覚えておく日数 */
  REF_KEEP_DAYS: 90,
};
