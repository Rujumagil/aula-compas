(() => {
  const VERSION = '20.0.0';
  const TARGET_PATH = '/api/public/web-chat/compas-academy/messages';
  const nativeFetch = window.fetch.bind(window);

  function learningSignals(context) {
    const courseId = context?.courseId;
    if (!courseId || !Array.isArray(state?.courses)) return null;
    const course = state.courses.find(item => String(item.id) === String(courseId));
    if (!course) return null;
    const lessons = typeof allLessons === 'function' ? allLessons(course) : (course.modules || []).flatMap(module => module.lessons || []);
    const completed = lessons.filter(lesson => typeof isLessonCompleted === 'function' && isLessonCompleted(lesson.id)).length;
    return {
      totalLessons: lessons.length,
      completedLessons: completed,
      remainingLessons: Math.max(0, lessons.length - completed),
      progressPercent: typeof courseProgress === 'function' ? courseProgress(course) : context?.progress,
      featured: Boolean(course.featured),
      category: course.category || undefined,
    };
  }

  function isTutorRequest(input, init) {
    try {
      const url = new URL(typeof input === 'string' ? input : input?.url, location.href);
      return url.pathname === TARGET_PATH && String(init?.method || 'GET').toUpperCase() === 'POST';
    } catch {
      return false;
    }
  }

  window.fetch = async function academyPersonalizedFetch(input, init = {}) {
    if (!isTutorRequest(input, init) || typeof init.body !== 'string') return nativeFetch(input, init);

    try {
      const payload = JSON.parse(init.body);
      if (!payload || typeof payload !== 'object' || !payload.academyContext) return nativeFetch(input, init);

      const signals = learningSignals(payload.academyContext);
      const enriched = {
        ...payload,
        academyLearningSignals: signals || undefined,
        academyPersonalizationVersion: VERSION,
      };

      return nativeFetch(input, { ...init, body: JSON.stringify(enriched) });
    } catch (error) {
      console.warn('Tutor IA personalization V20:', error);
      return nativeFetch(input, init);
    }
  };

  console.info(`Compás Academy Tutor personalization V${VERSION}`);
})();