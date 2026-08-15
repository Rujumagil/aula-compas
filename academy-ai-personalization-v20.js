(() => {
  const VERSION = '20.0.0';
  const TARGET_PATH = '/api/public/web-chat/compas-academy/messages';
  const nativeFetch = window.fetch.bind(window);
  let cachedProfile = null;
  let cachedUserId = null;
  let loadingProfile = null;

  const userId = () => state?.user?.id || state?.session?.user?.id || '';
  const isManager = () => (typeof isAdmin === 'function' && isAdmin()) || (typeof isInstructor === 'function' && isInstructor());

  function normalizeFocus(value) {
    return Array.isArray(value) ? value.map(String).slice(0, 6) : [];
  }

  function safeProfile(row) {
    if (!row) return null;
    return {
      goal: row.goal || undefined,
      experienceLevel: row.experience_level || undefined,
      focusAreas: normalizeFocus(row.focus_areas),
      weeklyMinutes: Number(row.weekly_minutes || 0) || undefined,
      objective: row.objective_text ? String(row.objective_text).trim().slice(0, 300) : undefined,
      recommendedCourseSlug: row.recommended_course_slug || undefined,
    };
  }

  async function loadProfile() {
    const uid = userId();
    if (!uid || isManager() || typeof db === 'undefined') return null;
    if (cachedUserId === uid && cachedProfile !== null) return cachedProfile;
    if (loadingProfile) return loadingProfile;

    loadingProfile = (async () => {
      try {
        const { data, error } = await db
          .from('academy_onboarding_profiles')
          .select('goal,experience_level,focus_areas,weekly_minutes,objective_text,recommended_course_slug')
          .eq('user_id', uid)
          .maybeSingle();
        if (error) throw error;
        cachedUserId = uid;
        cachedProfile = safeProfile(data);
        return cachedProfile;
      } catch (error) {
        console.warn('Tutor IA personalization profile:', error);
        return null;
      } finally {
        loadingProfile = null;
      }
    })();

    return loadingProfile;
  }

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

      const profile = await loadProfile();
      const signals = learningSignals(payload.academyContext);
      const enriched = {
        ...payload,
        academyProfileContext: profile || undefined,
        academyLearningSignals: signals || undefined,
        academyPersonalizationVersion: VERSION,
      };

      return nativeFetch(input, { ...init, body: JSON.stringify(enriched) });
    } catch (error) {
      console.warn('Tutor IA personalization V20:', error);
      return nativeFetch(input, init);
    }
  };

  window.addEventListener('academy:onboarding-updated', () => {
    cachedProfile = null;
    cachedUserId = null;
  });

  console.info(`Compás Academy Tutor personalization V${VERSION}`);
})();