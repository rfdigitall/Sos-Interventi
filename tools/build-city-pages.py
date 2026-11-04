#!/usr/bin/env python3
"""Sos Interventi - pagine città per Google Ads (Quality Score).

Genera /idraulico/<citta>/index.html e /fabbro/<citta>/index.html partendo da
idraulico.html e fabbro.html. Ogni pagina ha titolo, H1, descrizione, testo,
zone vicine e una domanda frequente propri della città, così Google la legge
come pagina di quella città (il testo dinamico da URL non conta per il QS).

Nessun indirizzo o sede: ogni città sembra la zona di lavoro.

Uso:  python3 tools/build-city-pages.py      (poi aggiorna anche sitemap.xml)
Se cambiano idraulico.html o fabbro.html, rilanciare per riallineare le città.
"""
import json
import os
import re
import html

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = "https://sos-interventi.it"
PHONE = "388 809 1482"

CITIES = {
    "venezia": {
        "name": "Venezia",
        "near": ["Lido", "Giudecca", "Murano", "Cannaregio", "Castello", "Dorsoduro"],
        "idraulico": "Nel centro storico le case sono antiche e i tubi passano spesso dentro muri spessi o sotto pavimenti umidi: una perdita si scopre tardi, quando l’acqua arriva al piano di sotto. Al telefono dicci sestiere, calle e piano, così capiamo come arrivare e cosa portare.",
        "fabbro": "Portoni in legno, serrature a doppia mappa ancora molto diffuse e porte blindate nei palazzi restaurati: a Venezia ogni porta è diversa. Al telefono dicci sestiere e che tipo di porta hai, così arriviamo con il cilindro o l’attrezzo giusto.",
    },
    "mestre": {
        "name": "Mestre",
        "near": ["Marghera", "Favaro Veneto", "Chirignago", "Zelarino", "Carpenedo", "Spinea", "Mogliano Veneto", "Marcon"],
        "idraulico": "Molti condomini di Mestre hanno colonne di scarico e tubazioni degli anni ’60 e ’70: quando cedono, l’acqua passa da un appartamento all’altro. Se vedi una macchia sul soffitto o l’acqua che risale dallo scarico, chiudi il rubinetto generale e dicci via, scala e piano.",
        "fabbro": "Nei condomini di Mestre le porte d’ingresso sono quasi tutte blindate con cilindro europeo: chiave rotta, cilindro che gira a vuoto o porta chiusa alle spalle sono i casi più comuni. Dicci via, scala e piano e che porta hai.",
    },
    "padova": {
        "name": "Padova",
        "near": ["Abano Terme", "Albignasego", "Rubano", "Selvazzano Dentro", "Vigonza", "Cadoneghe", "Noventa Padovana", "Ponte San Nicolò"],
        "idraulico": "Tra i palazzi del centro e le villette della cintura, a Padova i guasti più frequenti sono flessibili della lavatrice che scoppiano, scaldabagni elettrici che perdono e scarichi della cucina bloccati. Dicci il quartiere o il comune e cosa vedi: ci basta questo per partire preparati.",
        "fabbro": "A Padova tanti appartamenti sono in affitto o abitati da studenti: chiavi perse, serrature da cambiare a fine contratto e cilindri consumati sono richieste di tutti i giorni. Dicci quartiere o comune e che porta hai, ti spieghiamo cosa serve prima di partire.",
    },
    "verona": {
        "name": "Verona",
        "near": ["San Giovanni Lupatoto", "Villafranca di Verona", "San Martino Buon Albergo", "Bussolengo", "Pescantina", "Sona", "Grezzana", "Negrar"],
        "idraulico": "L’acqua di Verona è ricca di calcare: rubinetti che non chiudono più, cassette del WC che perdono e boiler incrostati sono guasti che vediamo spesso. Se l’acqua esce, chiudi il rubinetto d’arresto e dicci quartiere o comune: da Borgo Trento a San Giovanni Lupatoto.",
        "fabbro": "Dai portoni del centro storico alle villette con cancello e basculante della provincia, a Verona le porte sono molto diverse tra loro. Dicci se è una blindata, un portoncino o un cancello e in che zona sei: ci organizziamo di conseguenza.",
    },
    "treviso": {
        "name": "Treviso",
        "near": ["Villorba", "Preganziol", "Paese", "Silea", "Ponzano Veneto", "Casier", "Quinto di Treviso", "Carbonera"],
        "idraulico": "Attorno a Treviso molte case sono singole o bifamiliari, con pozzetti e scarichi esterni: in autunno foglie e radici li intasano e l’acqua torna indietro in casa. Dicci se il problema è dentro o fuori casa e in che comune sei.",
        "fabbro": "Villette con porta di servizio, cancello pedonale e basculante del garage: attorno a Treviso spesso le porte da sistemare sono più di una. Dicci quale si è bloccata e dove sei, e se puoi mandaci una foto su WhatsApp.",
    },
    "vicenza": {
        "name": "Vicenza",
        "near": ["Torri di Quartesolo", "Altavilla Vicentina", "Creazzo", "Dueville", "Caldogno", "Costabissara", "Arcugnano", "Longare"],
        "idraulico": "Acqua dura e impianti degli anni ’70 e ’80: a Vicenza capita spesso che rubinetti, sifoni e flessibili cedano tutti insieme. Al telefono dicci cosa perde e da quanto, e il comune: da Vicenza città a Torri di Quartesolo o Creazzo.",
        "fabbro": "A Vicenza ci sono ancora tante porte blindate degli anni ’90 con serratura a doppia mappa: quando si bloccano conviene passare al cilindro europeo di sicurezza. Te lo spieghiamo al telefono prima di partire, insieme al costo.",
    },
    "udine": {
        "name": "Udine",
        "near": ["Tavagnacco", "Pasian di Prato", "Pozzuolo del Friuli", "Campoformido", "Martignacco", "Reana del Rojale", "Pradamano", "Remanzacco"],
        "idraulico": "In inverno a Udine i tubi esterni, i rubinetti del giardino e i contatori in nicchia possono gelare e spaccarsi: quando la temperatura risale arriva la perdita. Chiudi l’acqua e dicci dove si trova il guasto e in che comune sei.",
        "fabbro": "Freddo e umidità fanno indurire serrature e cilindri, soprattutto su cancelli e portoncini esterni. Se la chiave non gira più o si è spezzata, non forzarla: chiamaci e dicci che porta è e in che comune ti trovi.",
    },
    "trieste": {
        "name": "Trieste",
        "near": ["Muggia", "Opicina", "Duino Aurisina", "San Dorligo della Valle", "Sgonico", "Monrupino"],
        "idraulico": "A Trieste molti palazzi hanno tanti piani e colonne condominiali vecchie: una perdita all’ultimo piano può scendere per tutto lo stabile. Dicci via, numero civico e piano, e se c’è il portone chiuso chi può aprirci.",
        "fabbro": "Con la bora le porte sbattono e capita di restare chiusi fuori, anche dal portone condominiale. Dicci via e civico, che tipo di porta hai e se la chiave è rimasta dentro: ci organizziamo per aprire senza rovinarla, quando si può.",
    },
    "pordenone": {
        "name": "Pordenone",
        "near": ["Cordenons", "Porcia", "Fiume Veneto", "Roveredo in Piano", "Fontanafredda", "Sacile", "Azzano Decimo", "Zoppola"],
        "idraulico": "Attorno a Pordenone tante case hanno taverna o garage al piano terra: con piogge forti o un tubo rotto sono i primi locali ad allagarsi. Stacca la corrente se l’acqua è vicina alle prese e dicci comune e cosa vedi.",
        "fabbro": "Villette con porta d’ingresso, porta del garage e cancello: a Pordenone e dintorni capita spesso di chiudere le chiavi dentro casa o in auto. Dicci quale porta è e in che comune sei, ti diciamo subito come procediamo.",
    },
    "rovigo": {
        "name": "Rovigo",
        "near": ["Adria", "Lendinara", "Badia Polesine", "Occhiobello", "Porto Viro", "Costa di Rovigo", "Villadose", "Arquà Polesine"],
        "idraulico": "Nel Polesine il terreno è basso e la falda è alta: con le piogge gli scarichi esterni possono rigurgitare e le cantine riempirsi d’acqua. Dicci se l’acqua arriva da un tubo o dallo scarico e in che comune sei, da Rovigo ad Adria.",
        "fabbro": "L’umidità del Polesine ossida serrature, cilindri e lucchetti di cancelli e portoni: la chiave entra ma non gira più. Non insistere per non spezzarla: chiamaci e dicci che porta è e dove ti trovi.",
    },
    "belluno": {
        "name": "Belluno",
        "near": ["Feltre", "Ponte nelle Alpi", "Sedico", "Limana", "Santa Giustina", "Longarone", "Borgo Valbelluna"],
        "idraulico": "Con il gelo dell’inverno, nelle case di montagna e nelle seconde case chiuse per settimane i tubi si spaccano: spesso ci si accorge della perdita solo al ritorno. Chiudi il contatore e dicci comune e dove vedi l’acqua.",
        "fabbro": "Nelle seconde case chiuse per l’inverno capita di trovare la serratura bloccata o di aver lasciato le chiavi in città. Dicci comune, tipo di porta e se si tratta di casa, garage o cancello.",
    },
}

TRADE = {
    "idraulico": {
        "template": "idraulico.html",
        "title": "Idraulico a {c} pronto intervento | " + PHONE,
        "h1": "Idraulico pronto intervento a {c}",
        "lead": "Perdita, allagamento o scarico bloccato a {c}? Chiamaci: ci servono solo il problema e l’indirizzo.",
        "desc": "Idraulico a {c} e dintorni: perdite, tubi rotti, WC e scarichi bloccati. Chiama o scrivi su WhatsApp: " + PHONE + ".",
        "eyebrow": "Idraulico a {c}",
        "zone_h2": "Idraulico a {c} e nei comuni vicini",
        "faq_q": "Venite anche fuori {c}?",
        "svc": "Idraulico pronto intervento a {c}",
    },
    "fabbro": {
        "template": "fabbro.html",
        "title": "Fabbro a {c} pronto intervento | " + PHONE,
        "h1": "Fabbro pronto intervento a {c}",
        "lead": "Chiuso fuori, serratura bloccata o chiave spezzata a {c}? Chiamaci e dicci dove sei.",
        "desc": "Fabbro a {c} e dintorni: apertura porte, chiavi spezzate, cambio serratura e cilindro. Chiama o scrivi su WhatsApp: " + PHONE + ".",
        "eyebrow": "Fabbro a {c}",
        "zone_h2": "Fabbro a {c} e nei comuni vicini",
        "faq_q": "Venite anche fuori {c}?",
        "svc": "Fabbro pronto intervento a {c}",
    },
}

ZONE_CSS = (
    "<style>.sos-city{background:#fffcf7;padding:3rem 0;border-top:1px solid #d9d0c3}"
    ".sos-city__txt{max-width:44rem;font-size:1.05rem;line-height:1.6;margin:0 0 1.4rem}"
    ".sos-city__zones{display:flex;flex-wrap:wrap;gap:.5rem;list-style:none;padding:0;margin:0 0 1.6rem}"
    ".sos-city__zones li{border:1px solid #d9d0c3;border-radius:999px;padding:.35rem .85rem;font-size:.92rem;background:#f3ede4}"
    "</style>"
)

REL_ATTR = re.compile(r'((?:href|src)=")(?!https?:|tel:|mailto:|#|/|\.\./|data:|wa\.me)([^"]+")')


def fix_paths(h):
    return REL_ATTR.sub(lambda m: m.group(1) + "../../" + m.group(2), h)


def must_sub(pattern, repl, text, count=1, flags=0):
    new, n = re.subn(pattern, repl, text, count=count, flags=flags)
    if n == 0:
        raise SystemExit(f"pattern not found: {pattern}")
    return new


def build(trade, slug, city):
    t = TRADE[trade]
    c = city["name"]
    e = lambda s: html.escape(s, quote=True)
    url = f"{SITE}/{trade}/{slug}/"
    with open(os.path.join(ROOT, t["template"]), encoding="utf-8") as f:
        h = f.read()

    title = t["title"].format(c=c)
    desc = t["desc"].format(c=c)
    h1 = t["h1"].format(c=c)

    h = must_sub(r"<title>.*?</title>", f"<title>{e(title)}</title>", h)
    h = must_sub(r'(<meta name="description" content=")[^"]*', r"\g<1>" + e(desc), h)
    h = must_sub(r'(<meta property="og:description" content=")[^"]*', r"\g<1>" + e(desc), h)
    h = must_sub(r'(<meta property="og:title" content=")[^"]*', r"\g<1>" + e(h1) + " | Sos Interventi", h)
    h = must_sub(r'(<link rel="canonical" href=")[^"]*', r"\g<1>" + url, h)
    h = must_sub(r'(<meta property="og:url" content=")[^"]*', r"\g<1>" + url, h)
    # fixed city for the geo scripts (H1 never shows another city on this page)
    h = must_sub(r'(<meta name="viewport"[^>]*>)', r'\1\n  <meta name="gf-city" content="' + e(c) + '">', h)

    # schema: this page serves the city, not the whole region
    h = must_sub(r'"areaServed": \[[\s\S]*?\n    \],',
                 '"areaServed": [\n      {\n        "@type": "City",\n        "name": ' + json.dumps(c, ensure_ascii=False) + '\n      }\n    ],', h)
    h = must_sub(r'("url": ")https://sos-interventi\.it/' + re.escape(t["template"]) + '(",)', r"\g<1>" + url + r"\g<2>", h)
    h = must_sub(r'("description": ")[^"]*(",)', r"\g<1>" + desc.replace("\\", "") + r"\g<2>", h)

    h = must_sub(r'(<h1 id="gf-hero-title">)[^<]*(</h1>)', r"\g<1>" + e(h1) + r"\g<2>", h)
    h = must_sub(r'(<p class="idra-hero__lead" id="gf-hero-sub">)[^<]*(</p>)', r"\g<1>" + e(t["lead"].format(c=c)) + r"\g<2>", h)
    h = must_sub(r'(id="gf-hero-eyebrow">)[^<]*(</span>)', r"\g<1>" + e(t["eyebrow"].format(c=c)) + r"\g<2>", h)
    h = re.sub(r'(<span class="gf-loc" data-gf-geo-loc>)[^<]*(</span>)', r"\g<1>a " + e(c) + r"\g<2>", h)
    h = must_sub(r'(<p class="footer-cities">)[^<]*(</p>)', r"\g<1>Interventi a " + e(c) + r" e dintorni\g<2>", h)

    near = city["near"]
    zones = "".join(f"<li>{e(z)}</li>" for z in [c] + near)
    section = f"""
    <section class="sos-city" id="zona" aria-labelledby="zona-title">
      {ZONE_CSS}
      <div class="wrap idra-wrap">
        <p class="section__eyebrow">{e(t["eyebrow"].format(c=c))}</p>
        <h2 id="zona-title">{e(t["zone_h2"].format(c=c))}</h2>
        <p class="sos-city__txt">{e(city[trade])}</p>
        <ul class="sos-city__zones" aria-label="Zone">{zones}</ul>
        <p class="idra-faq__cta"><a href="tel:+393888091482">Chiama {PHONE} →</a></p>
      </div>
    </section>
"""
    # after the problems grid (#urgenza), before the next section
    h = must_sub(r'(<section id="urgenza"[\s\S]*?</section>\n)', r"\g<1>" + section.replace("\\", "\\\\"), h)

    faq = f"""
          <details class="idra-faq__card">
            <summary>{e(t["faq_q"].format(c=c))}</summary>
            <p>Sì. Oltre a {e(c)} lavoriamo nei comuni vicini come {e(", ".join(near[:-1]))} e {e(near[-1])}. Al telefono dicci il comune e ti diciamo quando possiamo arrivare.</p>
            <p class="idra-faq__cta"><a href="tel:+393888091482">Chiama →</a></p>
          </details>"""
    h = must_sub(r'(<div class="idra-faq__grid" data-faq-accordion>)', r"\g<1>" + faq, h)

    h = fix_paths(h)
    out_dir = os.path.join(ROOT, trade, slug)
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(h)
    return url


def update_sitemap(urls):
    p = os.path.join(ROOT, "sitemap.xml")
    with open(p, encoding="utf-8") as f:
        s = f.read()
    s = re.sub(r"\s*<url><loc>[^<]*/(?:idraulico|fabbro)/(?:" + "|".join(CITIES) + r")/</loc>.*?</url>", "", s, flags=re.S)
    block = "".join(f"\n  <url><loc>{u}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>" for u in urls)
    s = s.replace("</urlset>", block + "\n</urlset>")
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


if __name__ == "__main__":
    urls = []
    for trade in TRADE:
        for slug, city in CITIES.items():
            urls.append(build(trade, slug, city))
    update_sitemap(urls)
    print(f"{len(urls)} pagine città generate")
