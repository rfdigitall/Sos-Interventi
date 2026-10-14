/**
 * Ads QS message-match v10 — Google Help aligned:
 * - H1 / eyebrow / sub match keyword intent
 * - document.title + meta description match (ad ↔ page consistency)
 * Load after ads-geo.js
 */
(function () {
  if (window.__gfAdsQsMatch) return;
  window.__gfAdsQsMatch = true;

  var VER = "20261014soscity";
  var lastApplied = "";

  function params() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function decodeVal(v) {
    if (!v) return "";
    try {
      return decodeURIComponent(String(v).replace(/\+/g, " ")).trim();
    } catch (e) {
      return String(v).trim();
    }
  }

  function pageKind() {
    var path = (location.pathname || "").toLowerCase();
    if (path.indexOf("basculanti") >= 0 || path.indexOf("tapparelle") >= 0) return "tapparelle";
    if (path.indexOf("scarichi") >= 0) return "scarichi";
    if (path.indexOf("perdite") >= 0) return "perdite";
    if (path.indexOf("fabbro") >= 0) return "fabbro";
    if (path.indexOf("idraulico") >= 0) return "idraulico";
    return "idraulico";
  }

  function getKeyword(p) {
    return decodeVal(p.get("utm_keyword") || p.get("utm_term") || p.get("kw")).toLowerCase();
  }

  function cityName() {
    try {
      return window.__gfGeoCity || (window.gfApplyLandingContext && window.gfApplyLandingContext()) || "";
    } catch (e) {
      return "";
    }
  }

  var BASE = {
    idraulico: {
      eyebrow: "Idraulico urgente · Pronto intervento · H24",
      title: "Idraulico Urgente — Pronto Intervento H24",
      titleCity: function (c) {
        return "Idraulico Urgente H24 a " + c;
      },
      sub: "Perdite · tubo rotto · scarichi otturati · WC intasato",
      meta: "Idraulico urgente H24: pronto intervento per perdite, tubo rotto, scarichi e WC intasato. Chiama 371 794 5477.",
    },
    scarichi: {
      eyebrow: "Scarico otturato · WC intasato · Spurgo H24",
      title: "Scarico Otturato Urgente — Sturiamo Ora",
      titleCity: function (c) {
        return "Scarico Otturato Urgente a " + c;
      },
      sub: "WC intasato · lavandino otturato · spurgo urgente",
      meta: "Scarico otturato e WC intasato: spurgo urgente H24. Chiama 371 794 5477.",
    },
    perdite: {
      eyebrow: "Perdita acqua · Tubo rotto · Allagamento",
      title: "Perdita d'Acqua Urgente — Tubo Rotto",
      titleCity: function (c) {
        return "Perdita d'Acqua Urgente a " + c;
      },
      sub: "Tubo rotto · allagamento · perdita urgente",
      meta: "Perdita d'acqua e tubo rotto: pronto intervento H24. Chiama 371 794 5477.",
    },
    fabbro: {
      eyebrow: "Fabbro urgente · Apertura porte · Tapparelle · H24",
      title: "Fabbro Urgente — Pronto Intervento H24",
      titleCity: function (c) {
        return "Fabbro Urgente H24 a " + c;
      },
      sub: "Apertura porte · serratura · tapparelle · basculanti",
      meta: "Fabbro urgente H24: apertura porte, serrature, tapparelle e basculanti. Chiama 371 794 5477.",
    },
    tapparelle: {
      eyebrow: "Basculanti · Tapparelle · Serrande · H24",
      title: "Pronto Intervento Basculanti e Tapparelle H24",
      titleCity: function (c) {
        return "Basculanti e Tapparelle Urgenti a " + c;
      },
      sub: "Basculante, garage o tapparella bloccata? Non forzare — chiama.",
      meta: "Pronto intervento basculanti e tapparelle H24. Chiama 371 794 5477.",
    },
  };

  var RULES = [
    {
      re: /wc intas|wc ottur|water ottur|water non scarica|disintasare wc|water intas|pronto intervento wc/,
      eyebrow: "WC intasato · Spurgo urgente · H24",
      title: "WC Intasato — Spurgo Urgente H24",
      titleCity: function (c) {
        return "WC Intasato Urgente a " + c;
      },
      sub: "WC intasato · water otturato · spurgo professionale",
      meta: "WC intasato urgente: spurgo professionale H24. Chiama 371 794 5477.",
    },
    {
      re: /scarico ottur|scarichi ottur|scarico intas|scarico bloccat|scarico cucina|spurgo scarich|pronto intervento scarich|stasatura|disottur|lavandino ottur|lavandino cucina|lavandino intas|stappare lavandino|fogna ottur|ingorg|otturazione|tubo intasato/,
      eyebrow: "Scarico otturato · Spurgo · H24",
      title: "Scarico Otturato — Spurgo Urgente",
      titleCity: function (c) {
        return "Scarico Otturato a " + c;
      },
      sub: "Scarico otturato · lavandino intasato · spurgo",
      meta: "Scarico otturato e lavandino intasato: spurgo urgente. Chiama 371 794 5477.",
    },
    {
      re: /perdita acqua|perdite acqua|allagamento|tubo rotto|tubo scoppiat|tubo che perde|acqua che esce|acqua che perde|riparazione perdita|perdita tubo|tubatura|perdita urgente|emergenza perdita|pronto intervento perdita|pronto intervento allagamento/,
      eyebrow: "Perdita acqua · Tubo rotto · H24",
      title: "Perdita d'Acqua Urgente — Tubo Rotto",
      titleCity: function (c) {
        return "Perdita d'Acqua a " + c;
      },
      sub: "Perdita acqua · tubo rotto · allagamento",
      meta: "Perdita d'acqua e allagamento: intervento urgente H24. Chiama 371 794 5477.",
    },
    {
      re: /intervento idraulico|pronto intervento idraulico|idraulico pronto intervento/,
      eyebrow: "Pronto intervento idraulico · H24",
      title: "Pronto Intervento Idraulico H24",
      titleCity: function (c) {
        return "Pronto Intervento Idraulico a " + c;
      },
      sub: "Intervento idraulico · perdite · scarichi",
      meta: "Pronto intervento idraulico H24 in zona. Chiama 371 794 5477.",
    },
    {
      re: /idraulico urgente|idraulico h24|idraulico 24|idraulico emergenza|idraulico di emergenza|emergenza idraulico|idraulico reperibile|idraulico subito|idraulico adesso|idraulico notte|chiamare idraulico|sos idraulico/,
      eyebrow: "Idraulico urgente · H24",
      title: "Idraulico Urgente H24",
      titleCity: function (c) {
        return "Idraulico Urgente H24 a " + c;
      },
      sub: "Idraulico urgente · pronto intervento",
      meta: "Idraulico urgente H24: rispondiamo subito. Chiama 371 794 5477.",
    },
    {
      re: /idraulico (udine|pordenone|gorizia|trieste|venezia|treviso|mestre)/,
      eyebrow: "Idraulico pronto intervento · H24",
      title: "Idraulico Pronto Intervento H24",
      titleCity: function (c) {
        return "Idraulico Pronto Intervento a " + c;
      },
      sub: "Pronto intervento idraulico · perdite · scarichi",
      meta: "Idraulico pronto intervento in zona. Chiama 371 794 5477.",
    },
    {
      re: /spurgo lavandino|stappare lavandino|disintasare/,
      eyebrow: "Spurgo lavandino · H24",
      title: "Spurgo Lavandino Urgente",
      titleCity: function (c) {
        return "Spurgo Lavandino a " + c;
      },
      sub: "Spurgo lavandino · scarico intasato",
      meta: "Spurgo lavandino urgente H24. Chiama 371 794 5477.",
    },
    {
      re: /chiuso fuori|chiusi fuori|mi sono chiuso|sono chiuso fuori|bloccato fuori|rimasto fuori|rimasto chiuso|porta blindata|porta sbattuta|porta bloccata|serratura bloccat|chiave rotta|chiave spezzat|chiave bloccata|apertura port|sblocco serratur|sblocco porta/,
      eyebrow: "Apertura porte · Serratura bloccata",
      title: "Apertura Porte Urgente — Fabbro H24",
      titleCity: function (c) {
        return "Apertura Porte Urgente a " + c;
      },
      sub: "Chiuso fuori · serratura bloccata · chiave rotta",
      meta: "Apertura porte e serratura bloccata: fabbro H24. Chiama 371 794 5477.",
    },
    {
      re: /tapparell|basculant|serranda|garage bloccato|molla basculante|riparazione tapparell|sostituzione tapparell/,
      eyebrow: "Tapparelle · Basculanti · Serrande H24",
      title: "Tapparella / Basculante Bloccata — Chiama",
      titleCity: function (c) {
        return "Tapparelle e Basculanti Urgenti a " + c;
      },
      sub: "Tapparella bloccata · basculante · serranda urgente",
      meta: "Tapparelle, basculanti e serrande bloccate: intervento urgente H24. Chiama 371 794 5477.",
    },
    {
      re: /fabbro urgente|fabbro h24|pronto intervento fabbro|fabbro pronto|intervento fabbro|emergenza fabbro|fabbro 24|fabbro notturno|chiamare fabbro|fabbro apertura/,
      eyebrow: "Fabbro urgente · Pronto intervento · H24",
      title: "Fabbro Urgente H24",
      titleCity: function (c) {
        return "Fabbro Urgente H24 a " + c;
      },
      sub: "Fabbro urgente · apertura porte · serrature",
      meta: "Fabbro urgente e pronto intervento H24. Chiama 371 794 5477.",
    },
    {
      re: /pronto intervento serratur|pronto intervento chiavi|pronto intervento mestre|pronto intervento (venezia|treviso|udine|pordenone|gorizia|trieste)|apertura serratur/,
      eyebrow: "Pronto intervento serrature · H24",
      title: "Pronto Intervento Serrature H24",
      titleCity: function (c) {
        return "Pronto Intervento Serrature a " + c;
      },
      sub: "Serratura bloccata · apertura · sblocco",
      meta: "Pronto intervento serrature H24. Chiama 371 794 5477.",
    },
    {
      re: /cambio cilindro|cilindro europeo|cambio serratur|sostituzione serratur/,
      eyebrow: "Cambio serratura · Cilindro",
      title: "Cambio / Sostituzione Serratura",
      titleCity: function (c) {
        return "Sostituzione Serratura a " + c;
      },
      sub: "Sostituzione serratura · cilindro",
      meta: "Sostituzione serratura urgente. Chiama 371 794 5477.",
    },
  ];

  function pickCopy(kind, kw) {
    var base = BASE[kind] || BASE.idraulico;
    var pack = {
      eyebrow: base.eyebrow,
      title: base.title,
      titleCity: base.titleCity,
      sub: base.sub,
      meta: base.meta,
    };
    if (kw) {
      for (var i = 0; i < RULES.length; i++) {
        if (RULES[i].re.test(kw)) {
          pack.eyebrow = RULES[i].eyebrow;
          pack.title = RULES[i].title;
          pack.titleCity = RULES[i].titleCity || pack.titleCity;
          pack.sub = RULES[i].sub;
          pack.meta = RULES[i].meta || pack.meta;
          break;
        }
      }
    }
    return pack;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (!el || text == null || text === "") return;
    if (el.textContent !== text) el.textContent = text;
  }

  function setMetaDescription(text) {
    if (!text) return;
    var nodes = document.querySelectorAll('meta[name="description"]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute("content", text);
    }
    var og = document.querySelectorAll('meta[property="og:description"]');
    for (var j = 0; j < og.length; j++) {
      og[j].setAttribute("content", text);
    }
  }

  function setDocTitle(title) {
    if (!title) return;
    var t = title + " | Chiama 371 794 5477";
    if (document.title !== t) document.title = t;
    var ogt = document.querySelectorAll('meta[property="og:title"]');
    for (var i = 0; i < ogt.length; i++) {
      ogt[i].setAttribute("content", title + " — Chiama 371 794 5477");
    }
  }

  function apply() {
    var p = params();
    var kind = pageKind();
    var kw = getKeyword(p);
    var city = cityName();
    var copy = pickCopy(kind, kw);

    var title = (city && copy.titleCity) ? copy.titleCity(city) : copy.title;
    var sig = [VER, title, city || '', copy.sub, copy.eyebrow, copy.meta].join("\u0001");
    if (sig === lastApplied) return;
    lastApplied = sig;

    setText("gf-hero-title", title);
    setText("gf-hero-sub", copy.sub);
    setText("gf-hero-eyebrow", copy.eyebrow);
    setDocTitle(title);
    setMetaDescription(copy.meta);

    try {
      document.documentElement.setAttribute("data-gf-qs-ver", VER);
      if (kw) document.documentElement.setAttribute("data-gf-kw-match", "1");
      if (city) document.documentElement.setAttribute("data-gf-city", city);
    } catch (e) {}
  }

  window.gfApplyAdsQsHero = apply;

  function boot() {
    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  var delays = [50, 400, 1200, 3000];
  for (var d = 0; d < delays.length; d++) {
    setTimeout(apply, delays[d]);
  }

  var moTimer = 0;
  try {
    var mo = new MutationObserver(function () {
      if (moTimer) clearTimeout(moTimer);
      moTimer = setTimeout(apply, 60);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      mo.disconnect();
      if (moTimer) clearTimeout(moTimer);
    }, 10000);
  } catch (e) {}
})();
