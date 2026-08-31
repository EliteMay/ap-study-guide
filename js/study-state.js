(() => {
  'use strict';

  const DAY = 24 * 60 * 60 * 1000;
  const REVIEW_AFTER_DAYS = 14;
  const REVIEW_AFTER_MS = REVIEW_AFTER_DAYS * DAY;
  const LESSON_PASS_RATIO = 0.75;
  const WRITTEN_MIN_CHARS = 12;
  const CASE_MIN_CHARS = 20;

  const KEYS = {
    lesson:'ap-study-lesson-progress-v1',
    practice:'ap-study-practice-history-v1',
    cases:'ap-study-case-history-v1',
    mock:'ap-study-mock-history-v1',
    mockA:'ap-study-mock-active-a-v1',
    mockB:'ap-study-mock-active-b-v1',
    bookmarks:'ap-study-bookmarks-v1',
    recent:'ap-study-recent-v1',
    test:'ap-study-test-history-v1',
    theme:'ap-study-theme'
  };

  const LEGACY_KEYS = [
    'security-terms-checked','network-terms-checked','database-terms-checked',
    'algorithm-terms-checked','system-terms-checked','management-terms-checked'
  ];

  function reportStorageFailure(operation, key, error) {
    window.APDiagnostics?.storageFailure?.(operation, key, error);
  }

  function readObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (error) {
      reportStorageFailure('read-object', key, error);
      return {};
    }
  }

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      reportStorageFailure('read-array', key, error);
      return [];
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      reportStorageFailure('write-json', key, error);
      return false;
    }
  }

  function isStale(updatedAt, now = Date.now()) {
    const value = Number(updatedAt || 0);
    return value > 0 && now - value >= REVIEW_AFTER_MS;
  }

  function appendRecentScore(record, score, max = 5) {
    const previous = Array.isArray(record?.recentScores)
      ? record.recentScores.map(Number).filter(Number.isFinite)
      : Number.isFinite(Number(record?.latestScore)) ? [Number(record.latestScore)] : [];
    return [...previous, Number(score)].slice(-max);
  }

  function lessonState(record, now = Date.now()) {
    if (!record || !Number(record.latestAnswered || 0)) return { state:'unattempted', label:'未着手', mastered:false, due:false };
    const total = Number(record.total || 0);
    const answered = Number(record.latestAnswered || 0);
    const correct = Number(record.latestCorrect || 0);
    const full = total > 0 && answered >= total;
    const ratio = full ? correct / total : 0;
    const passed = full && ratio >= LESSON_PASS_RATIO;
    const due = passed && isStale(record.updatedAt, now);
    if (passed && !due) return { state:'mastered', label:'理解確認済み', mastered:true, due:false, ratio };
    if (due) return { state:'due', label:'復習期限', mastered:false, due:true, ratio };
    return { state:'retry', label:full ? '要復習' : '途中', mastered:false, due:false, ratio };
  }

  function practiceState(question, record, now = Date.now()) {
    if (!record) return { state:'unattempted', label:'未挑戦', mastered:false, due:false };
    const due = isStale(record.updatedAt, now);
    if (question?.type === 'written') {
      const answerLength = String(record.latestAnswer || '').trim().length;
      const mastered = Number(record.latestScore || 0) >= 2 && answerLength >= WRITTEN_MIN_CHARS && !due;
      if (mastered) return { state:'mastered', label:'理解済み', mastered:true, due:false };
      if (due && Number(record.latestScore || 0) >= 2 && answerLength >= WRITTEN_MIN_CHARS) return { state:'due', label:'復習期限', mastered:false, due:true };
      return { state:'retry', label:'要復習', mastered:false, due:false };
    }
    const scores = (Array.isArray(record.recentScores) ? record.recentScores : [record.latestScore])
      .map(Number).filter(Number.isFinite).slice(-3);
    const recentCorrect = scores.filter(score => score >= 1).length;
    const latestCorrect = Number(record.latestScore || 0) >= 1 || record.latestCorrect === true;
    const mastered = scores.length >= 2 && recentCorrect >= 2 && latestCorrect && !due;
    if (mastered) return { state:'mastered', label:'理解済み', mastered:true, due:false };
    if (due && scores.length >= 2 && recentCorrect >= 2 && latestCorrect) return { state:'due', label:'復習期限', mastered:false, due:true };
    return { state:'retry', label:scores.length < 2 && latestCorrect ? '確認中' : '要復習', mastered:false, due:false };
  }

  function caseQuestionState(record, now = Date.now()) {
    if (!record) return { state:'unattempted', label:'未挑戦', mastered:false, due:false };
    const answerLength = String(record.latestAnswer || '').trim().length;
    const due = isStale(record.updatedAt, now);
    const qualified = Number(record.latestScore || 0) >= 2 && answerLength >= CASE_MIN_CHARS;
    if (qualified && !due) return { state:'mastered', label:'理解済み', mastered:true, due:false };
    if (qualified && due) return { state:'due', label:'復習期限', mastered:false, due:true };
    return { state:'retry', label:'要復習', mastered:false, due:false };
  }

  function caseState(item, record, now = Date.now()) {
    const questions = Array.isArray(item?.questions) ? item.questions : [];
    const saved = record?.questions || {};
    if (!questions.length || !Object.keys(saved).length) return { state:'unattempted', label:'未挑戦', mastered:false, due:false };
    const states = questions.map(question => caseQuestionState(saved[question.id], now));
    if (states.every(state => state.mastered)) return { state:'mastered', label:'理解済み', mastered:true, due:false };
    if (states.some(state => state.due)) return { state:'due', label:'復習期限', mastered:false, due:true };
    return { state:'retry', label:'途中・要復習', mastered:false, due:false };
  }

  function recognizedKeys() {
    return [...Object.values(KEYS), ...LEGACY_KEYS];
  }

  window.APStudyState = {
    config:{ REVIEW_AFTER_DAYS, LESSON_PASS_RATIO, WRITTEN_MIN_CHARS, CASE_MIN_CHARS },
    keys:KEYS,
    legacyKeys:[...LEGACY_KEYS],
    recognizedKeys,
    readObject, readArray, writeJson,
    isStale, appendRecentScore,
    lessonState, practiceState, caseQuestionState, caseState
  };
})();