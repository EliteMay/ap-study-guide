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

  function expectedSchemaVersion() {
    return Number(window.APStudyUI?.meta?.storage?.backupSchemaVersion || 1);
  }

  function storageShape(key) {
    const stateKeys = window.APStudyState?.keys || {};
    if (key === stateKeys.theme) return 'theme';
    if ([stateKeys.lesson,stateKeys.practice,stateKeys.cases,stateKeys.mockA,stateKeys.mockB].includes(key)) return 'object';
    if ([stateKeys.mock,stateKeys.bookmarks,stateKeys.recent,stateKeys.test,...(window.APStudyState?.legacyKeys || [])].includes(key)) return 'array';
    return 'unknown';
  }

  function validateStorageValue(key, raw) {
    const shape = storageShape(key);
    if (shape === 'theme') {
      if (!['light','dark'].includes(raw)) throw new Error(`${key}: theme値が不正です。`);
      return raw;
    }
    if (shape === 'unknown') throw new Error(`${key}: 未対応の保存形式です。`);
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { throw new Error(`${key}: 保存JSONが壊れています。`); }
    if (shape === 'array' && !Array.isArray(parsed)) throw new Error(`${key}: 配列形式ではありません。`);
    if (shape === 'object' && (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) throw new Error(`${key}: オブジェクト形式ではありません。`);
    return raw;
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
      schemaVersion:expectedSchemaVersion(),
      app:'AP Study Notes',
      build:window.APStudyUI?.build || 'unknown',
      exportedAt:new Date().toISOString(),
      storage
    };
  }

  function downloadJson(data, prefix = 'ap-study-backup') {
    const stamp = new Date().toISOString().slice(0,10).replaceAll('-','');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${prefix}-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function validateBackup(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSONの形式が正しくありません。');
    if (value.app !== 'AP Study Notes') throw new Error('AP Study Notesのバックアップではありません。');
    if (Number(value.schemaVersion) !== expectedSchemaVersion()) throw new Error(`未対応のschemaVersionです: ${value.schemaVersion}`);
    if (!value.storage || typeof value.storage !== 'object' || Array.isArray(value.storage)) throw new Error('storageデータがありません。');
    const allowed = new Set(keys());
    const recognized = [];
    for (const [key,raw] of Object.entries(value.storage)) {
      if (!allowed.has(key)) continue;
      if (typeof raw !== 'string') throw new Error(`${key}: 保存値が文字列ではありません。`);
      recognized.push([key,validateStorageValue(key,raw)]);
    }
    if (!recognized.length) throw new Error('復元できる認識済みデータがありません。');
    return { ...value, recognized };
  }

  async function loadFile(file) {
    const text = await file.text();
    let parsed;
    try { parsed = JSON.parse(text); }
    catch { throw new Error('JSONとして読み込めません。'); }
    return validateBackup(parsed);
  }

  function previewBackup(backup) {
    const preview = $('data-import-preview');
    const date = backup.exportedAt && Number.isFinite(Date.parse(backup.exportedAt))
      ? new Date(backup.exportedAt).toLocaleString('ja-JP')
      : '日時不明';
    preview.replaceChildren();
    const count = document.createElement('strong');
    count.textContent = `${backup.recognized.length}種類`;
    const exported = document.createElement('span');
    exported.textContent = `書き出し: ${date}`;
    const build = document.createElement('span');
    build.textContent = `BUILD: ${String(backup.build || 'unknown')}`;
    preview.append(count,exported,build);
    $('data-import').disabled = false;
  }

  function restoreBackup(backup) {
    const previous = new Map(backup.recognized.map(([key]) => [key,localStorage.getItem(key)]));
    try {
      for (const [key,value] of backup.recognized) localStorage.setItem(key, value);
    } catch (error) {
      let rollbackFailed = false;
      for (const [key,value] of previous) {
        try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key,value); }
        catch { rollbackFailed = true; }
      }
      throw new Error(rollbackFailed ? `復元に失敗し、Rollbackも一部失敗しました: ${error.message}` : `復元に失敗したため変更を元に戻しました: ${error.message}`);
    }
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
      try {
        if (existingEntries().length) downloadJson(makeBackup(),'ap-study-before-restore');
        restoreBackup(pendingBackup);
        renderExportSummary();
        window.APStudyUI?.toast?.('学習データを復元しました');
      } catch (error) {
        $('data-import-preview').textContent = error.message;
        window.APStudyUI?.toast?.('学習データを復元できませんでした');
      }
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