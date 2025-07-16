// app.js — version unifiée, propre et scalable

let motsComplet = [], mots = [], interfaceData = {}, indexMot = 0;
const langueNavigateur = navigator.language.slice(0, 2);
let langueTrad = localStorage.getItem('langueTrad') || 'fr';
let langueInterface = localStorage.getItem('langueInterface') || (langueNavigateur === 'en' ? 'en' : 'fr');
let fuse;

const escapeHTML = str =>
  str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));

const afficherLog = (msg, type = 'info') => {
  const el = document.getElementById('messageStatus');
  if (el) {
    el.style.color = type === 'error' ? 'red' : 'green';
    el.textContent = msg;
    el.hidden = false;
  }
};

const chargerJSON = url =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    return res.json();
  });

const afficherMot = (motIndex = indexMot) => {
  if (!mots.length) return;
  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  localStorage.setItem('motIndex', indexMot);
  const mot = mots[indexMot];

  document.getElementById('motTexte').textContent = mot.mot || '—';
  document.getElementById('definition').innerHTML =
    escapeHTML(mot[langueTrad] || '—') +
    (mot.cat ? `<span style="color:#888;"> (${escapeHTML(mot.cat)})</span>` : '');
  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
};

const afficherMessage = (type, contenu) => {
  const chatBox = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${type === 'utilisateur' ? (interfaceData[langueInterface]?.utilisateur || 'Vous') : 'Bot'}:</strong> ${contenu}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  msg.querySelectorAll('.btn-ecouter').forEach(btn => {
    btn.addEventListener('click', () => {
      const audio = new Audio(`audios/${btn.dataset.audio}.mp3`);
      audio.play().catch(() => alert("⚠️ Audio introuvable ou non pris en charge."));
    });
  });
};

const nettoyerTexte = str =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, "").toLowerCase();

const envoyerMessage = () => {
  const input = document.getElementById('chatInput');
  const txt = input.value.trim();
  if (!txt) return;
  input.value = '';

  const clean = nettoyerTexte(txt);
  afficherMessage('utilisateur', escapeHTML(txt));

  const botData = interfaceData[langueInterface]?.botIntelligence || {};
  const faq = botData.faq || {};

  if (botData.insultes?.some(i => clean.includes(nettoyerTexte(i)))) {
    return afficherMessage('bot', botData.insulte || "🙏 Merci de rester poli.");
  }

  if (botData.salutations_triggers?.some(trigger => clean.includes(nettoyerTexte(trigger)))) {
    const rep = botData.salutations[Math.floor(Math.random() * botData.salutations.length)];
    return afficherMessage('bot', rep);
  }

  for (const q in faq) {
    if (clean.includes(nettoyerTexte(q))) {
      return afficherMessage('bot', faq[q]);
    }
  }

  const res = fuse.search(txt).slice(0, 1);
  if (res.length) {
    const m = res[0].item;
    return afficherMessage('bot', `🔍 <strong>${m.mot}</strong><br>Français : <strong>${m.fr}</strong><br>Anglais : <strong>${m.en}</strong>`);
  }

  rechercherDansHistoireEtMedia(clean);
};

const rechercherDansHistoireEtMedia = (clean) => {
  const triggers = interfaceData[langueInterface]?.chatTriggers || {};
  const phrases = interfaceData[langueInterface]?.chatPhrases || {};

  for (const [trigger, key] of Object.entries(triggers)) {
    if (clean.includes(nettoyerTexte(trigger))) {
      const intro = phrases[key] || `🔎 Voici ce que j’ai trouvé sur "${trigger}" :`;
      const match = window.histoireDocs.find(d =>
        nettoyerTexte(d.titre + d.contenu).includes(nettoyerTexte(trigger)));

      if (match) {
        let contenu = `<strong>${escapeHTML(match.titre)}</strong><br>${escapeHTML(match.contenu)}<br>`;
        contenu += `<button class="btn-icon btn-ecouter" data-audio="${trigger}">🔊 Écouter en Tadaksahak</button>`;
        if (match.image) contenu += `<br><img src="${match.image}" alt="Illustration" style="max-width:100%;">`;
        if (match.video) contenu += `<br><video controls width="100%">
          <source src="${match.video}" type="video/mp4"></video>`;
        return afficherMessage('bot', contenu);
      } else {
        return afficherMessage('bot', intro + "<br>❗ Aucun contenu disponible.");
      }
    }
  }

  const results = window.histoireDocs.filter(d =>
    nettoyerTexte(d.titre + d.contenu).includes(clean)
  );

  if (results.length) {
    const bloc = results.map(d =>
      `<strong>${escapeHTML(d.titre)}</strong><br>${escapeHTML(d.contenu)}`
    ).join('<hr>');
    return afficherMessage('bot', bloc);
  }

  const suggestions = motsComplet.filter(m =>
    nettoyerTexte(m.fr).includes(clean) || nettoyerTexte(m.en).includes(clean)
  ).slice(0, 5);

  if (suggestions.length) {
    const list = suggestions.map(s => `<li><strong>${s.mot}</strong> – ${s.fr} / ${s.en}</li>`).join('');
    return afficherMessage('bot', `❓ Suggestions :<ul>${list}</ul>`);
  }

  afficherMessage('bot', interfaceData[langueInterface]?.incompréhension || "❓ Je ne comprends pas.");
};

const initialiserMenusLangues = () => {
  const nomsLangues = { fr: "Français", en: "English", ar: "العربية" };
  const languesDispo = Object.keys(mots[0]).filter(k => k !== 'mot' && k !== 'cat');

  ['Interface', 'Trad'].forEach(type => {
    const btn = document.getElementById(`btnLangue${type}`);
    const menu = document.getElementById(`menuLangue${type}`);
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
      if (!menu.hidden) {
        menu.innerHTML = Object.entries(nomsLangues).filter(([code]) =>
          type === 'Interface' || languesDispo.includes(code)
        ).map(([code, nom]) =>
          `<button class="langue-item" data-code="${code}">${nom}</button>`
        ).join('');

        menu.querySelectorAll('button').forEach(b => {
          b.onclick = () => {
            const val = b.dataset.code;
            localStorage.setItem(type === 'Interface' ? 'langueInterface' : 'langueTrad', val);
            if (type === 'Interface') location.reload();
            else {
              langueTrad = val;
              btn.textContent = `Traduction : ${nomsLangues[val]} ⌄`;
              afficherMot(indexMot);
            }
            menu.hidden = true;
          };
        });
      }
    });
  });
};

const changerLangueInterface = code => {
  const data = interfaceData[code] || interfaceData.fr;
  document.documentElement.lang = code;
  document.body.dir = code === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (data[key]) el.textContent = data[key];
  });

  document.getElementById('btnLangueInterface').textContent = `Interface : ${code}`;
  document.getElementById('btnLangueTrad').textContent = `Traduction : ${langueTrad}`;
  document.getElementById('chat-title').textContent = data.chatTitre;
  document.getElementById('botIntro').innerHTML = data.botIntro;
  document.getElementById('btnEnvoyer').textContent = data.envoyer;
  document.getElementById('searchBar').placeholder = data.searchPlaceholder;
};

const chargerDonnees = async () => {
  try {
    afficherLog("Chargement des données...");
    const fichierHistoire = langueInterface === 'fr'
      ? 'data/histoire.json'
      : `data/histoire-${langueInterface}.json`;

    const [motsRes, interfaceRes, histoireRes] = await Promise.all([
      chargerJSON('data/mots_final_489.json'),
      chargerJSON('data/interface-langue.json'),
      chargerJSON(fichierHistoire)
    ]);

    if (!Array.isArray(motsRes) || motsRes.length === 0) {
      throw new Error("⚠️ Le fichier mots est vide ou mal formé.");
    }

    motsComplet = motsRes;
    mots = [...motsComplet];
    interfaceData = interfaceRes;
    window.histoireDocs = histoireRes;

    if (!Object.keys(mots[0]).includes(langueTrad)) langueTrad = 'fr';
    if (!interfaceData[langueInterface]) langueInterface = 'fr';

    changerLangueInterface(langueInterface);
    initialiserMenusLangues();

    fuse = new Fuse(mots, {
      keys: ['mot', 'fr', 'en'],
      includeScore: true,
      threshold: 0.4
    });

    indexMot = parseInt(localStorage.getItem('motIndex')) || 0;
    afficherMot(indexMot);
    afficherLog("✅ Données chargées.");
  } catch (e) {
    afficherLog("Erreur : " + e.message, 'error');
    console.error(e);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  afficherLog("🔄 Initialisation...");
  chargerDonnees();

  document.getElementById('searchBar').addEventListener('input', () => {
    const q = nettoyerTexte(document.getElementById('searchBar').value.trim());
    mots = q ? fuse.search(q).map(r => r.item) : [...motsComplet];
    mots.length ? afficherMot(0) : afficherMessage('bot', "Aucun résultat.");
  });

  document.getElementById('btnEnvoyer').addEventListener('click', envoyerMessage);
  document.getElementById('btnPrev').addEventListener('click', () => afficherMot(indexMot - 1));
  document.getElementById('btnNext').addEventListener('click', () => afficherMot(indexMot + 1));
});
