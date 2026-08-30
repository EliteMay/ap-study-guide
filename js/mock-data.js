(() => {
  'use strict';

  const CONFIG = 'json/mock/mock-config.json';
  const cache = new Map();

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function load(prefix = '') {
    const key = String(prefix || '');
    if (cache.has(key)) return cache.get(key);
    const promise = (async () => {
      if (!window.APPracticeData?.load) throw new Error('practice-data.js が読み込まれていません。');
      if (!window.APCaseData?.load) throw new Error('case-data.js が読み込まれていません。');
      const config = await fetchJson(`${prefix}${CONFIG}`);
      const [practiceBank, caseBank, extraA] = await Promise.all([
        window.APPracticeData.load(prefix),
        window.APCaseData.load(prefix),
        fetchJson(`${prefix}${config.subjectA.extraFile}`)
      ]);
      const practiceChoices = (practiceBank.questions || []).filter(question => question.type === 'choice' && question.mockEligible !== false);
      const extraChoices = Array.isArray(extraA.questions) ? extraA.questions : [];
      const subjectAQuestions = [...practiceChoices, ...extraChoices];
      const allCases = Array.isArray(caseBank.cases) ? caseBank.cases : [];
      const caseById = new Map(allCases.map(item => [item.id, item]));
      const mandatory = caseById.get(config.subjectB.mandatoryCaseId);
      if (!mandatory) throw new Error(`科目B必須Case ${config.subjectB.mandatoryCaseId} がありません。`);
      const optionalCases = (config.subjectB.optionalCases || []).map(entry => {
        const item = caseById.get(entry.caseId);
        if (!item) throw new Error(`科目B選択Case ${entry.caseId} がありません。`);
        return { ...item, sourceUnitId:item.unitId, unitId:entry.domain, mockDomain:entry.domain };
      });
      const subjectBCases = [{ ...mandatory, mockDomain:'情報セキュリティ' }, ...optionalCases];
      if (practiceChoices.length !== Number(config.subjectA.practiceChoiceCount)) throw new Error(`模試対象4択 ${practiceChoices.length}問 / 設定 ${config.subjectA.practiceChoiceCount}問`);
      if (extraChoices.length !== Number(config.subjectA.extraChoiceCount)) throw new Error(`模試追加4択 ${extraChoices.length}問 / 設定 ${config.subjectA.extraChoiceCount}問`);
      if (subjectAQuestions.length !== Number(config.subjectA.questionCount)) throw new Error(`科目A ${subjectAQuestions.length}問 / 設定 ${config.subjectA.questionCount}問`);
      if (subjectBCases.length !== Number(config.subjectB.offeredMainQuestions)) throw new Error(`科目B ${subjectBCases.length}Case / 設定 ${config.subjectB.offeredMainQuestions}Case`);
      return { config, practiceBank, caseBank, extraA, subjectAQuestions, subjectBCases };
    })().catch(error => { cache.delete(key); throw error; });
    cache.set(key, promise);
    return promise;
  }

  window.APMockData = { load, configPath:CONFIG };
})();