/**
 * Sos Interventi — Consent Mode v2 + GA4 + Google Ads (click-to-call)
 *
 * Compila i 3 ID qui sotto (Google Ads + GA4). Finché sono vuoti, i tag non partono.
 */
(function () {
  "use strict";

  var CONFIG = {
    /** Google Ads — es. "AW-1234567890" */
    adsId: "",
    /** Conversione click-to-call — es. "AW-1234567890/AbCdEfGhIjK" */
    conversionSendTo: "",
    /** Google Analytics 4 — es. "G-XXXXXXXXXX" */
    ga4Id: "",
    storageKey: "sos_consent_v1"
  };

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  /* Consent default PRIMA di qualsiasi altro tag */
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
  }

  function applyConsent(granted) {
    var state = granted ? "granted" : "denied";
    gtag("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state
    });
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
    loadGtag();

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

  /**
   * Conversione Ads su click tel: — inviata anche con consenso negato
   * (Consent Mode: Google può modellare la conversione).
   */
  function trackTelConversion(ev) {
    var a = ev.currentTarget;
    if (!a || a.getAttribute("data-tracked") === "1") return;

    if (typeof window.gtag !== "function") return;

    if (CONFIG.conversionSendTo) {
      gtag("event", "conversion", {
        send_to: CONFIG.conversionSendTo,
        value: 1.0,
        currency: "EUR"
      });
    }

    if (CONFIG.ga4Id) {
      gtag("event", "tel_click", {
        event_category: "conversion",
        event_label: "phone_call",
        transport_type: "beacon"
      });
    }
  }

  function bindTelLinks() {
    var links = document.querySelectorAll('a[href^="tel:"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", trackTelConversion);
    }
  }

  window.SosInterventi = {
    config: CONFIG,
    trackTelConversion: trackTelConversion
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initBanner();
      bindTelLinks();
    });
  } else {
    initBanner();
    bindTelLinks();
  }
})();
