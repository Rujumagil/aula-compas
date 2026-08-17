(() => {
  const VERSION = '1.0.0';
  const TABLE_MAP = Object.freeze({
    profiles: 'academy_profiles',
    courses: 'academy_courses',
    modules: 'academy_modules',
    lessons: 'academy_lessons',
    enrollments: 'academy_enrollments',
    lesson_progress: 'academy_lesson_progress',
    lesson_notes: 'academy_lesson_notes',
    resources: 'academy_resources',
    lesson_blocks: 'academy_lesson_blocks',
    block_responses: 'academy_block_responses',
    course_versions: 'academy_course_versions',
    products: 'academy_products',
    product_contents: 'academy_product_contents',
    student_access: 'academy_student_access',
    resource_access: 'academy_resource_access',
    access_history: 'academy_access_history',
    orders: 'academy_orders',
    assessments: 'academy_assessments',
    assessment_questions: 'academy_assessment_questions',
    assessment_options: 'academy_assessment_options',
    assessment_options_public: 'academy_assessment_options_public',
    assessment_attempts: 'academy_assessment_attempts',
    assessment_answers: 'academy_assessment_answers',
    certificates: 'academy_certificates',
    certificate_public_registry: 'academy_certificate_public_registry',
    tags: 'academy_tags',
    contact_tags: 'academy_contact_tags'
  });

  function install() {
    if (!window.supabase?.createClient || window.__COMPAS_EVOLUTION_SUPABASE_COMPAT__) return;

    const originalCreateClient = window.supabase.createClient.bind(window.supabase);
    window.supabase.createClient = (...args) => {
      const client = originalCreateClient(...args);
      const originalFrom = client.from.bind(client);
      client.from = relation => originalFrom(TABLE_MAP[relation] || relation);
      return client;
    };

    window.__COMPAS_EVOLUTION_SUPABASE_COMPAT__ = {
      version: VERSION,
      tableMap: TABLE_MAP,
      target: 'Compás Evolution 1.0'
    };
    console.info(`Compás Academy → Evolution Supabase compatibility v${VERSION}`);
  }

  install();
})();
