(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const TERM_MANIFESTS = [
    'algorithm-terms-manifest.json',
    'database-terms-manifest.json',
    'network-terms-manifest.json',
    'security-terms-manifest.json',
    'system-terms-manifest.json',
    'management-terms-manifest.json'
  ];
  const TYPE_LABELS = { lesson:'Lesson', term:'用語', practice:'短問', unit:'分野', official:'公式問題' };
  let baseCatalog = [];
  let extendedCatalog = [];
  let extendedPromise = null;
  let activeQuery = '';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/\s+/g, ' ').trim();

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function makeSearchable(item) {
    return {
      ...item,
      normalizedTitle:normalize(item.title),
      searchable:normalize([item.title, item.id, item.description, ...(item.aliases || []), ...(item.keywords || [])].filter(Boolean).join(' '))
    };
  }

  function scoreItem(item, query) {
    if (!query) return 0;
    const id = normalize(item.id);
    if (item.normalizedTitle === query || id === query) return 120;
    if ((item.aliases || []).some(alias => normalize(alias) === query)) return 110;
    if (item.normalizedTitle.startsWith(query) || id.startsWith(query)) return 95;
    if (item.normalizedTitle.includes(query)) return 80;
    if (item.searchable.includes(query)) return 55;
    return 0;
  }

  async function loadBaseCatalog() {
    if (!window.APLessonData?.load) throw new Error('Lesson Data Loaderが利用できません。');
    const [curriculum, lessonBank] = await Promise.all([
      fetchJson('../json/curriculum/ap-2026-map.json'),
      window.APLessonData.load('../')
    ]);
    const units = (curriculum.studyUnits || []).map(unit => makeSearchable({
      type:'unit', id:unit.id, title:unit.title,
      description:`IPA中分類 ${(unit.officialMiddleCodes || []).join('・')}の学習分野`,
      href:`unit.html?unit=${encodeURIComponent(unit.id)}`,
      keywords:[...(unit.officialMiddleTitles || [])]
    }));
    const lessons = (lessonBank.lessons || []).map(lesson => makeSearchable({
      type:'lesson', id:lesson.id, title:lesson.title,
      description:`${lesson.unitId} / IPA中分類 ${(lesson.officialMiddleCodes || []).join('・')}`,
      href:`lesson.html?id=${encodeURIComponent(lesson.id)}`,
      keywords:[lesson.unitId, ...(lesson.contentTypes || [])]
    }));
    baseCatalog = [...lessons, ...units];
  }

  async function loadTerms() {
    const manifests = await Promise.all(TERM_MANIFESTS.map(file => fetchJson(`../${file}`)));
    const fileRefs = manifests.flatMap(manifest => Array.isArray(manifest.files) ? manifest.files : []);
    const payloads = await Promise.all(fileRefs.map(ref => fetchJson(`../${ref.file}`)));
    return payloads.flatMap(payload => (payload.terms || []).map(term => makeSearchable({
      type:'term', id:term.id, title:term.term,
      description:term.definition || term.category || '用語辞書',
      href:`glossary.html?term=${encodeURIComponent(term.id)}`,
      aliases:term.aliases || [],
      keywords:[term.category || '']
    })));
  }

  async function loadPractice() {
    if (!window.APPracticeData?.load) return [];
    const bank = await window.APPracticeData.load('../');
    return (bank.questions || []).map(question => makeSearchable({
      type:'practice', id:question.id, title:question.title || question.prompt,
      description:question.prompt || '短問演習',
      href:`practice.html?unit=${encodeURIComponent(question.unitId || '')}&question=${encodeURIComponent(question.id)}`,
      keywords:[question.unitId || '', ...(question.lessonRefs || []), ...(question.middleCodes || []).map(String)]
    }));
  }

  async function loadOfficial() {
    const data = await fetchJson('../json/past/ap-public-exams.json');
    return (data.exams || []).flatMap(exam => (exam.questions || []).map(question => makeSearchable({
      type:'official',
      id:`${exam.id}-Q${question.number}`,
      title:`${exam.seasonLabel} 問${question.number} ${question.domain}`,
      description:question.topic,
      href:'official-past.html',
      keywords:[exam.id, question.domain, question.primaryUnitId, ...(question.lessonRefs || [])]
    })));
  }

  function loadExtendedCatalog() {
    if (extendedPromise) return extendedPromise;
    $('search-loading').textContent = ' 用語・短問・公式問題を読み込み中…';
    extendedPromise = Promise.all([loadTerms(), loadPractice(), loadOfficial()])
      .then(groups => {
        extendedCatalog = groups.flat();
        $('search-loading').textContent = '';
        $('search-status').textContent = 'Lesson・用語・短問・分野・公開公式問題を横断検索しています。';
        return extendedCatalog;
      })
      .catch(error => {
        extendedPromise = null;
        $('search-loading').textContent = '';
        $('search-status').classList.add('error');
        $('search-status').textContent = `追加データの読み込みに失敗しました。Lessonと分野は検索できます: ${error.message}`;
        throw error;
      });
    return extendedPromise;
  }

  function filteredResults(query) {
    const type = $('search-type-filter').value;
    return [...baseCatalog, ...extendedCatalog]
      .map(item => ({ item, score:scoreItem(item, query) }))
      .filter(row => row.score > 0 && (type === 'all' || row.item.type === type))
      .sort((a,b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'ja'))
      .slice(0, 60);
  }

  function render(query) {
    const root = $('search-results');
    if (!query) {
      $('search-summary').textContent = 'キーワードを入力してください';
      root.innerHTML = '<div class="search-empty"><strong>探したい言葉を入力してください。</strong><p>Lesson ID、用語、問題テーマ、分野名などを検索できます。</p></div>';
      return;
    }
    const rows = filteredResults(query);
    $('search-summary').textContent = `${rows.length}件を表示`;
    if (!rows.length) {
      root.innerHTML = `<div class="search-empty"><strong>「${escapeHtml(activeQuery)}」に一致する項目がありません。</strong><p>表記を短くするか、別の言い方で検索してください。</p><a href="glossary.html?q=${encodeURIComponent(activeQuery)}">単語辞書でも探す</a></div>`;
      return;
    }
    root.innerHTML = rows.map(({item}) => `<a class="search-result" href="${item.href}"><div class="search-result-head"><span class="search-type type-${item.type}">${TYPE_LABELS[item.type] || item.type}</span><code>${escapeHtml(item.id)}</code></div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description || '')}</p><span class="search-open">開く →</span></a>`).join('');
  }

  async function runSearch(raw) {
    activeQuery = String(raw || '').trim();
    const query = normalize(activeQuery);
    const url = new URL(location.href);
    if (activeQuery) url.searchParams.set('q', activeQuery); else url.searchParams.delete('q');
    history.replaceState(null, '', `${url.pathname}${url.search}`);
    render(query);
    if (!query) return;
    try {
      await loadExtendedCatalog();
      if (normalize(activeQuery) === query) render(query);
    } catch {}
  }

  async function init() {
    await loadBaseCatalog();
    const initial = new URLSearchParams(location.search).get('q') || '';
    $('cross-search-input').value = initial;
    $('cross-search-form').addEventListener('submit', event => { event.preventDefault(); runSearch($('cross-search-input').value); });
    $('search-type-filter').addEventListener('change', () => render(normalize(activeQuery)));
    if (initial) runSearch(initial); else render('');
  }

  document.addEventListener('DOMContentLoaded', () => init().catch(error => {
    console.error(error);
    $('search-status').classList.add('error');
    $('search-status').textContent = `検索の初期化に失敗しました: ${error.message}`;
  }));
})();
