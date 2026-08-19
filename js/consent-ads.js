/**
 * Sos Interventi — Consent Mode v2 + GA4 + Google Ads
 *
 * Ads: AW-18330400186
 * Click tel: AW-18330400186/dAXnCJzgr9ocELrrzqRE
 * GA4: G-N643STDFRS
 *
 * Niente numero di inoltro Google (800): sul sito resta SEMPRE 388 809 1482.
 *
 * Ads traffic (gclid): marketing consent ON before gtag config — tel conversion
 * fires without cookie banner accept (same pattern as totalservice24h.it).
 */
(function () {
  "use strict";

  var CONFIG = {
    adsId: "AW-18330400186",
    conversionSendTo: "AW-18330400186/dAXnCJzgr9ocELrrzqRE",
    phoneConversionSendTo: "AW-18330400186/RVS9CNri3uIcELrrzqRE",
    phoneConversionNumber: "388 809 1482",
    ga4Id: "G-N643STDFRS",
    storageKey: "sos_consent_v2",
    forceMarketingConsentForAds: true
  };

  var REAL_TEL = "tel:+393888091482";

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

  function isAdsTraffic() {
    try {
      var p = new URLSearchParams(location.search);
      return !!(p.get("gclid") || p.get("gbraid") || p.get("wbraid") || p.get("utm_source") === "google");
    } catch (e) {
      return false;
    }
  }

  function hasAnalyticsConsent() {
    return readChoice() === "granted";
  }

  function canTrackMarketing() {
    return hasAnalyticsConsent() || (CONFIG.forceMarketingConsentForAds && isAdsTraffic());
  }

  function configGa4(extra) {
    if (!CONFIG.ga4Id) return;
    var opts = { anonymize_ip: true, send_page_view: true };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) opts[k] = extra[k];
      }
    }
    if (/[?&]ga_debug=1(?:&|$)/.test(location.search)) opts.debug_mode = true;
    gtag("config", CONFIG.ga4Id, opts);
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
      configGa4({ send_page_view: true });
      if (CONFIG.adsId) {
        gtag("config", CONFIG.adsId, {
          allow_enhanced_conversions: true,
          conversion_linker: true
        });
      }
      if (CONFIG.phoneConversionSendTo) {
        gtag("config", CONFIG.phoneConversionSendTo, {
          phone_conversion_number: CONFIG.phoneConversionNumber
        });
      }
      if (CONFIG.conversionSendTo) {
        gtag("set", {
          phone_conversion_number: CONFIG.phoneConversionNumber,
          phone_conversion_ids: [CONFIG.conversionSendTo]
        });
      }
    }
  }

  function bootstrapAdsConsentEarly() {
    if (!CONFIG.forceMarketingConsentForAds || !isAdsTraffic()) return;
    if (readChoice() === "denied") return;
    saveChoice("granted");
    applyConsent(true);
    if (document.body) document.body.classList.add("ads-traffic");
    else document.addEventListener("DOMContentLoaded", function () {
      document.body.classList.add("ads-traffic");
    }, { once: true });
  }

  function loadGtag() {
    gtag("js", new Date());
    if (canTrackMarketing()) {
      applyConsent(true);
    } else {
      configGa4();
      if (CONFIG.adsId) gtag("config", CONFIG.adsId);
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
    if (canTrackMarketing()) {
      hideBanner();
      return;
    }
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

  var TEL_TRACK_KEY = "sos_tel_tracked_v1";
  var WA_TRACK_KEY = "sos_wa_tracked_v1";
  var REAL_TEL_NORM = "tel:+393888091482";

  function sessionAlreadyTracked(key) {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch (e) {
      return false;
    }
  }

  function markSessionTracked(key) {
    try {
      sessionStorage.setItem(key, "1");
    } catch (e) { /* ignore */ }
  }

  function normalizeTelHref(href) {
    return String(href || "").trim().toLowerCase().replace(/[\s\-\u00a0().]/g, "");
  }

  function isOurTelLink(a) {
    if (!a || !a.getAttribute) return false;
    var href = normalizeTelHref(a.getAttribute("href"));
    return href === REAL_TEL_NORM || href === "tel:393888091482";
  }

  function isOurWaLink(a) {
    if (!a || !a.getAttribute) return false;
    var href = a.getAttribute("href") || "";
    return href.indexOf("wa.me/") !== -1 && href.indexOf("393888091482") !== -1;
  }

  function sendGa4Event(name, params) {
    if (!CONFIG.ga4Id || typeof window.gtag !== "function") return;
    if (!canTrackMarketing()) return;
    var payload = params || {};
    payload.send_to = CONFIG.ga4Id;
    payload.transport_type = "beacon";
    gtag("event", name, payload);
  }

  function trackTelConversion(ev) {
    if (ev && typeof ev.button === "number" && ev.button !== 0) return;

    var a = ev.target && ev.target.closest ? ev.target.closest('a[href^="tel:"]') : null;
    if (!isOurTelLink(a)) return;
    if (sessionAlreadyTracked(TEL_TRACK_KEY)) return;

    if (canTrackMarketing() && readChoice() !== "granted") {
      saveChoice("granted");
      applyConsent(true);
    }
    if (!canTrackMarketing()) return;

    markSessionTracked(TEL_TRACK_KEY);

    if (CONFIG.conversionSendTo && typeof window.gtag === "function") {
      gtag("event", "conversion", {
        send_to: CONFIG.conversionSendTo,
        value: 1.0,
        currency: "EUR",
        transport_type: "beacon"
      });
    }

    sendGa4Event("tel_click", {
      event_category: "engagement",
      event_label: "direct",
      link_url: REAL_TEL,
      method: "phone"
    });
    sendGa4Event("generate_lead", {
      currency: "EUR",
      value: 1,
      lead_source: "phone_click"
    });
  }

  function trackWaClick(ev) {
    if (ev && typeof ev.button === "number" && ev.button !== 0) return;

    var a = ev.target && ev.target.closest ? ev.target.closest('a[href*="wa.me/"]') : null;
    if (!isOurWaLink(a)) return;
    if (sessionAlreadyTracked(WA_TRACK_KEY)) return;
    markSessionTracked(WA_TRACK_KEY);

    sendGa4Event("whatsapp_click", {
      event_category: "engagement",
      event_label: "whatsapp",
      method: "whatsapp"
    });
  }

  function bindClicks() {
    document.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        if (t.closest('a[href^="tel:"]')) trackTelConversion(ev);
        else if (t.closest('a[href*="wa.me/"]')) trackWaClick(ev);
      },
      true
    );

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
    canTrackMarketing: canTrackMarketing,
    isAdsTraffic: isAdsTraffic,
    testTelEvent: function () {
      if (!canTrackMarketing()) {
        console.warn("Consenso marketing non attivo.");
        return false;
      }
      try {
        sessionStorage.removeItem(TEL_TRACK_KEY);
      } catch (e) { /* ignore */ }
      if (CONFIG.conversionSendTo) {
        gtag("event", "conversion", {
          send_to: CONFIG.conversionSendTo,
          value: 1.0,
          currency: "EUR",
          transport_type: "beacon"
        });
      }
      sendGa4Event("tel_click", {
        event_category: "engagement",
        event_label: "manual_test",
        method: "phone"
      });
      markSessionTracked(TEL_TRACK_KEY);
      console.info("Test conversion inviata —", CONFIG.conversionSendTo);
      return true;
    }
  };

  bootstrapAdsConsentEarly();
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
