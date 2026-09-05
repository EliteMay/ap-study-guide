(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const BACKUP_APP = 'AP Study Guide';
  const ACCEPTED_BACKUP_APPS = new Set([BACKUP_APP, 'AP Study Notes']);
  let pendingBackup = null;

  function diagBreadcrumb(action, detail) { window.APDiagnostics?.breadcrumb?.(action, detail); }
  function diagError(code, error) { window.APDiagnostics?.error?.(code, error, 'data-tools'); }
  function diagStorage(operation, key, error) { window.APDiagnostics?.storageFailure?.(operation, key, error); }

  function keys() {
    return window.APStudyState?.recognizedKeys?.() || [];
  }

  function existingEntries() {
    const entries = [];
    for (const key of keys()) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) entries.push([key,value]);
      } catch (error) {
        diagStorage('backup-read', key, error);
      }
    }
    return entries;
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
    for (const [key,value] of existingEntries()) storage[key] = value;
    return {
      schemaVersion:expectedSchemaVersion(),
      app:BACKUP_APP,
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
    if (!ACCEPTED_BACKUP_APPS.has(value.app)) throw new Error('AP Study Guideのバックアップではありません。');
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
    return { ...value, recognized, legacyApp:value.app !== BACKUP_APP };
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
    if (backup.legacyApp) {
      const legacy = document.createElement('span');
      legacy.textContent = '旧AP Study Notes形式（互換Import）';
      preview.appendChild(legacy);
    }
    $('data-import').disabled = false;
  }

  function restoreBackup(backup) {
    const previous = new Map();
    for (const [key] of backup.recognized) {
      try { previous.set(key,localStorage.getItem(key)); }
      catch (error) { diagStorage('restore-read-current', key, error); throw error; }
    }
    try {
      for (const [key,value] of backup.recognized) localStorage.setItem(key, value);
    } catch (error) {
      diagStorage('restore-write', 'recognized-keys', error);
      let rollbackFailed = false;
      for (const [key,value] of previous) {
        try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key,value); }
        catch (rollbackError) { rollbackFailed = true; diagStorage('restore-rollback', key, rollbackError); }
      }
      throw new Error(rollbackFailed ? `復元に失敗し、Rollbackも一部失敗しました: ${error.message}` : `復元に失敗したため変更を元に戻しました: ${error.message}`);
    }
  }

  function resetAll() {
    for (const key of keys()) {
      try { localStorage.removeItem(key); }
      catch (error) { diagStorage('reset-remove', key, error); throw error; }
    }
  }

  function bind() {
    $('data-export').addEventListener('click', () => {
      const backup = makeBackup();
      downloadJson(backup);
      diagBreadcrumb('backup.export', { keyCount:Object.keys(backup.storage).length });
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
        diagBreadcrumb('backup.validate', { status:'success', keyCount:pendingBackup.recognized.length, legacyApp:pendingBackup.legacyApp });
      } catch (error) {
        $('data-import-preview').textContent = `読み込み失敗: ${error.message}`;
        diagError('DATA-IMPORT-VALIDATE', error);
        diagBreadcrumb('backup.validate', { status:'failure' });
      }
    });

    $('data-import').addEventListener('click', () => {
      if (!pendingBackup) return;
      if (!confirm(`${pendingBackup.recognized.length}種類の学習データをこのブラウザへ復元します。現在の同名データは上書きされます。続けますか？`)) return;
      try {
        if (existingEntries().length) downloadJson(makeBackup(),'ap-study-before-restore');
        restoreBackup(pendingBackup);
        renderExportSummary();
        diagBreadcrumb('backup.restore', { status:'success', keyCount:pendingBackup.recognized.length, legacyApp:pendingBackup.legacyApp });
        window.APStudyUI?.toast?.('学習データを復元しました');
      } catch (error) {
        $('data-import-preview').textContent = error.message;
        diagError('DATA-RESTORE-001', error);
        diagBreadcrumb('backup.restore', { status:'failure' });
        window.APStudyUI?.toast?.('学習データを復元できませんでした');
      }
    });

    $('data-reset').addEventListener('click', () => {
      if (!confirm('このブラウザのAP Study Guide学習データをすべて削除します。バックアップなしでは元に戻せません。続けますか？')) return;
      if (!confirm('最終確認：本当に学習履歴・模試履歴・復習リスト・旧用語チェックを削除しますか？')) return;
      try {
        resetAll();
        pendingBackup = null;
        $('data-import-file').value = '';
        $('data-import').disabled = true;
        $('data-import-preview').textContent = 'ファイル未選択';
        renderExportSummary();
        diagBreadcrumb('learning-data.reset', { status:'success' });
        window.APStudyUI?.toast?.('学習データを削除しました');
      } catch (error) {
        diagError('DATA-RESET-001', error);
        window.APStudyUI?.toast?.('学習データを削除できませんでした');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.APStudyState) {
      $('data-export-summary').textContent = 'study-state.js の読み込みに失敗しました。';
      diagError('DATA-STATE-MISSING', 'study-state.js missing');
      return;
    }
    renderExportSummary();
    bind();
  });
})();