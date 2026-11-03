/**
 * Ads message match - v20261103call
 *
 * Every page ships with its own strong static H1, title and meta description (good with no JavaScript, good for SEO).
 * When a visit comes from an ad with a keyword and/or a known place, this script only adapts the hero:
 *  - H1, eyebrow and lead are set once with textContent (our own sentence-case Italian copy)
 *  - the place ("a Verona") comes from the whitelist in ads-geo.js, never from the raw keyword
 *  - document.title and the meta description follow the hero (meta <= 155 characters)
 * The raw search keyword is never written into the page, so nothing unverifiable or injected can show up.
 * A rule only applies on the page it belongs to (the ad group already picks the page).
 * Load after ads-geo.js (both deferred, in order).
 */
(function () {
  if (window.__gfAdsQsMatch) return;
  window.__gfAdsQsMatch = true;

  var VER = "20261103call";
  var PHONE = "388 809 1482";
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
    var out = String(v);
    try {
      out = decodeURIComponent(out.replace(/\+/g, " "));
    } catch (e) {}
    return out.trim().slice(0, 160);
  }

  /* lower case, no accents, letters and digits only: "perdita d'acqua" -> "perdita d acqua" */
  function norm(s) {
    var t = String(s || "").toLowerCase();
    try { t = t.normalize("NFD"); } catch (e) {}
    return t.replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function getKeyword(p) {
    return norm(decodeVal(p.get("utm_keyword") || p.get("utm_term") || p.get("kw")));
  }

  /* which page we are on: body[data-page], with the path as a fallback */
  var PAGES = ["idraulico", "perdite", "ricerca", "scarichi", "caldaie", "fabbro", "serrature", "tapparelle"];
  function pageKind() {
    var k = "";
    try { k = (document.body && document.body.getAttribute("data-page")) || ""; } catch (e) {}
    if (PAGES.indexOf(k) >= 0) return k;
    var path = (location.pathname || "").toLowerCase();
    if (path.indexOf("basculanti") >= 0 || path.indexOf("tapparelle") >= 0) return "tapparelle";
    if (path.indexOf("scarichi") >= 0) return "scarichi";
    if (path.indexOf("ricerca-perdite") >= 0) return "ricerca";
    if (path.indexOf("perdite") >= 0) return "perdite";
    if (path.indexOf("caldaie") >= 0) return "caldaie";
    if (path.indexOf("porte-serrature") >= 0) return "serrature";
    if (path.indexOf("fabbro") >= 0) return "fabbro";
    if (path.indexOf("idraulico") >= 0) return "idraulico";
    return "";
  }

  /* "a Verona" / "in provincia di Verona": set by ads-geo.js from the whitelist only */
  function cityLoc() {
    try {
      return window.__gfGeoLoc || "";
    } catch (e) {
      return "";
    }
  }

  /* Heading used when only the place is known: short, so that "a Verona" still fits on two lines. */
  var CITY_H1 = {
    idraulico: "Intervento idraulico urgente",
    perdite: "Perdita d\u2019acqua",
    ricerca: "Ricerca perdite d\u2019acqua",
    scarichi: "Scarico otturato",
    caldaie: "Caldaia in blocco",
    fabbro: "Fabbro urgente",
    serrature: "Serratura bloccata",
    tapparelle: "Tapparelle bloccate"
  };

  /* Keyword -> copy. Per page, most specific first. Regexes work on norm() text (no accents, no punctuation).
     No claim about opening hours, prices or response times anywhere in this copy. */
  var RULES = {
    idraulico: [
      {
        re: /riparazion[ei] idraulic|riparare (un )?tub|idraulico per riparazion/,
        title: "Riparazioni idrauliche urgenti",
        eyebrow: "Riparazioni idrauliche",
        sub: "Perdite, rubinetti, flessibili e scarichi. Dicci cosa \u00e8 successo e dove sei.",
        meta: "Riparazioni idrauliche urgenti a domicilio: perdite, rubinetti, flessibili, scarichi. Chiama o scrivi su WhatsApp: " + PHONE + "."
      },
      {
        re: /pronto intervento|emergenza|urgent/,
        title: "Idraulico pronto intervento",
        eyebrow: "Idraulico, pronto intervento",
        sub: "Perdita, allagamento o scarico bloccato? Chiamaci: ci servono solo il problema e il comune.",
        meta: "Idraulico pronto intervento a domicilio: perdite, allagamenti, WC e scarichi bloccati. Chiama o scrivi su WhatsApp: " + PHONE + "."
      },
      {
        re: /intervento idraulic/,
        title: "Intervento idraulico urgente",
        eyebrow: "Idraulico, pronto intervento",
        sub: "Perdita, allagamento o scarico bloccato? Chiamaci: ci servono solo il problema e il comune.",
        meta: "Intervento idraulico urgente a domicilio: perdite, tubi rotti, rubinetti e scarichi. Chiama o scrivi su WhatsApp: " + PHONE + "."
      },
      {
        re: /idraulic/,
        title: "Idraulico a domicilio",
        eyebrow: "Idraulico, pronto intervento",
        sub: "Perdita, allagamento o scarico bloccato? Dicci cosa \u00e8 successo e dove sei.",
        meta: "Idraulico a domicilio, vicino a te: perdite, allagamenti, WC e scarichi bloccati. Chiama o scrivi su WhatsApp: " + PHONE + "."
      }
    ],
    perdite: [
      {
        re: /allagament/,
        title: "Allagamento in casa",
        eyebrow: "Allagamenti",
        sub: "Acqua sul pavimento? Chiudi il contatore, se riesci, e chiamaci.",
        meta: "Allagamento in casa? Idraulico urgente a domicilio, vicino a te. Chiudi l\u2019acqua e chiama il " + PHONE + " o scrivi su WhatsApp."
      },
      {
        re: /tubo (rotto|scoppiat|che perde)|tubatur|flessibil/,
        title: "Tubo rotto o che perde",
        eyebrow: "Tubi e flessibili",
        sub: "Tubo, raccordo o flessibile che perde. Chiudi l\u2019acqua e dicci dove sei.",
        meta: "Tubo rotto o che perde? Idraulico a domicilio, vicino a te. Chiudi l\u2019acqua e chiama il " + PHONE + " o scrivi su WhatsApp."
      },
      {
        re: /soffitto/,
        title: "Acqua dal soffitto",
        eyebrow: "Perdite dall\u2019alto",
        sub: "Macchia che si allarga o gocce dal soffitto? Dicci da quanto succede.",
        meta: "Acqua dal soffitto in casa? Cerchiamo la causa e ripariamo. Idraulico a domicilio. Chiama il " + PHONE + "."
      },
      {
        re: /perdit|acqua|idraulic/,
        title: "Perdita d\u2019acqua in casa",
        eyebrow: "Perdite d\u2019acqua e allagamenti",
        sub: "Tubo che perde, acqua dal soffitto o allagamento. Chiudi l\u2019acqua e chiamaci.",
        meta: "Tubo che perde, acqua dal soffitto, allagamento? Idraulico urgente a domicilio. Chiama o scrivi su WhatsApp: " + PHONE + "."
      }
    ],
    ricerca: [
      {
        re: /pavimento/,
        title: "Perdita sotto il pavimento",
        eyebrow: "Ricerca perdite",
        sub: "Piastrelle umide o contatore che gira? Cerchiamo il punto prima di rompere.",
        meta: "Perdita d\u2019acqua sotto il pavimento? Cerchiamo il punto e apriamo solo dove serve. Chiama il " + PHONE + "."
      },
      {
        re: /muro|parete|sotto traccia/,
        title: "Perdita d\u2019acqua nel muro",
        eyebrow: "Ricerca perdite",
        sub: "Macchia sul muro o rumore d\u2019acqua? Troviamo il tratto rotto e apriamo solo l\u00ec.",
        meta: "Perdita d\u2019acqua nel muro? Cerchiamo il tratto di tubo rotto e apriamo solo dove serve. Chiama il " + PHONE + "."
      },
      {
        re: /perdit|fughe|occult|nascost|contatore/,
        title: "Ricerca perdite d\u2019acqua occulte",
        eyebrow: "Ricerca perdite",
        sub: "Perdita nel muro o sotto il pavimento? Cerchiamo il punto e apriamo solo dove serve.",
        meta: "Perdita nel muro, sotto il pavimento o contatore che gira? Cerchiamo il punto e apriamo solo dove serve. Chiama il " + PHONE + "."
      }
    ],
    scarichi: [
      {
        re: /\bwc\b|water|gabinetto/,
        title: "WC intasato o che non scarica",
        eyebrow: "WC intasato",
        sub: "L\u2019acqua sale o non scende? Non tirare lo sciacquone e chiamaci.",
        meta: "WC intasato o che non scarica? Idraulico a domicilio. Chiama o scrivi su WhatsApp: " + PHONE + "."
      },
      {
        re: /lavandino|lavello|cucina|doccia|piletta|sifone/,
        title: "Lavandino o doccia che non scaricano",
        eyebrow: "Scarichi lenti o bloccati",
        sub: "Acqua ferma o scarico lento? Dicci quale scarico e da quanto.",
        meta: "Lavandino o doccia che non scaricano? Idraulico a domicilio. Chiama il " + PHONE + "."
      },
      {
        re: /ottur|intas|bloccat|ingorg|stur|stasatur|disostru|disottur/,
        title: "Scarico otturato",
        eyebrow: "Scarichi otturati",
        sub: "WC, lavandino o doccia che non scendono? Non versare prodotti: chiamaci.",
        meta: "Scarico otturato o WC intasato? Idraulico a domicilio. Chiama o scrivi su WhatsApp: " + PHONE + "."
      }
    ],
    caldaie: [
      {
        re: /scaldabagn|boiler/,
        title: "Scaldabagno senza acqua calda",
        eyebrow: "Scaldabagno",
        sub: "Niente acqua calda o perdita dal boiler? Dicci marca e modello.",
        meta: "Scaldabagno senza acqua calda o che perde? Dicci marca e problema: ti diciamo se possiamo intervenire. Chiama il " + PHONE + "."
      },
      {
        re: /acqua calda/,
        title: "Niente acqua calda?",
        eyebrow: "Caldaia e scaldabagno",
        sub: "Esce solo acqua fredda o tiepida? Dicci marca e codice errore, se compare.",
        meta: "Senza acqua calda? Dicci marca e problema di caldaia o scaldabagno: ti diciamo se possiamo intervenire. Chiama il " + PHONE + "."
      },
      {
        re: /caldai/,
        title: "Caldaia in blocco o senza acqua calda",
        eyebrow: "Caldaia e scaldabagno",
        sub: "Caldaia che non parte o scaldabagno che perde? Dicci marca e codice errore, se compare.",
        meta: "Caldaia in blocco, scaldabagno senza acqua calda o che perde? Dicci marca e problema: ti diciamo se possiamo intervenire. Chiama il " + PHONE + "."
      }
    ],
    fabbro: [
      {
        re: /cilindr/,
        title: "Cambio cilindro urgente",
        eyebrow: "Serrature e cilindri",
        sub: "Cilindro rotto, chiavi perse o serratura che gira a vuoto? Dicci che porta hai.",
        meta: "Cambio cilindro urgente: serratura che gira a vuoto o chiavi perse. Fabbro a domicilio. Chiama il " + PHONE + "."
      },
      {
        re: /blindat/,
        title: "Porta blindata bloccata",
        eyebrow: "Porte blindate",
        sub: "Blindata che non si apre o non chiude bene? Dicci marca e tipo, se li conosci.",
        meta: "Porta blindata bloccata o da riparare? Fabbro a domicilio. Chiama o scrivi su WhatsApp: " + PHONE + "."
      },
      {
        re: /chiuso fuori|chiusi fuori|apertura|aprire|sblocc|sbattut|bloccat/,
        title: "Fabbro per apertura porte",
        eyebrow: "Apertura porte",
        sub: "Chiuso fuori o porta bloccata? Apriamo senza rompere la porta, quando si pu\u00f2.",
        meta: "Chiuso fuori casa o porta bloccata? Fabbro a domicilio. Chiama o scrivi su WhatsApp: " + PHONE + "."
      },
      {
        re: /fabbr/,
        title: "Fabbro pronto intervento",
        eyebrow: "Fabbro, pronto intervento",
        sub: "Chiuso fuori, serratura bloccata o chiave spezzata. Chiamaci e dicci dove sei.",
        meta: "Fabbro a domicilio: chiuso fuori, serratura bloccata, chiave spezzata. Chiama o scrivi su WhatsApp: " + PHONE + "."
      }
    ],
    serrature: [
      {
        re: /sostituzion|cambio|cambiare|cambiamento/,
        title: "Sostituzione serratura",
        eyebrow: "Serrature e cilindri",
        sub: "Serratura rotta o che gira a vuoto? Cambiamo serratura o cilindro.",
        meta: "Sostituzione serratura e cambio cilindro, anche su porta blindata. Fabbro a domicilio. Chiama il " + PHONE + "."
      },
      {
        re: /blindat/,
        title: "Riparazione porta blindata",
        eyebrow: "Porte blindate",
        sub: "Blindata che non si apre o non chiude bene? Dicci marca e tipo, se li conosci.",
        meta: "Riparazione porta blindata: apertura, serratura e cilindro. Fabbro a domicilio. Chiama il " + PHONE + "."
      },
      {
        re: /chiave (spezzat|rott|bloccat)/,
        title: "Chiave spezzata nella serratura",
        eyebrow: "Chiave spezzata",
        sub: "Non insistere con pinze o colla. Dicci che serratura hai.",
        meta: "Chiave spezzata nella serratura? Estraiamo il pezzo e, se serve, cambiamo il cilindro. Chiama il " + PHONE + "."
      },
      {
        re: /porta bloccata|porta che non si apre/,
        title: "Porta bloccata",
        eyebrow: "Apertura porte",
        sub: "Porta che non si apre? Non forzarla. Chiamaci e dicci che porta hai.",
        meta: "Porta bloccata? Fabbro a domicilio: apriamo e sistemiamo la serratura. Chiama il " + PHONE + "."
      },
      {
        re: /serratur|cilindr|fabbr|porta|chiave/,
        title: "Serratura bloccata o rotta",
        eyebrow: "Porte e serrature",
        sub: "Chiave che non gira, cilindro rotto o blindata che non si apre. Dicci che porta hai.",
        meta: "Serratura bloccata, chiave spezzata o porta blindata che non si apre? Fabbro a domicilio. Chiama il " + PHONE + "."
      }
    ],
    tapparelle: [
      {
        re: /cinghia|molla/,
        title: "Cinghia o molla rotta",
        eyebrow: "Tapparelle e basculanti",
        sub: "Cinghia sfilacciata o molla scarica? Non forzare: dicci cosa succede.",
        meta: "Cinghia o molla di tapparella o basculante rotta? Riparazione a domicilio. Chiama il " + PHONE + "."
      },
      {
        re: /basculant|serrand|garage|box/,
        title: "Basculante o serranda bloccati",
        eyebrow: "Basculanti e serrande",
        sub: "Garage che non si apre? Non forzare: dicci cosa succede.",
        meta: "Basculante o serranda del garage bloccati? Riparazione a domicilio. Chiama il " + PHONE + "."
      },
      {
        re: /riparazion[ei] tapparell/,
        title: "Riparazione tapparelle",
        eyebrow: "Tapparelle",
        sub: "Non sale, non scende o scende storta? Non forzarla: chiamaci.",
        meta: "Riparazione tapparelle a domicilio. Non forzarla: chiama il " + PHONE + " o scrivi su WhatsApp."
      },
      {
        re: /tapparell/,
        title: "Tapparella bloccata o rotta",
        eyebrow: "Tapparelle",
        sub: "Non sale, non scende o scende storta? Non forzarla: chiamaci.",
        meta: "Tapparella che non sale o non scende? Riparazione a domicilio. Chiama o scrivi su WhatsApp: " + PHONE + "."
      }
    ]
  };

  function el(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    var n = el(id);
    if (!n || !text) return;
    if (n.textContent !== text) n.textContent = text;
  }

  function setMeta(sel, attr, value) {
    if (!value) return;
    var nodes = document.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) nodes[i].setAttribute(attr, value);
  }

  function matchRule(kind, kw) {
    var list = RULES[kind] || [];
    if (!kw) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].re.test(kw)) return list[i];
    }
    return null;
  }

  function apply() {
    var kind = pageKind();
    if (!kind) return;
    var p = params();
    var kw = getKeyword(p);
    var city = cityLoc();
    /* No keyword and no known place: keep the static copy untouched (same for SEO, no flicker). */
    if (!kw && !city) return;

    var rule = matchRule(kind, kw);
    var title, sub, eyebrow, meta;
    if (rule) {
      title = city ? rule.title.replace(/[?!]$/, "") + " " + city : rule.title;
      sub = rule.sub;
      eyebrow = rule.eyebrow;
      meta = rule.meta;
    } else if (city && CITY_H1[kind]) {
      title = CITY_H1[kind] + " " + city;
    } else {
      return;
    }

    var sig = [VER, title, sub || "", eyebrow || "", meta || ""].join("\u0001");
    if (sig === lastApplied) return;
    lastApplied = sig;

    setText("gf-hero-title", title);
    setText("gf-hero-sub", sub);
    setText("gf-hero-eyebrow", eyebrow);

    var t = title + " | " + PHONE;
    if (document.title !== t) document.title = t;
    setMeta('meta[property="og:title"]', "content", title + " | Sos Interventi");
    if (meta && meta.length <= 155) {
      setMeta('meta[name="description"]', "content", meta);
      setMeta('meta[property="og:description"]', "content", meta);
    }

    try {
      document.documentElement.setAttribute("data-gf-qs-ver", VER);
      if (kw) document.documentElement.setAttribute("data-gf-kw-match", rule ? "1" : "0");
      if (city) document.documentElement.setAttribute("data-gf-city", city);
    } catch (e) {}
  }

  window.gfApplyAdsQsHero = apply;
  window.__gfQsRules = RULES;

  /* The head script hides the hero copy for ad visits (class qs-pending) so the text never jumps: show it now. */
  function ready() {
    try {
      document.documentElement.classList.remove("qs-pending");
    } catch (e) {}
  }

  function boot() {
    try {
      apply();
    } finally {
      ready();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  /* second pass only if the place arrived late; guarded by the signature, so it never repeats the same write */
  window.addEventListener("load", function () {
    apply();
  });
})();
