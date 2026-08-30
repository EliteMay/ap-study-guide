(() => {
  'use strict';

  const DOMAIN_CONFIGS = [
    { id:'security', shortLabel:'セキュリティ', manifest:'security-terms-manifest.json', storage:'security-terms-checked' },
    { id:'network', shortLabel:'ネットワーク', manifest:'network-terms-manifest.json', storage:'network-terms-checked' },
    { id:'database', shortLabel:'DB', manifest:'database-terms-manifest.json', storage:'database-terms-checked' },
    { id:'algorithm', shortLabel:'アルゴリズム', manifest:'algorithm-terms-manifest.json', storage:'algorithm-terms-checked' },
    { id:'system', shortLabel:'システム', manifest:'system-terms-manifest.json', storage:'system-terms-checked' },
    { id:'management', shortLabel:'管理', manifest:'management-terms-manifest.json', storage:'management-terms-checked' }
  ];
  const TEST_HISTORY_KEY = 'ap-study-test-history-v1';
  const LESSON_PROGRESS_KEY = 'ap-study-lesson-progress-v1';
  const PRACTICE_HISTORY_KEY = 'ap-study-practice-history-v1';

  function readArray(key) {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }

  function readObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }

  function safeStoredCount(key) { return new Set(readArray(key)).size; }

  async function fetchJson(path) {
    const response = await fetch(path, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadLessonIndex() {
    const [base, expansion] = await Promise.all([
      fetchJson('json/lessons/lesson-index.json'),
      fetchJson('json/lessons/lesson-index-expansion.json')
    ]);
    return [...(base.lessons || []), ...(expansion.lessons || [])].sort((a,b) => Number(a.order) - Number(b.order));
  }

  function manifestCount(data) {
    const direct = Number(data?.meta?.totalTerms);
    if (Number.isFinite(direct) && direct >= 0) return direct;
    return Array.isArray(data?.files) ? data.files.reduce((sum,item) => sum + Number(item.count || 0), 0) : 0;
  }

  async function updateDomain(domain) {
    const termEl = document.getElementById(`${domain.id}-terms`);
    const barEl = document.getElementById(`${domain.id}-bar`);
    try {
      const manifest = await fetchJson(domain.manifest);
      const total = manifestCount(manifest);
      const checked = Math.min(safeStoredCount(domain.storage), total);
      if (termEl) termEl.textContent = `${checked} / ${total} 語`;
      if (barEl) barEl.style.width = total ? `${Math.round(checked / total * 100)}%` : '0%';
      return { checked, total };
    } catch (error) {
      console.warn('[home] manifest load failed', domain.id, error);
      if (termEl) termEl.textContent = '件数を取得できません';
      return { checked:0, total:0 };
    }
  }

  async function updatePastCount() {
    const el = document.getElementById('security-past-count');
    try {
      const data = await fetchJson('security-past-index.json');
      const count = Array.isArray(data.files) ? data.files.reduce((sum,item) => sum + Number(item.count || 0), 0) : 0;
      if (el) el.textContent = `${count} 問`;
    } catch (error) {
      console.warn('[home] past index load failed', error);
      if (el) el.textContent = '件数を取得できません';
    }
  }

  function getBookmarks() {
    if (window.APStudyUI?.getBookmarks) return window.APStudyUI.getBookmarks();
    return readArray('ap-study-bookmarks-v1');
  }

  function renderBookmarkSummary(bookmarks) {
    const total = bookmarks.length;
    document.getElementById('review-count')?.replaceChildren(document.createTextNode(String(total)));
    document.getElementById('bookmark-count')?.replaceChildren(document.createTextNode(String(total)));
    const breakdown = document.getElementById('bookmark-breakdown');
    if (!breakdown) return;
    if (!total) {
      breakdown.textContent = '用語カードの「☆ 復習」から追加できます。';
      return;
    }
    const counts = new Map(DOMAIN_CONFIGS.map(item => [item.id, 0]));
    bookmarks.forEach(item => { if (counts.has(item?.domain)) counts.set(item.domain, counts.get(item.domain) + 1); });
    breakdown.textContent = DOMAIN_CONFIGS.filter(item => counts.get(item.id)).map(item => `${item.shortLabel} ${counts.get(item.id)}`).join(' / ');
  }

  function renderLessonProgress(lessons) {
    const progress = readObject(LESSON_PROGRESS_KEY);
    const completed = lessons.filter(lesson => progress[lesson.id]?.completed).length;
    const started = lessons.filter(lesson => Number(progress[lesson.id]?.latestAnswered || 0) > 0).length;
    const total = lessons.length;

    const totalLessons = document.getElementById('total-lessons');
    const completedHero = document.getElementById('lesson-completed');
    const number = document.getElementById('lesson-progress-number');
    const meta = document.getElementById('lesson-progress-meta');
    if (totalLessons) totalLessons.textContent = String(total);
    if (completedHero) completedHero.textContent = String(completed);
    if (number) number.textContent = `${completed} / ${total}`;
    if (meta) meta.textContent = `${started}本着手 · ${completed}本完了。各Lessonでは最新点とBest scoreも保存します。`;

    document.querySelectorAll('[data-curriculum-unit]').forEach(card => {
      const unitId = card.dataset.curriculumUnit;
      const unitLessons = lessons.filter(lesson => lesson.unitId === unitId);
      const unitDone = unitLessons.filter(lesson => progress[lesson.id]?.completed).length;
      const countEl = card.querySelector('[data-lesson-count]');
      const doneEl = card.querySelector('[data-lesson-done]');
      const bar = card.querySelector('[data-lesson-bar]');
      if (countEl) countEl.textContent = `${unitLessons.length} Lesson`;
      if (doneEl) doneEl.textContent = `${unitDone} / ${unitLessons.length} 完了`;
      if (bar) bar.style.width = unitLessons.length ? `${Math.round(unitDone / unitLessons.length * 100)}%` : '0%';
      card.classList.toggle('is-lesson-complete', Boolean(unitLessons.length && unitDone === unitLessons.length));
    });

    const recent = Object.entries(progress)
      .filter(([id, value]) => lessons.some(lesson => lesson.id === id) && Number(value?.updatedAt || 0) > 0)
      .sort((a,b) => Number(b[1].updatedAt || 0) - Number(a[1].updatedAt || 0))[0];
    const title = document.getElementById('continue-title');
    const continueMeta = document.getElementById('continue-meta');
    const link = document.getElementById('continue-link');
    const hero = document.getElementById('continue-hero');

    if (!recent) {
      if (title) title.textContent = '最初のLessonを選ぶ';
      if (continueMeta) continueMeta.textContent = 'まだ構造化Lessonの学習履歴がありません。';
      if (link) { link.href = 'html/unit.html?unit=foundation-theory'; link.textContent = '基礎理論から始める →'; }
      if (hero) { hero.href = 'html/unit.html?unit=foundation-theory'; hero.textContent = '学習を始める'; }
      return;
    }

    const [lessonId, saved] = recent;
    const entry = lessons.find(lesson => lesson.id === lessonId);
    if (!entry) return;
    if (title) title.textContent = `${entry.id} ${entry.title}`;
    if (continueMeta) continueMeta.textContent = saved.completed
      ? `完了済み · Best ${Number(saved.bestCorrect || 0)} / ${Number(saved.total || 0)} · もう一度復習できます。`
      : `途中 ${Number(saved.latestCorrect || 0)} / ${Number(saved.latestAnswered || 0)} 正解。`;
    const href = `html/lesson.html?id=${encodeURIComponent(entry.id)}`;
    if (link) { link.href = href; link.textContent = saved.completed ? 'このLessonを復習する →' : 'このLessonの続きへ →'; }
    if (hero) { hero.href = href; hero.textContent = saved.completed ? '最後のLessonを復習' : '続きから学ぶ'; }
  }

  function isPracticeMastered(question, record) {
    if (!record) return false;
    return question.type === 'choice' ? Number(record.bestScore) >= 1 : Number(record.bestScore) >= 2;
  }

  function renderPracticeProgress(bank) {
    const questions = Array.isArray(bank?.questions) ? bank.questions : [];
    const history = readObject(PRACTICE_HISTORY_KEY);
    const attempted = questions.filter(question => history[question.id]).length;
    const mastered = questions.filter(question => isPracticeMastered(question, history[question.id])).length;
    const retry = questions.filter(question => history[question.id] && !isPracticeMastered(question, history[question.id])).length;
    const number = document.getElementById('practice-progress-number');
    const meta = document.getElementById('practice-progress-meta');
    if (number) number.textContent = `${mastered} / ${questions.length}`;
    if (meta) meta.textContent = `${attempted}問挑戦 · ${mastered}問理解済み · ${retry}問要復習。未挑戦/要復習で絞り込めます。`;
  }

  async function init() {
    const [lessons, practiceBank, ...domainProgress] = await Promise.all([
      loadLessonIndex(),
      fetchJson('json/practice/ap-original-practice-v1.json'),
      ...DOMAIN_CONFIGS.map(updateDomain)
    ]);
    const totalTerms = domainProgress.reduce((sum,item) => sum + item.total, 0);
    if (document.getElementById('total-terms')) document.getElementById('total-terms').textContent = String(totalTerms);
    renderBookmarkSummary(getBookmarks());
    renderLessonProgress(lessons);
    renderPracticeProgress(practiceBank);
    await updatePastCount();
  }

  window.addEventListener('ap-bookmarks-changed', () => renderBookmarkSummary(getBookmarks()));
  window.addEventListener('ap-lesson-progress-changed', async () => renderLessonProgress(await loadLessonIndex()));
  window.addEventListener('storage', async event => {
    if (event.key === 'ap-study-bookmarks-v1') renderBookmarkSummary(getBookmarks());
    if (event.key === LESSON_PROGRESS_KEY) renderLessonProgress(await loadLessonIndex());
    if (event.key === PRACTICE_HISTORY_KEY) renderPracticeProgress(await fetchJson('json/practice/ap-original-practice-v1.json'));
  });
  document.addEventListener('DOMContentLoaded', () => init().catch(error => console.error('[home] init failed', error)));
})();