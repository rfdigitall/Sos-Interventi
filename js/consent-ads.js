/**
 * Sos Interventi — Consent Mode v2 + Google Ads (chiamate con numero di inoltro)
 *
 * Conversione attiva (Beatrice / Google Ads):
 *   AW-18330400186 / C_QpCP2C9NccELrrzqRE
 *   Tipo: chiamata a numero mostrato sul sito (Google forwarding number)
 *
 * Sicurezza:
 * - Sostituiamo SOLO i link tel: (Chiama). WhatsApp resta sempre sul numero reale.
 * - Se Google non fornisce il numero di inoltro (consenso negato / errore),
 *   restano i numeri originali → le chiamate funzionano sempre.
 */
(function () {
  "use strict";

  var CONFIG = {
    adsId: "AW-18330400186",
    phoneConversionSendTo: "AW-18330400186/C_QpCP2C9NccELrrzqRE",
    /** Deve coincidere esattamente con il numero visualizzato sul sito */
    phoneConversionNumber: "388 809 1482",
    /** Solo se in futuro aggiungi conversione “click sul numero” */
    conversionSendTo: "",
    /** GA4 — flusso SoS */
    ga4Id: "G-N643STDFRS",
    storageKey: "sos_consent_v1"
  };

  var REAL_DISPLAY = "388 809 1482";
  var REAL_TEL = "tel:+393888091482";
  var PHONE_TEXT_RE = /388[\s.\-]?809[\s.\-]?1482/;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  /* Consent default PRIMA di qualsiasi tag */
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500
  });
  gtag("set", "url_passthrough", true);
  gtag("set", "ads_data_redaction", true);

  function primaryTagId() {
    return CONFIG.ga4Id || CONFIG.adsId || "";
  }

  /**
   * Aggiorna SOLO a[href^="tel:"].
   * Non tocca mai wa.me / WhatsApp / JSON-LD.
   */
  function applyGoogleForwarding(formattedNumber, mobileNumber) {
    if (!formattedNumber && !mobileNumber) return;

    var display = formattedNumber || REAL_DISPLAY;
    var mobile = mobileNumber || "";
    mobile = String(mobile).replace(/[\s.\-()]/g, "");
    if (!mobile) return;

    if (mobile.charAt(0) !== "+") {
      if (mobile.indexOf("00") === 0) mobile = "+" + mobile.slice(2);
      else if (mobile.indexOf("39") === 0) mobile = "+" + mobile;
      else mobile = "+39" + mobile;
    }

    var telHref = "tel:" + mobile;
    var links = document.querySelectorAll('a[href^="tel:"]');

    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      /* Mai toccare link misti / strani */
      if (a.getAttribute("href") && a.getAttribute("href").indexOf("wa.me") !== -1) continue;

      a.setAttribute("href", telHref);
      a.setAttribute("data-google-forwarding", "1");

      var strong = a.querySelector("strong");
      if (strong && PHONE_TEXT_RE.test(strong.textContent || "")) {
        strong.textContent = display;
        continue;
      }

      /* Link con solo testo (nav, sticky, footer) */
      if (a.children.length === 0 && PHONE_TEXT_RE.test(a.textContent || "")) {
        a.textContent = display;
        continue;
      }

      /* Footer / sticky: testo in span o nodo testo tra SVG */
      replacePhoneInElement(a, display);
    }
  }

  function replacePhoneInElement(root, display) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (PHONE_TEXT_RE.test(node.nodeValue || "")) {
        node.nodeValue = (node.nodeValue || "").replace(PHONE_TEXT_RE, display);
      }
    }
  }

  function onPhoneReady(formattedNumber, mobileNumber) {
    try {
      applyGoogleForwarding(formattedNumber, mobileNumber);
    } catch (e) {
      /* Fallback: numeri reali restano — le chiamate non si rompono */
    }
  }

  function configPhoneConversion() {
    if (!CONFIG.phoneConversionSendTo || !CONFIG.phoneConversionNumber) return;
    gtag("config", CONFIG.phoneConversionSendTo, {
      phone_conversion_number: CONFIG.phoneConversionNumber,
      phone_conversion_callback: onPhoneReady
    });
  }

  function loadGtag() {
    var id = primaryTagId();
    if (!id) return;
    if (document.getElementById("gtag-js")) return;

    var s = document.createElement("script");
    s.id = "gtag-js";
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);

    gtag("js", new Date());

    if (CONFIG.ga4Id) {
      gtag("config", CONFIG.ga4Id, { anonymize_ip: true, send_page_view: true });
    }
    if (CONFIG.adsId) {
      gtag("config", CONFIG.adsId);
    }
    configPhoneConversion();
  }

  function applyConsent(granted) {
    var state = granted ? "granted" : "denied";
    gtag("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state
    });
    /* Dopo Accetta, riattiva lo swap del numero di inoltro */
    if (granted) {
      configPhoneConversion();
    }
  }

  function saveChoice(value) {
    try {
      localStorage.setItem(CONFIG.storageKey, value);
    } catch (e) { /* ignore */ }
  }

  function readChoice() {
    try {
      return localStorage.getItem(CONFIG.storageKey);
    } catch (e) {
      return null;
    }
  }

  function hideBanner() {
    var el = document.getElementById("cookie-banner");
    if (el) el.hidden = true;
    document.body.classList.remove("cookie-open");
  }

  function showBanner() {
    var el = document.getElementById("cookie-banner");
    if (el) el.hidden = false;
    document.body.classList.add("cookie-open");
  }

  function initBanner() {
    var choice = readChoice();

    if (choice === "granted") {
      applyConsent(true);
      hideBanner();
      return;
    }
    if (choice === "denied") {
      applyConsent(false);
      hideBanner();
      return;
    }

    showBanner();
    var accept = document.getElementById("cookie-accept");
    var refuse = document.getElementById("cookie-refuse");
    if (accept) {
      accept.addEventListener("click", function () {
        saveChoice("granted");
        applyConsent(true);
        hideBanner();
      });
    }
    if (refuse) {
      refuse.addEventListener("click", function () {
        saveChoice("denied");
        applyConsent(false);
        hideBanner();
      });
    }
  }

  function trackTelConversion(ev) {
    var a = ev.currentTarget;
    if (!a || a.getAttribute("data-tracked") === "1") return;
    a.setAttribute("data-tracked", "1");
    if (typeof window.gtag !== "function") return;

    /* Conversione Ads “click sul numero” — solo se valorizzato (ora usiamo inoltro Google) */
    if (CONFIG.conversionSendTo) {
      gtag("event", "conversion", {
        send_to: CONFIG.conversionSendTo,
        value: 1.0,
        currency: "EUR",
        transport_type: "beacon"
      });
    }

    /*
     * GA4: il click su Chiama (non la chiamata completata).
     * La chiamata reale con numero di inoltro Google si vede in Google Ads → Conversioni.
     */
    if (CONFIG.ga4Id) {
      gtag("event", "tel_click", {
        event_category: "engagement",
        event_label: a.getAttribute("data-google-forwarding") === "1" ? "google_forwarding" : "direct",
        link_url: a.getAttribute("href") || "",
        transport_type: "beacon"
      });
      /* Evento consigliato — più facile da trovare in GA4 Realtime / Engagement */
      gtag("event", "generate_lead", {
        currency: "EUR",
        value: 1,
        lead_source: "phone_click",
        transport_type: "beacon"
      });
    }
  }

  function trackWaClick(ev) {
    var a = ev.currentTarget;
    if (!a || a.getAttribute("data-wa-tracked") === "1") return;
    a.setAttribute("data-wa-tracked", "1");
    if (typeof window.gtag !== "function" || !CONFIG.ga4Id) return;
    gtag("event", "whatsapp_click", {
      event_category: "engagement",
      event_label: "whatsapp",
      transport_type: "beacon"
    });
  }

  function bindTelLinks() {
    var links = document.querySelectorAll('a[href^="tel:"]');
    for (var i = 0; i < links.length; i++) {
      /* touchstart/pointerdown: su mobile il dialer apre prima che il click finisca */
      links[i].addEventListener("click", trackTelConversion);
      links[i].addEventListener("touchstart", trackTelConversion, { passive: true });
    }
  }

  function bindWaLinks() {
    var links = document.querySelectorAll('a[href*="wa.me/"]');
    for (var i = 0; i < links.length; i++) {
      /* Garantisce che WA punti sempre al numero reale */
      var href = links[i].getAttribute("href") || "";
      if (href.indexOf("393888091482") === -1 && href.indexOf("wa.me/") !== -1) {
        links[i].setAttribute("href", "https://wa.me/393888091482");
      }
      links[i].addEventListener("click", trackWaClick);
    }
  }

  /* Espose per debug in console: SosInterventi.config */
  window.SosInterventi = {
    config: CONFIG,
    realTel: REAL_TEL,
    applyGoogleForwarding: applyGoogleForwarding,
    onPhoneReady: onPhoneReady
  };

  /*
   * IMPORTANTE (Google Ads):
   * Carica il tag SUBITO nel <head>, come nello snippet ufficiale.
   * Non aspettare DOMContentLoaded — altrimenti Ads dice “non rilevata”.
   */
  loadGtag();
  var earlyChoice = readChoice();
  if (earlyChoice === "granted") applyConsent(true);
  else if (earlyChoice === "denied") applyConsent(false);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initBanner();
      bindTelLinks();
      bindWaLinks();
    });
  } else {
    initBanner();
    bindTelLinks();
    bindWaLinks();
  }
})();
