(() => {
  const VERSION = '32.0.0';
  let scheduled = false;

  const currentRoute = () => String(location.hash || '#home').replace(/^#/, '').split('/')[0] || 'home';

  function assessmentAnswered(question) {
    const checked = question.querySelector('input:checked');
    const textarea = question.querySelector('textarea');
    return Boolean(checked || (textarea && textarea.value.trim().length > 0));
  }

  function updateAssessmentProgress() {
    const form = document.querySelector('[data-assessment-form]');
    if (!form) return;
    const questions = [...form.querySelectorAll('.assessment-question')];
    if (!questions.length) return;

    questions.forEach(question => question.classList.toggle('is-answered-v32', assessmentAnswered(question)));
    const answered = questions.filter(assessmentAnswered).length;
    const percent = Math.round((answered / questions.length) * 100);

    let progress = document.querySelector('.assessment-v32-progress');
    if (!progress) {
      progress = document.createElement('section');
      progress.className = 'assessment-v32-progress';
      progress.setAttribute('aria-label', 'Progreso de la evaluación');
      progress.innerHTML = '<span>Progreso de respuestas</span><div class="assessment-v32-track"><span></span></div><strong></strong>';
      form.insertAdjacentElement('beforebegin', progress);
    }
    progress.querySelector('.assessment-v32-track span').style.width = `${percent}%`;
    progress.querySelector('strong').textContent = `${answered}/${questions.length} respondidas`;
    progress.setAttribute('aria-valuenow', String(percent));
  }

  function enhanceAssessment() {
    const shell = document.querySelector('.assessment-shell');
    if (!shell) return;
    document.body.dataset.academyJourney = 'assessment';
    document.title = `${shell.querySelector('.assessment-hero h1')?.textContent?.trim() || 'Evaluación'} | Compás Academy`;
    updateAssessmentProgress();
    const form = shell.querySelector('[data-assessment-form]');
    if (form && !form.dataset.journeyV32) {
      form.dataset.journeyV32 = 'true';
      form.addEventListener('input', updateAssessmentProgress);
      form.addEventListener('change', updateAssessmentProgress);
    }
  }

  function enhanceCertificates() {
    const page = document.querySelector('.cert-v16-page, .cert-v16-view, .cert-v16-locked');
    if (!page) return;
    document.body.dataset.academyJourney = 'certificates';
    document.querySelectorAll('.cert-v16-card').forEach(card => {
      const status = card.querySelector('.cert-v16-card-top span')?.textContent?.trim().toLowerCase() || '';
      card.classList.toggle('is-issued-v32', status.includes('emitido'));
      card.classList.toggle('is-ready-v32', status.includes('listo'));
      card.classList.toggle('is-progress-v32', status.includes('progreso'));
    });
    const sheet = document.querySelector('.cert-v16-sheet');
    if (sheet) {
      sheet.setAttribute('aria-label', 'Certificado de finalización Compás Academy');
      document.title = 'Certificado | Compás Academy';
    } else if (document.querySelector('.cert-v16-page')) {
      document.title = 'Mis certificados | Compás Academy';
    }
  }

  function enhanceTutor() {
    const panel = document.querySelector('.tutor-v10-panel');
    const page = document.querySelector('.tutor-v10-page');
    if (!panel && !page) return;
    if (panel) {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Tutor IA de Compás Academy');
      panel.dataset.journeyV32 = 'true';
    }
    document.querySelector('.tutor-v10-fab')?.setAttribute('aria-label', 'Abrir Tutor IA');
    if (page) {
      document.body.dataset.academyJourney = 'tutor';
      document.title = 'Tutor IA | Compás Academy';
    }
  }

  function onboardingCompletion(modal) {
    const goal = Boolean(modal.querySelector('input[name="goal"]:checked'));
    const experience = Boolean(modal.querySelector('input[name="experience_level"]:checked'));
    const focus = Boolean(modal.querySelector('input[name="focus"]:checked'));
    const time = Boolean(modal.querySelector('select[name="weekly_minutes"]')?.value);
    return [goal, experience, focus, time];
  }

  function updateOnboardingProgress() {
    const modal = document.querySelector('.onboarding-v19-modal');
    if (!modal) return;
    const completed = onboardingCompletion(modal);
    let progress = modal.querySelector('.onboarding-v32-progress');
    if (!progress) {
      progress = document.createElement('div');
      progress.className = 'onboarding-v32-progress';
      progress.setAttribute('aria-label', 'Progreso del diagnóstico inicial');
      progress.innerHTML = '<span>1 · Objetivo</span><span>2 · Experiencia</span><span>3 · Intereses</span><span>4 · Ritmo</span>';
      modal.querySelector('.onboarding-v19-heading')?.insertAdjacentElement('afterend', progress);
    }
    [...progress.children].forEach((step, index) => step.classList.toggle('done', completed[index]));
    const count = completed.filter(Boolean).length;
    progress.setAttribute('data-complete', String(count));
    progress.setAttribute('aria-label', `Diagnóstico: ${count} de 4 pasos configurados`);
  }

  function enhanceOnboarding() {
    const modal = document.querySelector('.onboarding-v19-modal');
    if (!modal) return;
    document.body.dataset.academyJourney = 'onboarding';
    updateOnboardingProgress();
    if (!modal.dataset.journeyV32) {
      modal.dataset.journeyV32 = 'true';
      modal.addEventListener('change', updateOnboardingProgress);
      modal.addEventListener('input', updateOnboardingProgress);
    }
  }

  function enhanceRecommendation() {
    const card = document.querySelector('[data-onboarding-recommendation]');
    if (!card || card.dataset.journeyV32) return;
    card.dataset.journeyV32 = 'true';
    card.setAttribute('aria-label', 'Ruta de aprendizaje recomendada');
  }

  function enhanceVerifier() {
    if (!document.querySelector('.verify-v16')) return;
    document.documentElement.dataset.academyJourney = VERSION;
    document.querySelector('.verify-v16-card')?.setAttribute('aria-label', 'Verificador público de certificados Compás Academy');
  }

  function handleEscape(event) {
    if (event.key !== 'Escape') return;
    const onboarding = document.querySelector('.onboarding-v19-overlay');
    if (onboarding) {
      onboarding.querySelector('[data-onboarding-close]')?.click();
      return;
    }
    const tutor = document.querySelector('.tutor-v10-panel-shell.open');
    if (tutor) tutor.querySelector('header button')?.click();
  }

  function run() {
    scheduled = false;
    document.documentElement.dataset.academyJourney = VERSION;
    enhanceAssessment();
    enhanceCertificates();
    enhanceTutor();
    enhanceOnboarding();
    enhanceRecommendation();
    enhanceVerifier();

    const route = currentRoute();
    if (!document.querySelector('.onboarding-v19-modal') && !['assessment','certificate','certificates'].includes(route) && !document.querySelector('.tutor-v10-page')) {
      if (document.body.dataset.academyJourney && ['assessment','certificates','tutor','onboarding'].includes(document.body.dataset.academyJourney)) {
        delete document.body.dataset.academyJourney;
      }
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  }

  function start() {
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', schedule);
    document.addEventListener('keydown', handleEscape);
    schedule();
    window.ACADEMY_PREMIUM_JOURNEY_V32 = Object.freeze({ version: VERSION, refresh: schedule });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
