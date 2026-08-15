(() => {
  const VERIFY_BASE = 'https://aula.proyectocompas.com/verificar-certificado.html?code=';

  const fmtDate = value => value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date(value)) : '';
  const ownCertificate = async courseId => {
    const { data, error } = await db.from('certificates')
      .select('id,course_id,verification_code,recipient_name,issued_at,revoked_at')
      .eq('user_id', state.user.id)
      .eq('course_id', courseId)
      .is('revoked_at', null)
      .order('issued_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  };

  const eligibility = async courseId => {
    const { data, error } = await db.rpc('get_certificate_eligibility', { target_course: courseId });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  };

  const issue = async courseId => {
    const { data, error } = await db.rpc('issue_academy_certificate', { target_course: courseId });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  };

  function requirementLine(label, done, total) {
    const ok = Number(done) >= Number(total) && Number(total) >= 0;
    return `<li class="cert-v16-req ${ok ? 'done' : ''}"><span>${ok ? '✓' : '○'}</span><strong>${escapeHtml(label)}</strong><em>${done}/${total}</em></li>`;
  }

  async function renderCertificatesV16() {
    renderShell('certificates');
    const page = document.querySelector('#page');
    if (!page) return;
    page.innerHTML = `<section class="cert-v16-loading"><div class="spinner"></div><p>Revisando tus requisitos y certificados…</p></section>`;

    const courses = (state.courses || []).filter(c => allLessons(c).length > 0);
    if (!courses.length) {
      page.innerHTML = `<section class="empty-state glass"><h1>Mis certificados</h1><p>Cuando tengas un curso con lecciones asignadas, aquí aparecerán sus requisitos y reconocimientos.</p><a class="btn btn-primary" href="#catalog">Explorar Academy</a></section>`;
      return;
    }

    const rows = await Promise.all(courses.map(async course => {
      try {
        const [elig, cert] = await Promise.all([eligibility(course.id), ownCertificate(course.id)]);
        return { course, elig, cert, error: null };
      } catch (error) {
        console.error('Certificate eligibility:', error);
        return { course, elig: null, cert: null, error };
      }
    }));

    const available = rows.filter(r => r.cert || r.elig?.eligible).length;
    page.innerHTML = `<section class="cert-v16-page">
      <header class="cert-v16-head">
        <div><span class="eyebrow">Credenciales Compás Academy</span><h1>Mis certificados</h1><p>Los certificados verificables se habilitan cuando completas todas las lecciones y apruebas las evaluaciones publicadas del curso.</p></div>
        <aside><strong>${available}</strong><span>listos o emitidos</span></aside>
      </header>
      <div class="cert-v16-grid">
        ${rows.map(({ course, elig, cert, error }) => {
          if (error || !elig) return `<article class="cert-v16-card glass"><h2>${escapeHtml(course.title)}</h2><p>No pudimos comprobar los requisitos en este momento.</p><button class="btn btn-secondary" onclick="location.reload()">Reintentar</button></article>`;
          const ready = Boolean(cert || elig.eligible);
          return `<article class="cert-v16-card glass ${ready ? 'ready' : ''}">
            <div class="cert-v16-card-top"><img src="${escapeHtml(cover(course))}" alt="${escapeHtml(course.title)}" onerror="imageErrorFallback(event,'brand/academy/logo.png?v=11.1.0')"><span>${cert ? 'Emitido' : ready ? 'Listo para emitir' : 'En progreso'}</span></div>
            <div class="cert-v16-card-body"><h2>${escapeHtml(course.title)}</h2>
              <ul>${requirementLine('Lecciones completadas', elig.completed_lessons, elig.total_lessons)}${requirementLine('Evaluaciones aprobadas', elig.passed_assessments, elig.required_assessments)}</ul>
              ${cert ? `<p class="cert-v16-code">Código <strong>${escapeHtml(cert.verification_code || 'Pendiente')}</strong></p>` : ''}
              <a class="btn ${ready ? 'btn-primary' : 'btn-secondary'}" href="${ready ? `#certificate/${course.id}` : `#course/${course.id}`}">${cert ? 'Ver certificado' : ready ? 'Emitir certificado' : 'Continuar curso'}</a>
            </div>
          </article>`;
        }).join('')}
      </div>
      <footer class="cert-v16-public-note"><strong>Verificación pública</strong><p>Cada certificado emitido incluye un código único y una página pública que confirma únicamente nombre, curso, fecha y vigencia. No se publica correo ni información académica privada.</p><a href="verificar-certificado.html" target="_blank" rel="noopener">Abrir verificador →</a></footer>
    </section>`;
  }

  function loadQr(target, text) {
    if (!target || !text) return;
    const draw = () => {
      target.innerHTML = '';
      try { new QRCode(target, { text, width: 132, height: 132, correctLevel: QRCode.CorrectLevel.M }); }
      catch (error) { target.innerHTML = `<a href="${escapeHtml(text)}" target="_blank" rel="noopener">Verificar certificado</a>`; }
    };
    if (window.QRCode) return draw();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
    script.onload = draw;
    script.onerror = () => { target.innerHTML = `<a href="${escapeHtml(text)}" target="_blank" rel="noopener">Verificar certificado</a>`; };
    document.head.appendChild(script);
  }

  async function renderCertificateV16(courseId) {
    renderShell('certificate');
    const page = document.querySelector('#page');
    const course = findCourse(courseId);
    if (!page || !course) return;
    page.innerHTML = `<section class="cert-v16-loading"><div class="spinner"></div><p>Validando requisitos…</p></section>`;

    try {
      const elig = await eligibility(course.id);
      if (!elig?.eligible) {
        page.innerHTML = `<section class="cert-v16-locked glass"><a class="back-link" href="#certificates">← Volver</a><span class="eyebrow">Certificado bloqueado</span><h1>${escapeHtml(course.title)}</h1><p>El certificado se emite únicamente cuando cumples los requisitos académicos.</p><ul>${requirementLine('Lecciones completadas', elig?.completed_lessons || 0, elig?.total_lessons || allLessons(course).length)}${requirementLine('Evaluaciones aprobadas', elig?.passed_assessments || 0, elig?.required_assessments || 0)}</ul><a class="btn btn-primary" href="#course/${course.id}">Continuar curso</a></section>`;
        return;
      }

      let cert = await ownCertificate(course.id);
      if (!cert) cert = await issue(course.id);
      const code = cert.verification_code;
      const verifyUrl = `${VERIFY_BASE}${encodeURIComponent(code)}`;
      const name = cert.recipient_name || displayName() || 'Alumno Compás Academy';
      const issued = cert.issued_at || new Date().toISOString();

      page.innerHTML = `<section class="cert-v16-view">
        <header class="cert-v16-toolbar"><a class="back-link" href="#certificates">← Mis certificados</a><div><button class="btn btn-secondary" id="copy-cert-link">Copiar verificación</button><button class="btn btn-primary" id="print-cert">Guardar / imprimir PDF</button></div></header>
        <article class="cert-v16-sheet" id="certificate-sheet">
          <div class="cert-v16-brand"><img src="brand/academy/logo.png?v=11.1.0" alt="Compás Academy"><span>Proyecto Compás Evolution</span></div>
          <p class="cert-v16-kicker">Certificado de finalización</p>
          <h1>Compás Academy certifica que</h1>
          <h2>${escapeHtml(name)}</h2>
          <p class="cert-v16-copy">ha completado satisfactoriamente el programa</p>
          <h3>${escapeHtml(course.title)}</h3>
          <div class="cert-v16-proof"><div><span>Fecha de emisión</span><strong>${escapeHtml(fmtDate(issued))}</strong></div><div><span>Código de verificación</span><strong>${escapeHtml(code)}</strong></div></div>
          <footer><div><strong>Compás Academy</strong><span>Aprender haciendo</span></div><div id="certificate-qr" class="cert-v16-qr" aria-label="Código QR de verificación"></div></footer>
        </article>
        <div class="cert-v16-verify-link"><span>Verificación pública:</span><a href="${escapeHtml(verifyUrl)}" target="_blank" rel="noopener">${escapeHtml(verifyUrl)}</a></div>
      </section>`;
      loadQr(document.querySelector('#certificate-qr'), verifyUrl);
      document.querySelector('#print-cert')?.addEventListener('click', () => window.print());
      document.querySelector('#copy-cert-link')?.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(verifyUrl); showToast('Enlace de verificación copiado.', 'success'); }
        catch { showToast('No se pudo copiar el enlace.', 'error'); }
      });
    } catch (error) {
      console.error('Certificate V16:', error);
      page.innerHTML = `<section class="cert-v16-locked glass"><a class="back-link" href="#certificates">← Volver</a><h1>No pudimos emitir el certificado</h1><p>${escapeHtml(error?.message || 'Intenta nuevamente.')}</p></section>`;
    }
  }

  try {
    renderCertificates = renderCertificatesV16;
    renderCertificate = renderCertificateV16;
  } catch (error) {
    console.error('Academy Certificates V16:', error);
  }
})();
