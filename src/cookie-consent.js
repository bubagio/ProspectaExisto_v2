// Prospecta con Éxito - Cookie Consent Management Partnership (AEPD & GDPR Compliant)

(function () {
  // 1. Initialize dataLayer and Google Consent Mode v2 (default to denied)
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }

  // Load stored choice if it exists
  const STORED_KEY = 'prospecta_cookie_consent_v2';
  const storedConsent = localStorage.getItem(STORED_KEY);

  if (storedConsent) {
    const preferences = JSON.parse(storedConsent);
    gtag('consent', 'default', {
      analytics_storage: preferences.analytics ? 'granted' : 'denied',
      ad_storage: preferences.ads ? 'granted' : 'denied',
      ad_user_data: preferences.ads ? 'granted' : 'denied',
      ad_personalization: preferences.ads ? 'granted' : 'denied',
    });
    if (preferences.analytics) {
      loadGoogleAnalytics();
    }
  } else {
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }

  // Helper to dynamically load GA4 if consent given
  function loadGoogleAnalytics() {
    if (window.gaTagMounted) return;
    window.gaTagMounted = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-DYB6HCJ93F';
    document.head.appendChild(script);

    const configScript = document.createElement('script');
    configScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-DYB6HCJ93F');
    `;
    document.head.appendChild(configScript);
  }

  // 2. Inject CSS styles into the DOM for a premium glassmorphic feel
  const style = document.createElement('style');
  style.textContent = `
    .cookie-banner {
      position: fixed;
      bottom: 24px;
      right: 24px;
      left: 24px;
      background: rgba(27, 59, 90, 0.98);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: white;
      padding: 1.8rem;
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      z-index: 99999;
      font-family: 'Inter', sans-serif;
      font-size: 0.88rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: none;
      flex-direction: column;
      gap: 1.25rem;
      max-width: 580px;
      animation: cookieSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @media (min-width: 768px) {
      .cookie-banner { left: auto; }
    }
    @keyframes cookieSlideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .cookie-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      color: #5D9CB5;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cookie-text {
      line-height: 1.6;
      color: #cbd5e1;
      margin: 0;
    }
    .cookie-text a {
      color: #5D9CB5;
      text-decoration: underline;
      font-weight: 500;
    }
    .cookie-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .cookie-btn {
      padding: 0.75rem 0.5rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
      color: white;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
      text-align: center;
      transition: all 0.2s;
    }
    .cookie-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: #5D9CB5;
    }

    /* Modal Styling */
    .cookie-modal {
      position: fixed;
      inset: 0;
      background: rgba(27, 59, 90, 0.6);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      font-family: 'Inter', sans-serif;
    }
    .cookie-modal-content {
      background: white;
      border-radius: 24px;
      padding: 2.2rem;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
      color: #1b3b5a;
      animation: cookieModalScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @keyframes cookieModalScale {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }
    .cookie-modal-title {
      font-family: 'Outfit', sans-serif;
      margin-top: 0;
      margin-bottom: 0.75rem;
      font-size: 1.35rem;
      color: #1B3B5A;
      font-weight: 700;
    }
    .cookie-modal-desc {
      font-size: 0.85rem;
      line-height: 1.6;
      color: #6b7c8d;
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .cookie-option-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.1rem 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .cookie-option-info {
      flex: 1;
      padding-right: 1.5rem;
    }
    .cookie-option-info h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #1B3B5A;
    }
    .cookie-option-info p {
      margin: 5px 0 0 0;
      font-size: 0.78rem;
      line-height: 1.4;
      color: #6b7c8d;
    }
    .cookie-switch {
      position: relative;
      display: inline-block;
      width: 46px;
      height: 26px;
      flex-shrink: 0;
    }
    .cookie-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .cookie-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: #cbd5e1;
      transition: .3s;
      border-radius: 26px;
    }
    .cookie-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }
    .cookie-switch input:checked + .cookie-slider {
      background-color: #5D9CB5;
    }
    .cookie-switch input:checked + .cookie-slider:before {
      transform: translateX(20px);
    }
    .cookie-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 2rem;
    }
    .cookie-modal-btn {
      padding: 0.7rem 1.6rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: white;
      color: #1B3B5A;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .cookie-modal-btn.primary {
      background: #1B3B5A;
      color: white;
      border-color: #1B3B5A;
    }
    .cookie-modal-btn:hover {
      box-shadow: 0 4px 12px rgba(27, 59, 90, 0.15);
    }
  `;
  document.head.appendChild(style);

  // 3. Inject HTML Elements
  window.addEventListener('DOMContentLoaded', () => {
    // Check if elements are already loaded
    if (document.getElementById('cookieConsentBanner')) return;

    // Create Banner Container
    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <h3 class="cookie-title">🍪 Configuración de Cookies</h3>
      <p class="cookie-text">
        Utilizamos cookies analíticas para mejorar tu experiencia en nuestra web. Puedes aceptar todas, rechazarlas o configurar tus preferencias. Consulta nuestra <a href="/privacy.html" target="_blank" rel="noopener noreferrer">Política de Privacidad</a> y <a href="/cookies.html" target="_blank" rel="noopener noreferrer">Política de Cookies</a>.
      </p>
      <div class="cookie-buttons">
        <button class="cookie-btn" id="btnCookieReject">Rechazar</button>
        <button class="cookie-btn" id="btnCookieConfig">Configurar</button>
        <button class="cookie-btn" id="btnCookieAccept">Aceptar</button>
      </div>
    `;
    document.body.appendChild(banner);

    // Create Settings Modal Container
    const modal = document.createElement('div');
    modal.id = 'cookieConsentModal';
    modal.className = 'cookie-modal';
    modal.innerHTML = `
      <div class="cookie-modal-content">
        <h3 class="cookie-modal-title">⚙️ Personalizar Preferencias</h3>
        <p class="cookie-modal-desc">
          Selecciona qué tipos de cookies deseas permitir. Las cookies técnicas son obligatorias para el correcto funcionamiento del sitio.
        </p>
        
        <div class="cookie-option-row">
          <div class="cookie-option-info">
            <h4>Técnicas / Necesarias</h4>
            <p>Esenciales para la seguridad, el acceso administrativo y el almacenamiento de tus preferencias de consentimiento. No se pueden desactivar.</p>
          </div>
          <label class="cookie-switch">
            <input type="checkbox" disabled checked>
            <span class="cookie-slider"></span>
          </label>
        </div>

        <div class="cookie-option-row">
          <div class="cookie-option-info">
            <h4>Estadísticas / Analíticas</h4>
            <p>Permiten analizar el uso de la web mediante Google Analytics 4 de forma anónima para optimizar nuestros contenidos comerciales.</p>
          </div>
          <label class="cookie-switch">
            <input type="checkbox" id="cookieOptAnalytics">
            <span class="cookie-slider"></span>
          </label>
        </div>

        <div class="cookie-option-row">
          <div class="cookie-option-info">
            <h4>Publicidad / Personalización</h4>
            <p>Utilizadas por Google para medir la eficacia de anuncios y ofrecer publicidad personalizada de acuerdo a tus intereses.</p>
          </div>
          <label class="cookie-switch">
            <input type="checkbox" id="cookieOptAds">
            <span class="cookie-slider"></span>
          </label>
        </div>

        <div class="cookie-modal-actions">
          <button class="cookie-modal-btn" id="btnCookieModalClose">Cancelar</button>
          <button class="cookie-modal-btn primary" id="btnCookieModalSave">Guardar Elección</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Attach Event Listeners
    document.getElementById('btnCookieAccept').addEventListener('click', () => {
      saveUserPreferences(true, true);
    });

    document.getElementById('btnCookieReject').addEventListener('click', () => {
      saveUserPreferences(false, false);
    });

    document.getElementById('btnCookieConfig').addEventListener('click', () => {
      showConfigModal();
    });

    document.getElementById('btnCookieModalClose').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    document.getElementById('btnCookieModalSave').addEventListener('click', () => {
      const analyticsSec = document.getElementById('cookieOptAnalytics').checked;
      const adsSec = document.getElementById('cookieOptAds').checked;
      saveUserPreferences(analyticsSec, adsSec);
      modal.style.display = 'none';
    });

    // If no stored consent, show the banner
    if (!storedConsent) {
      banner.style.display = 'flex';
    }
  });

  // 4. Save Consensus and Trigger Dynamic Scripts
  function saveUserPreferences(analytics, ads) {
    const preferences = { analytics, ads };
    localStorage.setItem(STORED_KEY, JSON.stringify(preferences));

    // Update Consent Mode v2
    gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: ads ? 'granted' : 'denied',
      ad_user_data: ads ? 'granted' : 'denied',
      ad_personalization: ads ? 'granted' : 'denied',
    });

    if (analytics) {
      loadGoogleAnalytics();
    }

    const banner = document.getElementById('cookieConsentBanner');
    if (banner) banner.style.display = 'none';
  }

  // 5. Open Configuration Panel Modal
  function showConfigModal() {
    const modal = document.getElementById('cookieConsentModal');
    if (!modal) return;

    // Load active settings if any
    const localConsent = localStorage.getItem(STORED_KEY);
    if (localConsent) {
      const preferences = JSON.parse(localConsent);
      document.getElementById('cookieOptAnalytics').checked = !!preferences.analytics;
      document.getElementById('cookieOptAds').checked = !!preferences.ads;
    } else {
      document.getElementById('cookieOptAnalytics').checked = false;
      document.getElementById('cookieOptAds').checked = false;
    }

    modal.style.display = 'flex';
  }

  // Make config modal opener public
  window.openCookieSettings = function () {
    showConfigModal();
  };
})();
