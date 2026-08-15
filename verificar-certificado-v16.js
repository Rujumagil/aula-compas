(() => {
  const result = document.querySelector('#verify-result');
  const form = document.querySelector('#verify-form');
  const input = document.querySelector('#verify-code');
  const cfg = window.SUPABASE_CONFIG;

  function esc(value = '') {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function normalizeCode(value = '') {
    return String(value).trim().toUpperCase().replace(/\s+/g, '');
  }

  function fmtDate(value) {
    if (!value) return '';
    try { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date(value)); }
    catch { return String(value); }
  }

  function renderInvalid(message = 'No encontramos un certificado válido con ese código.') {
    result.innerHTML = `<section class="verify-v16-result invalid"><strong>Certificado no verificado</strong><p>${esc(message)}</p></section>`;
  }

  async function verify(code) {
    code = normalizeCode(code);
    input.value = code;
    if (!/^CA-[A-F0-9]{16}$/.test(code)) {
      renderInvalid('El formato del código no es válido. Revisa los caracteres e inténtalo de nuevo.');
      return;
    }
    if (!cfg?.url || !cfg?.publishableKey || !window.supabase?.createClient) {
      renderInvalid('El servicio de verificación no está disponible en este momento.');
      return;
    }

    result.innerHTML = `<section class="verify-v16-result"><strong>Consultando registro…</strong></section>`;
    const client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    const { data, error } = await client
      .from('certificate_public_registry')
      .select('verification_code,recipient_name,course_title,issued_at,status')
      .eq('verification_code', code)
      .maybeSingle();

    if (error) {
      console.error('Certificate verify:', error);
      renderInvalid('No fue posible consultar el registro. Intenta nuevamente.');
      return;
    }
    if (!data) return renderInvalid();

    const valid = data.status === 'valid';
    result.innerHTML = `<section class="verify-v16-result ${valid ? '' : 'invalid'}">
      <strong>${valid ? '✓ Certificado auténtico y vigente' : 'Certificado revocado'}</strong>
      <dl>
        <dt>Titular</dt><dd>${esc(data.recipient_name)}</dd>
        <dt>Programa</dt><dd>${esc(data.course_title)}</dd>
        <dt>Fecha de emisión</dt><dd>${esc(fmtDate(data.issued_at))}</dd>
        <dt>Código</dt><dd class="verify-v16-code">${esc(data.verification_code)}</dd>
        <dt>Estado</dt><dd>${valid ? 'Vigente' : 'Revocado'}</dd>
      </dl>
    </section>`;
  }

  form?.addEventListener('submit', event => {
    event.preventDefault();
    verify(input.value);
  });

  const initial = new URLSearchParams(location.search).get('code');
  if (initial) verify(initial);
})();
