let motsComplet = [];
let mots = [];
let interfaceData = {};
let indexMot = 0;
let langueTrad = 'fr';
let langueInterface = 'fr';
let fuse;

// Chargement initial des données
async function chargerDonnees() {
  try {
    const motsData = await fetch('./data/mots.json').then(r => r.json());
    motsComplet = motsData;
    mots = [...motsData];

    interfaceData = await fetch('./data/interface-langue.json').then(r => r.json());

    changerLangueInterface(langueInterface);

    fuse = new Fuse(mots, {
      keys: ['mot', ...Object.keys(mots[0]).filter(k => k.length === 2 || k.length === 3)],
      includeScore: true,
      threshold: 0.4
    });

    afficherMot();
  } catch (err) {
    alert("Erreur lors du chargement des données : " + err.message);
  }
}

// Afficher un mot
function afficherMot(motIndex = indexMot) {
  if (!mots.length) return;

  indexMot = Math.max(0, Math.min(mots.length - 1, motIndex));
  const mot = mots[indexMot];

  document.getElementById('motTexte').textContent = mot.mot || '';
  document.getElementById('definition').innerHTML =
    (mot[langueTrad] || '—') + (mot.cat ? ` <span style="color:#888;">(${mot.cat})</span>` : '');

  document.getElementById('compteur').textContent = `${indexMot + 1} / ${mots.length}`;
}

// Navigation
function motPrecedent() {
  if (indexMot > 0) afficherMot(indexMot - 1);
}

function motSuivant() {
  if (indexMot < mots.length - 1) afficherMot(indexMot + 1);
}

// Recherche
function rechercherMot() {
  const query = document.getElementById('searchBar').value.trim();
  if (!query) {
    mots = [...motsComplet];
    afficherMot(0);
    return;
  }

  const resultats = fuse.search(query);
  if (resultats.length) {
    mots = resultats.map(r => r.item);
    afficherMot(0);
  } else {
    mots = [];
    document.getElementById('motTexte').textContent = "Aucun résultat";
    document.getElementById('definition').textContent = "";
    document.getElementById('compteur').textContent = `0 / 0`;
  }
}

// Changer langue de traduction
function changerLangue(lang) {
  langueTrad = lang;
  afficherMot();
}

// Changer langue interface
function changerLangueInterface(lang) {
  langueInterface = lang;
  const t = interfaceData[lang] || interfaceData['fr'];
  if (!t) return;

  document.title = t.titrePrincipal || "";
  const titrePrincipal = document.getElementById('titrePrincipal');
  if (titrePrincipal) titrePrincipal.textContent = t.titrePrincipal || "";

  const presentation = document.getElementById('textePresentation');
  if (presentation) presentation.innerHTML = t.presentation || `
    Très bientôt, découvrez ici une aventure collaborative dédiée à la langue Tadaksahak ! 
    Vous trouverez sur cette page un dictionnaire interactif multilingue, pensé pour tous les amoureux et curieux de cette culture unique.<br><br>
    Rejoignez-nous prochainement pour explorer, apprendre et contribuer ensemble à la préservation et à la transmission du Tadaksahak, aussi bien en ligne que sur des supports physiques.<br><br>
    Merci pour votre intérêt et rendez-vous très bientôt pour de nouvelles fonctionnalités et ressources !
  `;

  const btnPlay = document.getElementById('btnPlay');
  if (btnPlay) btnPlay.textContent = `▶️ ${t.ecouter || "Écouter"}`;
  const btnReplay = document.getElementById('btnReplay');
  if (btnReplay) btnReplay.textContent = `⟳ ${t.rejouer || "Réécouter"}`;
  const btnAuto = document.getElementById('btnAuto');
  if (btnAuto) btnAuto.textContent = `▶️ ${t.lectureAuto || "Lecture auto"}`;
  const btnEnvoyer = document.getElementById('btnEnvoyer');
  if (btnEnvoyer) btnEnvoyer.textContent = t.envoyer || "Envoyer";

  const chatTitle = document.getElementById('chat-title');
  if (chatTitle) chatTitle.textContent = t.chatTitre || "Chat Tadaksahak";

  const searchBar = document.getElementById('searchBar');
  if (searchBar) searchBar.placeholder = t.searchPlaceholder || "";

  const chatInput = document.getElementById('chatInput');
  if (chatInput) chatInput.placeholder = t.placeholderChat || "";

  const botIntro = document.getElementById('botIntro');
  if (botIntro) botIntro.innerHTML = t.botIntro || 
    "🤖 Salut, je suis Hamadine le bot Tadaksahak.<br>Demandez-moi un mot et je vous le trouve rapidement&nbsp;!";

  const histoireTitle = document.getElementById('histoire-title');
  if (histoireTitle) histoireTitle.textContent = t.histoireTitle || "Section Histoire";

  const histoireMessage = document.getElementById('histoire-message');
  if (histoireMessage) histoireMessage.innerHTML = t.histoireBientot || 
    "Très bientôt, découvrez ici des textes historiques captivants sur la culture Tadaksahak.";

  const archivesTitle = document.getElementById('archives-title');
  if (archivesTitle) archivesTitle.textContent = t.archivesTitle || "Section Archives";

  const archivesMessage = document.getElementById('archives-message');
  if (archivesMessage) archivesMessage.innerHTML = t.archivesBientot || 
    "Nous mettrons prochainement à votre disposition des documents anciens précieux, témoins de l’histoire de la communauté.";

  const footer = document.getElementById('footerText');
  if (footer) footer.innerHTML = t.footerText || "© 2025 • Tadaksahak Multilingue avec Hamadine.";

  const footerContrib = document.getElementById('footerContrib');
  if (footerContrib) footerContrib.innerHTML = t.footerContrib || `
    Peu importe la forme ou la taille, chaque contribution — documents, témoignages, recherches ou idées — est précieuse pour enrichir notre projet.<br>
    Nous recherchons aussi des sponsors et partenaires engagés pour soutenir la valorisation de la langue et culture Tadaksahak.<br>
    Ensemble, faisons grandir ce patrimoine unique et transmettons-le aux générations futures ; contactez-nous pour participer ou soutenir cette initiative.
  `;

  // Mémorisation pour le bot
  window.reponseBot = t.reponseBot || "Mot introuvable.";
  window.nomUtilisateur = t.utilisateur || "Vous";
}

// Chat
function envoyerMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  afficherMessage('utilisateur', message);
  input.value = '';

  setTimeout(() => {
    afficherMessage('bot', window.reponseBot);
  }, 500);
}

function afficherMessage(auteur, texte) {
  const chatWindow = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.className = `message ${auteur}`;
  const nom = auteur === 'bot' ? 'Hamadine' : (window.nomUtilisateur || "Vous");
  div.innerHTML = `<strong>${nom} :</strong> ${texte}`;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Audio - stubs
function jouerTadaksahak() {
  console.log("Lecture du mot Tadaksahak (à implémenter)");
}

function rejouerMot() {
  console.log("Relecture du mot (à implémenter)");
}

function lectureAuto() {
  console.log("Lecture auto (à implémenter)");
}

// Init
window.addEventListener('DOMContentLoaded', chargerDonnees);
