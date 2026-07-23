(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function c(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=c(o);fetch(o.href,i)}})();(function(){window.dataLayer=window.dataLayer||[];function d(){window.dataLayer.push(arguments)}const n="prospecta_cookie_consent_v2",c=localStorage.getItem(n);if(c){const e=JSON.parse(c);d("consent","default",{analytics_storage:e.analytics?"granted":"denied",ad_storage:e.ads?"granted":"denied",ad_user_data:e.ads?"granted":"denied",ad_personalization:e.ads?"granted":"denied"}),e.analytics&&s()}else d("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});function s(){if(window.gaTagMounted)return;window.gaTagMounted=!0;const e=document.createElement("script");e.async=!0,e.src="https://www.googletagmanager.com/gtag/js?id=G-DYB6HCJ93F",document.head.appendChild(e);const t=document.createElement("script");t.textContent=`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-DYB6HCJ93F');
    `,document.head.appendChild(t)}const o=document.createElement("style");o.textContent=`
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
  `,document.head.appendChild(o),window.addEventListener("DOMContentLoaded",()=>{if(document.getElementById("cookieConsentBanner"))return;const e=document.createElement("div");e.id="cookieConsentBanner",e.className="cookie-banner",e.innerHTML=`
      <h3 class="cookie-title">🍪 Configuración de Cookies</h3>
      <p class="cookie-text">
        Utilizamos cookies analíticas para mejorar tu experiencia en nuestra web. Puedes aceptar todas, rechazarlas o configurar tus preferencias. Consulta nuestra <a href="/privacy.html" target="_blank" rel="noopener noreferrer">Política de Privacidad</a> y <a href="/cookies.html" target="_blank" rel="noopener noreferrer">Política de Cookies</a>.
      </p>
      <div class="cookie-buttons">
        <button class="cookie-btn" id="btnCookieReject">Rechazar</button>
        <button class="cookie-btn" id="btnCookieConfig">Configurar</button>
        <button class="cookie-btn" id="btnCookieAccept">Aceptar</button>
      </div>
    `,document.body.appendChild(e);const t=document.createElement("div");t.id="cookieConsentModal",t.className="cookie-modal",t.innerHTML=`
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
    `,document.body.appendChild(t),document.getElementById("btnCookieAccept").addEventListener("click",()=>{i(!0,!0)}),document.getElementById("btnCookieReject").addEventListener("click",()=>{i(!1,!1)}),document.getElementById("btnCookieConfig").addEventListener("click",()=>{a()}),document.getElementById("btnCookieModalClose").addEventListener("click",()=>{t.style.display="none"}),document.getElementById("btnCookieModalSave").addEventListener("click",()=>{const r=document.getElementById("cookieOptAnalytics").checked,l=document.getElementById("cookieOptAds").checked;i(r,l),t.style.display="none"}),c||(e.style.display="flex")});function i(e,t){const r={analytics:e,ads:t};localStorage.setItem(n,JSON.stringify(r)),d("consent","update",{analytics_storage:e?"granted":"denied",ad_storage:t?"granted":"denied",ad_user_data:t?"granted":"denied",ad_personalization:t?"granted":"denied"}),e&&s();const l=document.getElementById("cookieConsentBanner");l&&(l.style.display="none")}function a(){const e=document.getElementById("cookieConsentModal");if(!e)return;const t=localStorage.getItem(n);if(t){const r=JSON.parse(t);document.getElementById("cookieOptAnalytics").checked=!!r.analytics,document.getElementById("cookieOptAds").checked=!!r.ads}else document.getElementById("cookieOptAnalytics").checked=!1,document.getElementById("cookieOptAds").checked=!1;e.style.display="flex"}window.openCookieSettings=function(){a()}})();
