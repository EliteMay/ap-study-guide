(() => {
  'use strict';

  const CONFIG = 'json/mock/mock-config.json';

  async function fetchJson(path) {
    const response = await fetch(path, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function load(prefix = '') {
    if (!window.APPracticeData?.load) throw new Error('practice-data.js が読み込まれていません。');
    if (!window.APCaseData?.load) throw new Error('case-data.js が読み込まれていません。');

    const config = await fetchJson(`${prefix}${CONFIG}`);
    const [practiceBank, caseBank, extraA] = await Promise.all([
      window.APPracticeData.load(prefix),
      window.APCaseData.load(prefix),
      fetchJson(`${prefix}${config.subjectA.extraFile}`)
    ]);

    const practiceChoices = (practiceBank.questions || []).filter(question => question.type === 'choice');
    const extraChoices = Array.isArray(extraA.questions) ? extraA.questions : [];
    const subjectAQuestions = [...practiceChoices, ...extraChoices];
    const subjectBCases = Array.isArray(caseBank.cases) ? caseBank.cases : [];

    if (practiceChoices.length !== Number(config.subjectA.practiceChoiceCount)) {
      throw new Error(`既存4択 ${practiceChoices.length}問 / 設定 ${config.subjectA.practiceChoiceCount}問`);
    }
    if (extraChoices.length !== Number(config.subjectA.extraChoiceCount)) {
      throw new Error(`模試追加4択 ${extraChoices.length}問 / 設定 ${config.subjectA.extraChoiceCount}問`);
    }
    if (subjectAQuestions.length !== Number(config.subjectA.questionCount)) {
      throw new Error(`科目A ${subjectAQuestions.length}問 / 設定 ${config.subjectA.questionCount}問`);
    }

    return {
      config,
      practiceBank,
      caseBank,
      extraA,
      subjectAQuestions,
      subjectBCases
    };
  }

  window.APMockData = { load, configPath:CONFIG };
})();
