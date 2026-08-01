/**
 * Sos Interventi — Consent Mode v2 + GA4 + Google Ads
 *
 * Ads: AW-18330400186 + chiamate (numero di inoltro)
 * GA4: G-N643STDFRS
 *
 * IMPORTANTE per i test GA4:
 * 1) Clicca ACCETTA sul banner cookie
 * 2) Apri GA4 → Reports in tempo reale (Realtime)
 * 3) Poi clicca Chiama — cerca eventi: tel_click / generate_lead
 * Senza Accetta, analytics_storage=denied → in Realtime spesso non vedi nulla.
 */
(function () {
  "use strict";

  var CONFIG = {
    adsId: "AW-18330400186",
    phoneConversionSendTo: "AW-18330400186/C_QpCP2C9NccELrrzqRE",
    phoneConversionNumber: "388 809 1482",
    conversionSendTo: "",
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

  function readChoice() {
    try {
      return localStorage.getItem(CONFIG.storageKey);
    } catch (e) {
      return null;
    }
  }

  function saveChoice(value) {
    try {
      localStorage.setItem(CONFIG.storageKey, value);
    } catch (e) { /* ignore */ }
  }

  function hasAnalyticsConsent() {
    return readChoice() === "granted";
  }

  function applyGoogleForwarding(formattedNumber, mobileNumber) {
    if (!formattedNumber && !mobileNumber) return;

    var display = formattedNumber || REAL_DISPLAY;
    var mobile = String(mobileNumber || "").replace(/[\s.\-()]/g, "");
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
      if ((a.getAttribute("href") || "").indexOf("wa.me") !== -1) continue;
      a.setAttribute("href", telHref);
      a.setAttribute("data-google-forwarding", "1");

      var strong = a.querySelector("strong");
      if (strong && PHONE_TEXT_RE.test(strong.textContent || "")) {
        strong.textContent = display;
        continue;
      }
      if (a.children.length === 0 && PHONE_TEXT_RE.test(a.textContent || "")) {
        a.textContent = display;
        continue;
      }
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
    } catch (e) { /* keep real numbers */ }
  }

  function configPhoneConversion() {
    if (!CONFIG.phoneConversionSendTo || !CONFIG.phoneConversionNumber) return;
    gtag("config", CONFIG.phoneConversionSendTo, {
      phone_conversion_number: CONFIG.phoneConversionNumber,
      phone_conversion_callback: onPhoneReady
    });
  }

  function configGa4(extra) {
    if (!CONFIG.ga4Id) return;
    var opts = {
      anonymize_ip: true,
      send_page_view: true
    };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) opts[k] = extra[k];
      }
    }
    /* debug_mode se URL ha ?ga_debug=1 → compare in GA4 DebugView */
    if (/[?&]ga_debug=1(?:&|$)/.test(location.search)) {
      opts.debug_mode = true;
    }
    gtag("config", CONFIG.ga4Id, opts);
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
    configGa4();
    if (CONFIG.adsId) gtag("config", CONFIG.adsId);
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
    if (granted) {
      /* Re-config dopo consenso: altrimenti GA4 resta “muto” in Realtime */
      configGa4({ send_page_view: true });
      if (CONFIG.adsId) gtag("config", CONFIG.adsId);
      configPhoneConversion();
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

  function sendGa4Event(name, params) {
    if (!CONFIG.ga4Id || typeof window.gtag !== "function") return;
    var payload = params || {};
    payload.send_to = CONFIG.ga4Id;
    payload.transport_type = "beacon";
    gtag("event", name, payload);
  }

  function trackTelConversion(ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href^="tel:"]') : null;
    if (!a) a = ev.currentTarget;
    if (!a || !a.getAttribute || (a.getAttribute("href") || "").indexOf("tel:") !== 0) return;

    /* evita doppio fire click+touchstart */
    var now = Date.now();
    var last = parseInt(a.getAttribute("data-tracked-at") || "0", 10);
    if (last && now - last < 2000) return;
    a.setAttribute("data-tracked-at", String(now));

    if (CONFIG.conversionSendTo) {
      gtag("event", "conversion", {
        send_to: CONFIG.conversionSendTo,
        value: 1.0,
        currency: "EUR",
        transport_type: "beacon"
      });
    }

    if (!hasAnalyticsConsent()) {
      if (typeof console !== "undefined" && console.info) {
        console.info(
          "[SosInterventi] Cookie non accettati: tel_click non compare in GA4 Realtime. Clicca Accetta, poi riprova."
        );
      }
      return;
    }

    var label =
      a.getAttribute("data-google-forwarding") === "1" ? "google_forwarding" : "direct";

    sendGa4Event("tel_click", {
      event_category: "engagement",
      event_label: label,
      link_url: a.getAttribute("href") || "",
      method: "phone"
    });
    sendGa4Event("generate_lead", {
      currency: "EUR",
      value: 1,
      lead_source: "phone_click"
    });
  }

  function trackWaClick(ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href*="wa.me/"]') : null;
    if (!a) a = ev.currentTarget;
    if (!a) return;

    var now = Date.now();
    var last = parseInt(a.getAttribute("data-wa-tracked-at") || "0", 10);
    if (last && now - last < 2000) return;
    a.setAttribute("data-wa-tracked-at", String(now));

    if (!hasAnalyticsConsent()) return;

    sendGa4Event("whatsapp_click", {
      event_category: "engagement",
      event_label: "whatsapp",
      method: "whatsapp"
    });
  }

  function bindClicks() {
    /* Delegation: funziona anche dopo che Google cambia i tel: */
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      if (t.closest('a[href^="tel:"]')) trackTelConversion(ev);
      else if (t.closest('a[href*="wa.me/"]')) trackWaClick(ev);
    }, true);

    document.addEventListener(
      "touchstart",
      function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        if (t.closest('a[href^="tel:"]')) trackTelConversion(ev);
      },
      { passive: true, capture: true }
    );

    /* Assicura WA sul numero reale */
    var was = document.querySelectorAll('a[href*="wa.me/"]');
    for (var i = 0; i < was.length; i++) {
      var href = was[i].getAttribute("href") || "";
      if (href.indexOf("393888091482") === -1) {
        was[i].setAttribute("href", "https://wa.me/393888091482");
      }
    }
  }

  window.SosInterventi = {
    config: CONFIG,
    realTel: REAL_TEL,
    hasAnalyticsConsent: hasAnalyticsConsent,
    /** Test da console: SosInterventi.testTelEvent() */
    testTelEvent: function () {
      if (!hasAnalyticsConsent()) {
        console.warn("Prima Accetta i cookie.");
        return false;
      }
      sendGa4Event("tel_click", {
        event_category: "engagement",
        event_label: "manual_test",
        method: "phone"
      });
      sendGa4Event("generate_lead", {
        currency: "EUR",
        value: 1,
        lead_source: "manual_test"
      });
      console.info("Eventi inviati a", CONFIG.ga4Id, "— apri GA4 Realtime.");
      return true;
    }
  };

  loadGtag();
  var earlyChoice = readChoice();
  if (earlyChoice === "granted") applyConsent(true);
  else if (earlyChoice === "denied") applyConsent(false);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initBanner();
      bindClicks();
    });
  } else {
    initBanner();
    bindClicks();
  }
})();
