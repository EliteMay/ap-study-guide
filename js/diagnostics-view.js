(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function renderList(id, items, formatter, emptyText) {
    const root = $(id);
    root.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'diagnostics-empty';
      empty.textContent = emptyText;
      root.appendChild(empty);
      return;
    }
    for (const item of items.slice().reverse().slice(0, 30)) {
      const row = document.createElement('li');
      row.className = 'diagnostics-row';
      const time = document.createElement('time');
      time.textContent = new Date(item.at).toLocaleTimeString('ja-JP');
      const body = document.createElement('span');
      body.textContent = formatter(item);
      row.append(time,body);
      root.appendChild(row);
    }
  }

  async function snapshot(reason = 'diagnostics-view') {
    if (!window.APDiagnostics?.snapshot) throw new Error('Diagnostics runtime is unavailable.');
    await window.APStudyUI?.ready;
    return window.APDiagnostics.snapshot(reason);
  }

  async function render() {
    try {
      const data = await snapshot();
      $('diagnostics-build').textContent = data.project.build;
      $('diagnostics-session').textContent = data.capture.sessionId;
      $('diagnostics-route').textContent = data.capture.route;
      $('diagnostics-storage').textContent = data.storage.available ? '利用可能' : '利用不可';
      $('diagnostics-storage-detail').textContent = `学習Data ${data.storage.summary.existingRecognizedKeys}/${data.storage.summary.recognizedKeyCount} Key / ${formatBytes(data.storage.summary.recognizedDataBytes)} / Diagnostics ${formatBytes(data.storage.summary.diagnosticBytes)}`;
      $('diagnostics-runtime').textContent = `初期化 ${data.runtime.initialization.length}件 / Error ${data.errors.length}件 / Network failure ${data.networkFailures.length}件 / Breadcrumb ${data.breadcrumbs.length}件`;
      $('diagnostics-environment').textContent = `${data.environment.viewport.width}×${data.environment.viewport.height} / ${data.environment.platformSummary} / ${data.environment.online ? 'online' : 'offline'}`;

      renderList('diagnostics-errors', data.errors, item => `${item.code} · ${item.source} · ${item.message}`, '記録されたRuntime Errorはありません。');
      renderList('diagnostics-network', data.networkFailures, item => `${item.method} ${item.path} · ${item.status || 'network error'}${item.error ? ` · ${item.error}` : ''}`, '記録されたNetwork Failureはありません。');
      renderList('diagnostics-breadcrumbs', data.breadcrumbs, item => {
        const details = Object.entries(item.detail || {}).map(([key,value]) => `${key}=${value}`).join(' ');
        return `${item.action}${details ? ` · ${details}` : ''}`;
      }, 'Breadcrumbはまだありません。');
    } catch (error) {
      $('diagnostics-status').textContent = `診断情報を読み込めませんでした: ${error.message}`;
    }
  }

  function downloadJson(data) {
    const stamp = new Date().toISOString().slice(0,10).replaceAll('-','');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ap-study-diagnostics-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await render();

    $('diagnostics-export').addEventListener('click', async () => {
      const data = await snapshot('manual-export');
      downloadJson(data);
      window.APDiagnostics?.breadcrumb?.('diagnostics.export');
      window.APStudyUI?.toast?.('診断JSONを書き出しました');
      await render();
    });

    $('diagnostics-copy').addEventListener('click', async () => {
      try {
        const data = await snapshot('manual-copy');
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard APIが利用できません。');
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        window.APDiagnostics?.breadcrumb?.('diagnostics.copy');
        window.APStudyUI?.toast?.('診断情報をコピーしました');
        await render();
      } catch (error) {
        window.APDiagnostics?.error?.('DIAGNOSTICS-COPY-001', error, 'diagnostics-view');
        window.APStudyUI?.toast?.('診断情報をコピーできませんでした');
      }
    });

    $('diagnostics-clear').addEventListener('click', async () => {
      window.APDiagnostics?.clear?.();
      window.APStudyUI?.toast?.('診断履歴を消去しました');
      await render();
    });
  });
})();