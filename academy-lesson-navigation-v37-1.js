(() => {
  const VERSION = '37.1.0';

  function hashParts() {
    return location.hash.replace(/^#/, '').split('/');
  }

  function lessonList(course) {
    try {
      if (typeof allLessons === 'function') return allLessons(course) || [];
    } catch (_) {}
    return (course?.modules || []).flatMap(module => module.lessons || []);
  }

  function getCourse(courseId) {
    try {
      if (typeof findCourse === 'function') return findCourse(courseId);
    } catch (_) {}
    return (typeof state !== 'undefined' ? state.courses || [] : [])
      .find(course => String(course.id) === String(courseId));
  }

  function nextLesson(course, lessonId) {
    const lessons = lessonList(course);
    const index = lessons.findIndex(lesson => String(lesson.id) === String(lessonId));
    if (index < 0 || index >= lessons.length - 1) return null;
    return lessons[index + 1];
  }

  function install() {
    if (typeof window.completeLesson !== 'function' || window.completeLesson.__academyNavigationV371) return;

    const enhancedCompleteLesson = async function(lessonId, completed) {
      const payload = {
        user_id: state.user.id,
        lesson_id: lessonId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await db
        .from('lesson_progress')
        .upsert(payload, { onConflict: 'user_id,lesson_id' })
        .select()
        .single();

      if (error) {
        console.error(error);
        if (typeof showToast === 'function') showToast('No se pudo guardar el progreso.', 'error');
        return null;
      }

      const index = state.progressRows.findIndex(row => String(row.lesson_id) === String(lessonId));
      if (index >= 0) state.progressRows[index] = data;
      else state.progressRows.push(data);

      if (typeof showToast === 'function') {
        showToast(completed ? 'Lección completada.' : 'Lección marcada como pendiente.', 'success');
      }

      const [page, courseId, currentLessonId] = hashParts();
      const isCurrentLesson = page === 'lesson' && String(currentLessonId) === String(lessonId);

      if (completed && isCurrentLesson) {
        const course = getCourse(courseId);
        const following = course ? nextLesson(course, lessonId) : null;

        if (following) {
          location.hash = `lesson/${course.id}/${following.id}`;
          return data;
        }

        if (course) {
          location.hash = `course/${course.id}`;
          return data;
        }
      }

      if (typeof route === 'function') await route();
      return data;
    };

    enhancedCompleteLesson.__academyNavigationV371 = true;
    window.completeLesson = enhancedCompleteLesson;
    document.documentElement.dataset.academyLessonNavigation = VERSION;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();