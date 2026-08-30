(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  let pendingBackup = null;

  function keys() {
    return window.APStudyState?.recognizedKeys?.() || [];
  }

  function existingEntries() {
    return keys().map(key => [key, localStorage.getItem(key)]).filter(([,value]) => value !== null);
  }

  function renderExportSummary() {
    const entries = existingEntries();
    $('data-export-summary').textContent = entries.length
      ? `${entries.length}種類の保存データがあります。Lesson・演習・模試・復習・旧用語チェックをまとめて書き出します。`
      : 'まだ保存済み学習データはありません。空のバックアップも作成できます。';
  }

  function makeBackup() {
    const storage = {};
    for (const key of keys()) {
      const value = localStorage.getItem(key);
      if (value !== null) storage[key] = value;
    }
    return {
      schemaVersion:1,
      app:'AP Study Notes',
      build:window.APStudyUI?.build || 'unknown',
      exportedAt:new Date().toISOString(),
      storage
    };
  }

  function downloadJson(data) {
    const stamp = new Date().toISOString().slice(0,10).replaceAll('-','');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ap-study-backup-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function validateBackup(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSONの形式が正しくありません。');
    if (value.app !== 'AP Study Notes') throw new Error('AP Study Notesのバックアップではありません。');
    if (Number(value.schemaVersion) !== 1) throw new Error(`未対応のschemaVersionです: ${value.schemaVersion}`);
    if (!value.storage || typeof value.storage !== 'object' || Array.isArray(value.storage)) throw new Error('storageデータがありません。');
    const allowed = new Set(keys());
    const recognized = Object.entries(value.storage).filter(([key,val]) => allowed.has(key) && typeof val === 'string');
    if (!recognized.length) throw new Error('復元できる認識済みデータがありません。');
    return { ...value, recognized };
  }

  async function loadFile(file) {
    const text = await file.text();
    return validateBackup(JSON.parse(text));
  }

  function previewBackup(backup) {
    const date = backup.exportedAt ? new Date(backup.exportedAt).toLocaleString('ja-JP') : '日時不明';
    $('data-import-preview').innerHTML = `<strong>${backup.recognized.length}種類</strong><span>書き出し: ${date}</span><span>BUILD: ${String(backup.build || 'unknown')}</span>`;
    $('data-import').disabled = false;
  }

  function restoreBackup(backup) {
    for (const [key,value] of backup.recognized) localStorage.setItem(key, value);
  }

  function resetAll() {
    for (const key of keys()) localStorage.removeItem(key);
  }

  function bind() {
    $('data-export').addEventListener('click', () => {
      downloadJson(makeBackup());
      window.APStudyUI?.toast?.('バックアップJSONを書き出しました');
    });

    $('data-import-file').addEventListener('change', async event => {
      pendingBackup = null;
      $('data-import').disabled = true;
      const file = event.target.files?.[0];
      if (!file) { $('data-import-preview').textContent = 'ファイル未選択'; return; }
      try {
        pendingBackup = await loadFile(file);
        previewBackup(pendingBackup);
      } catch (error) {
        $('data-import-preview').textContent = `読み込み失敗: ${error.message}`;
      }
    });

    $('data-import').addEventListener('click', () => {
      if (!pendingBackup) return;
      if (!confirm(`${pendingBackup.recognized.length}種類の学習データをこのブラウザへ復元します。現在の同名データは上書きされます。続けますか？`)) return;
      restoreBackup(pendingBackup);
      renderExportSummary();
      window.APStudyUI?.toast?.('学習データを復元しました');
    });

    $('data-reset').addEventListener('click', () => {
      if (!confirm('このブラウザのAP Study Notes学習データをすべて削除します。バックアップなしでは元に戻せません。続けますか？')) return;
      if (!confirm('最終確認：本当に学習履歴・模試履歴・復習リスト・旧用語チェックを削除しますか？')) return;
      resetAll();
      pendingBackup = null;
      $('data-import-file').value = '';
      $('data-import').disabled = true;
      $('data-import-preview').textContent = 'ファイル未選択';
      renderExportSummary();
      window.APStudyUI?.toast?.('学習データを削除しました');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.APStudyState) {
      $('data-export-summary').textContent = 'study-state.js の読み込みに失敗しました。';
      return;
    }
    renderExportSummary();
    bind();
  });
})();