/**
 * Ads QS message-match v10 — Google Help aligned:
 * - H1 / eyebrow / sub match keyword intent
 * - document.title + meta description match (ad ↔ page consistency)
 * Load after ads-geo.js
 */
(function () {
  if (window.__gfAdsQsMatch) return;
  window.__gfAdsQsMatch = true;

  var VER = "20261024sos";
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
    if (path.indexOf("ricerca-perdite") >= 0) return "ricerca";
    if (path.indexOf("perdite") >= 0) return "perdite";
    if (path.indexOf("caldaie") >= 0) return "caldaie";
    if (path.indexOf("porte-serrature") >= 0) return "serrature";
    if (path.indexOf("fabbro") >= 0) return "fabbro";
    if (path.indexOf("idraulico") >= 0) return "idraulico";
    return "idraulico";
  }

  function getKeyword(p) {
    return decodeVal(p.get("utm_keyword") || p.get("utm_term") || p.get("kw")).toLowerCase();
  }

  /* "a Verona" / "in provincia di Verona" — set by ads-geo.js from the whitelist only */
  function cityLoc() {
    try {
      return window.__gfGeoLoc || "";
    } catch (e) {
      return "";
    }
  }

  function T(head) {
    return function (loc) {
      return head + " " + loc;
    };
  }

  /* Default copy per page (no keyword). Title = H1, sub = lead, meta = description. */
  var BASE = {
    idraulico: {
      eyebrow: "Intervento idraulico · Pronto intervento · H24",
      title: "Intervento Idraulico Urgente H24",
      titleCity: T("Intervento Idraulico Urgente"),
      sub: "Perdite · tubo rotto · scarichi otturati · WC intasato",
      meta: "Intervento idraulico urgente H24 in Veneto e Friuli Venezia Giulia: perdite, tubo rotto, scarichi e WC intasato. Chiama 371 794 5477.",
    },
    ricerca: {
      eyebrow: "Ricerca perdite acqua · Perdite occulte",
      title: "Ricerca Perdite Acqua Occulte",
      titleCity: T("Ricerca Perdite Acqua"),
      sub: "Ricerca perdita acqua nel muro o sotto il pavimento: troviamo il punto e ripariamo, aprendo solo dove serve.",
      meta: "Ricerca perdite acqua occulte a domicilio: perdita sotto pavimento, tubo rotto nel muro, contatore che gira. Veneto e Friuli Venezia Giulia. Chiama 371 794 5477.",
    },
    scarichi: {
      eyebrow: "Scarico otturato · WC intasato · Spurgo H24",
      title: "Scarico Otturato e WC Intasato — Spurgo Urgente",
      titleCity: T("Scarico Otturato e WC Intasato"),
      sub: "WC intasato · lavandino otturato · spurgo e disotturazione scarichi",
      meta: "Scarico otturato e WC intasato: spurgo e disotturazione urgente H24 in Veneto e Friuli Venezia Giulia. Chiama 371 794 5477.",
    },
    perdite: {
      eyebrow: "Perdite acqua in casa · Tubo rotto · Allagamento",
      title: "Perdite Acqua in Casa — Intervento Urgente",
      titleCity: T("Perdite Acqua in Casa: Intervento Urgente"),
      sub: "Tubo che perde · macchia sul soffitto · allagamento",
      meta: "Perdite acqua in casa, tubo rotto e allagamento: pronto intervento idraulico H24. Chiama 371 794 5477.",
    },
    caldaie: {
      eyebrow: "Caldaia · Scaldabagno · Pronto intervento",
      title: "Pronto Intervento Caldaia e Scaldabagno",
      titleCity: T("Pronto Intervento Caldaia"),
      sub: "Caldaia in blocco, senza acqua calda o scaldabagno che perde? Chiama.",
      meta: "Pronto intervento caldaia e scaldabagno: caldaia in blocco, niente acqua calda, perdite. Chiama 371 794 5477.",
    },
    serrature: {
      eyebrow: "Fabbro · Porte e serrature · H24",
      title: "Serratura Bloccata o Rotta? Fabbro Urgente",
      titleCity: T("Fabbro per Serrature e Porte Blindate"),
      sub: "Serratura rotta o bloccata · porta blindata · chiave spezzata · sostituzione serratura",
      meta: "Fabbro urgente per serratura bloccata o rotta, porte blindate e sostituzione serrature. Veneto e Friuli Venezia Giulia. Chiama 371 794 5477.",
    },
    fabbro: {
      eyebrow: "Fabbro urgente · Apertura porte · H24",
      title: "Fabbro Urgente — Pronto Intervento H24",
      titleCity: T("Fabbro Pronto Intervento"),
      sub: "Apertura porte · serrature · cilindri · porte blindate",
      meta: "Fabbro pronto intervento H24: apertura porte, serrature, cilindri e porte blindate. Chiama 371 794 5477.",
    },
    tapparelle: {
      eyebrow: "Tapparelle · Serrande · Basculanti · H24",
      title: "Riparazione Tapparelle e Basculanti Urgente",
      titleCity: T("Riparazione Tapparelle e Basculanti"),
      sub: "Tapparella bloccata, cinghia rotta, serranda o basculante garage? Non forzare — chiama.",
      meta: "Riparazione tapparelle, serrande e basculanti urgente H24. Chiama 371 794 5477.",
    },
  };

  /* Keyword -> copy. Order matters: most specific first. */
  var RULES = [
    {
      re: /ricerca perdit|ricerca fughe|perdit[ae] occult|perdita nascost|perdita (acqua |d acqua |di acqua )?(nel muro|sotto (il )?pavimento|sotto traccia)|tubo rotto (nel muro|sotto)|localizzazione perdit/,
      eyebrow: "Ricerca perdite acqua · Perdite occulte",
      title: "Ricerca Perdite Acqua Occulte",
      titleCity: T("Ricerca Perdite Acqua Occulte"),
      sub: "Perdita sotto il pavimento o tubo rotto nel muro? Troviamo il punto e ripariamo.",
      meta: "Ricerca perdite acqua occulte a domicilio. Chiama 371 794 5477.",
    },
    {
      re: /cinghia|molla tapparell|tapparella (rott|bloccat|non (sale|scende))|riparazione tapparell|riparare tapparell|tapparelle? rott/,
      eyebrow: "Riparazione tapparelle · H24",
      title: "Riparazione Tapparelle Urgente",
      titleCity: T("Riparazione Tapparelle"),
      sub: "Tapparella non scende o non sale, cinghia o molla tapparella rotta · intervento a domicilio",
      meta: "Riparazione tapparelle urgente a domicilio: cinghia, molla, tapparella bloccata. Chiama 371 794 5477.",
    },
    {
      re: /serrand|basculant|garage bloccat|porta garage/,
      eyebrow: "Serrande · Basculanti garage · H24",
      title: "Riparazione Serrande e Basculanti",
      titleCity: T("Riparazione Serrande e Basculanti"),
      sub: "Serranda o basculante garage bloccata · intervento urgente",
      meta: "Riparazione serrande e basculanti garage urgente. Chiama 371 794 5477.",
    },
    {
      re: /tapparell/,
      eyebrow: "Tapparelle · H24",
      title: "Tapparelle: Riparazione Urgente",
      titleCity: T("Riparazione Tapparelle"),
      sub: "Tapparella bloccata · cinghia o molla rotta · intervento a domicilio",
      meta: "Tapparelle bloccate o rotte: riparazione urgente. Chiama 371 794 5477.",
    },
    {
      re: /wc intas|wc ottur|water ottur|water non scarica|disintasare wc|water intas|pronto intervento wc|gabinetto intas/,
      eyebrow: "WC intasato · Spurgo urgente · H24",
      title: "WC Intasato — Spurgo Urgente H24",
      titleCity: T("WC Intasato: Intervento Urgente"),
      sub: "WC intasato · water otturato · spurgo professionale",
      meta: "WC intasato urgente: spurgo professionale H24. Chiama 371 794 5477.",
    },
    {
      re: /scarico ottur|scarichi ottur|scarico intas|scarico bloccat|scarico cucina|spurgo|sturare|stasatura|disottur|disostru|lavandino ottur|lavandino cucina|lavandino intas|stappare lavandino|fogna ottur|ingorg|otturazione|tubo intasato|tubo di scarico/,
      eyebrow: "Scarico otturato · Spurgo · H24",
      title: "Scarico Otturato — Spurgo Urgente",
      titleCity: T("Scarico Otturato: Spurgo Urgente"),
      sub: "Scarico otturato · lavandino intasato · spurgo e disotturazione",
      meta: "Scarico otturato e lavandino intasato: spurgo urgente. Chiama 371 794 5477.",
    },
    {
      re: /caldai|scaldabagn|boiler|acqua calda/,
      eyebrow: "Caldaia · Scaldabagno · Pronto intervento",
      title: "Pronto Intervento Caldaia e Scaldabagno",
      titleCity: T("Pronto Intervento Caldaia"),
      sub: "Caldaia in blocco · niente acqua calda · scaldabagno che perde",
      meta: "Pronto intervento caldaia e scaldabagno. Chiama 371 794 5477.",
    },
    {
      re: /perdit[ae] acqua|perdite d acqua|allagament|tubo rotto|tubo scoppiat|tubo che perde|acqua che esce|acqua che perde|acqua dal soffitto|riparazione perdit|perdita tubo|tubatur|perdita urgente|emergenza perdit|pronto intervento perdit/,
      eyebrow: "Perdite acqua · Tubo rotto · H24",
      title: "Perdite d'Acqua — Intervento Urgente",
      titleCity: T("Perdite d'Acqua: Intervento Urgente"),
      sub: "Tubo che perde · acqua dal soffitto · allagamento",
      meta: "Perdite d'acqua e allagamento: intervento urgente H24. Chiama 371 794 5477.",
    },
    {
      re: /riparazion[ei] (della )?port[ae] blindat|riparare port[ae] blindat/,
      eyebrow: "Porte blindate · Riparazione · H24",
      title: "Riparazione Porta Blindata — Fabbro",
      titleCity: T("Riparazione Porta Blindata"),
      sub: "Porta blindata bloccata · serratura o cilindro da sostituire · apertura e riparazione",
      meta: "Riparazione porta blindata: apertura, sostituzione serratura e cilindro. Chiama 371 794 5477.",
    },
    {
      re: /sostituzion[ei] (della )?serratur|cambio (della )?serratur|cambiare (la )?serratur/,
      eyebrow: "Sostituzione serrature · Cilindri · H24",
      title: "Sostituzione Serratura — Fabbro Urgente",
      titleCity: T("Sostituzione Serratura"),
      sub: "Serratura rotta, porta normale o blindata · cambio cilindro europeo",
      meta: "Sostituzione serratura anche su porta blindata, cambio cilindro. Chiama 371 794 5477.",
    },
    {
      re: /port[ae] blindat|assistenza port/,
      eyebrow: "Porte blindate · Serrature · H24",
      title: "Assistenza Porte Blindate — Fabbro",
      titleCity: T("Assistenza Porte Blindate"),
      sub: "Porta blindata bloccata · serratura da sostituire · cilindro di sicurezza",
      meta: "Assistenza porte blindate: apertura, serrature e cilindri. Chiama 371 794 5477.",
    },
    {
      re: /cambio cilindr|sostituzione cilindr|cilindro europeo|cilindr|cambio serratur|sostituzione serratur|serratura rott|riparazione serratur/,
      eyebrow: "Sostituzione serrature · Cilindri",
      title: "Sostituzione e Riparazione Serrature",
      titleCity: T("Sostituzione Serrature"),
      sub: "Serratura rotta · cambio cilindro · porta che non chiude",
      meta: "Sostituzione e riparazione serrature, cambio cilindro. Chiama 371 794 5477.",
    },
    {
      re: /chiuso fuori|chiusi fuori|mi sono chiuso|bloccato fuori|rimasto fuori|rimasto chiuso|porta sbattuta|porta bloccata|serratura bloccat|chiave rotta|chiave spezzat|chiave bloccata|apertura port|sblocco serratur|sblocco porta|apertura serratur/,
      eyebrow: "Apertura porte · Serratura bloccata",
      title: "Apertura Porte Urgente — Fabbro H24",
      titleCity: T("Apertura Porte Urgente"),
      sub: "Chiuso fuori · serratura bloccata · chiave rotta",
      meta: "Apertura porte e serratura bloccata: fabbro H24. Chiama 371 794 5477.",
    },
    {
      re: /fabbr/,
      eyebrow: "Fabbro urgente · Pronto intervento · H24",
      title: "Fabbro Pronto Intervento H24",
      titleCity: T("Fabbro Pronto Intervento"),
      sub: "Apertura porte · serrature · cilindri · porte blindate",
      meta: "Fabbro urgente e pronto intervento H24. Chiama 371 794 5477.",
    },
    {
      re: /riparazion[ei] idraulic|riparare tub|idraulico per riparazion/,
      eyebrow: "Riparazioni idrauliche · H24",
      title: "Riparazioni Idrauliche Urgenti",
      titleCity: T("Riparazioni Idrauliche Urgenti"),
      sub: "Perdite · rubinetti · flessibili · scarichi",
      meta: "Riparazioni idrauliche urgenti a domicilio. Chiama 371 794 5477.",
    },
    {
      re: /pronto intervento idraulic|idraulico pronto intervento/,
      eyebrow: "Pronto intervento idraulico · H24",
      title: "Pronto Intervento Idraulico H24",
      titleCity: T("Pronto Intervento Idraulico"),
      sub: "Intervento idraulico · perdite · scarichi",
      meta: "Pronto intervento idraulico H24 in zona. Chiama 371 794 5477.",
    },
    {
      re: /intervento idraulic|interventi idraulic/,
      eyebrow: "Intervento idraulico · H24",
      title: "Intervento Idraulico Urgente H24",
      titleCity: T("Intervento Idraulico Urgente"),
      sub: "Perdite · tubo rotto · scarichi otturati · WC intasato",
      meta: "Intervento idraulico urgente H24 in zona. Chiama 371 794 5477.",
    },
    {
      re: /idraulic/,
      eyebrow: "Idraulico urgente · H24",
      title: "Idraulico Urgente H24",
      titleCity: T("Idraulico Urgente H24"),
      sub: "Idraulico urgente · pronto intervento",
      meta: "Idraulico urgente H24: rispondiamo subito. Chiama 371 794 5477.",
    },
  ];

  /* A rule may only re-title a page of the same family (no fabbro H1 on the idraulico page). */
  var FAMILY = { idraulico: "idr", ricerca: "idr", scarichi: "idr", perdite: "idr", caldaie: "idr", fabbro: "fab", serrature: "fab", tapparelle: "tap" };
  function ruleFamily(r) {
    var t = r.title.toLowerCase();
    if (/fabbro|serratur|porte|apertura/.test(t)) return "fab";
    if (/tapparell|serrand|basculant/.test(t)) return "tap";
    return "idr";
  }
  function fits(kind, r) {
    var f = FAMILY[kind] || "idr";
    var rf = ruleFamily(r);
    if (f === rf) return true;
    /* the fabbro page also lists tapparelle/serrande */
    return f === "fab" && rf === "tap";
  }

  function pickCopy(kind, kw) {
    var base = BASE[kind] || BASE.idraulico;
    var pack = {
      eyebrow: base.eyebrow,
      title: base.title,
      titleCity: base.titleCity,
      sub: base.sub,
      meta: base.meta,
    };
    /* service pages keep their own service unless the keyword is clearly for it */
    if (kw) {
      for (var i = 0; i < RULES.length; i++) {
        if (!fits(kind, RULES[i])) continue;
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
    var city = cityLoc();
    /* No keyword and no known place: keep the page's own static copy (no flicker, same for SEO). */
    if (!kw && !city) return;
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
