#!/usr/bin/env bash
# ============================================================================
# Règle l'envoi des courriels de notification.
#
#   bash scripts/courriel.sh
#
# Les questions sont posées une par une, le mot de passe est masqué, et le
# fichier de configuration est écrit à votre place. Rien à recopier à la main
# sur un clavier de téléphone — et surtout, rien à taper directement dans le
# terminal : une variable tapée au prompt disparaît à la fermeture, et le site
# ne la voit jamais.
# ============================================================================
set -u

PROJET="$(cd "$(dirname "$0")/.." && pwd)"
CONF="$PROJET/.env.local"
cd "$PROJET" || exit 1

echo "═══ Notifications par courriel ═══"
echo
echo "  Chaque demande reçue déclenchera deux courriels : le vôtre, avec tout"
echo "  ce qu'il faut pour rappeler, et celui du client, avec son étude."
echo

if [ ! -f "$CONF" ]; then
  echo "→ Aucun fichier .env.local : il va être créé."
  : > "$CONF"
  chmod 600 "$CONF"
fi

# Vide ce qui traîne dans le tampon du terminal AVANT chaque question.
#
# Sur un téléphone, on colle souvent plusieurs lignes d'un coup, ou on tape la
# commande suivante pendant qu'un `git pull` défile. Ces lignes attendent dans
# le tampon, et le premier `read` venu les avale : on se retrouve avec un
# identifiant SMTP qui vaut « cd ~/wajdi-tayssir && git pull », et un mot de
# passe qui vaut la commande d'après — sans que rien ne le signale.
# Uniquement sur un vrai terminal : quand les réponses arrivent par un tuyau
# — un test, une installation automatisée —, elles sont déjà toutes là, et les
# vider reviendrait à tout jeter.
vider_tampon() {
  [ -t 0 ] || return 0
  local poubelle
  while IFS= read -r -t 0.05 poubelle 2>/dev/null; do :; done
  return 0
}

# La dernière ligne, pas la première : en cas de doublon, c'est celle que
# Next.js retient au chargement.
lire_actuel() {
  grep -E "^$1=" "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- | sed 's/^"\(.*\)"$/\1/'
}

# Une réponse ressemble-t-elle à une commande plutôt qu'à un réglage ?
#
# Sur un téléphone, on tape la commande suivante pendant que le script
# démarre : la frappe arrive après la vidange du tampon et devient une
# « réponse ». Vider ne suffit donc pas — il faut reconnaître ce qui n'en est
# pas une, et redemander sur-le-champ plutôt que de le découvrir à la fin.
ressemble_a_commande() {
  case "$1" in
    *' '*|*'&&'*|*';'*|*'|'*|*'$('*|*'`'*|'./'*|'~/'*|'/'*) return 0 ;;
    cd|git|bash|sh|npm|node|ls|nano|sudo|clear|exit) return 0 ;;
  esac
  return 1
}

# Pose une question, vérifie la réponse, et redemande tant qu'elle ne convient
# pas.
#
# L'INVITE PART SUR LA SORTIE D'ERREUR, jamais sur la sortie standard : celle-ci
# est capturée par $(…), et une invite écrite dessus entrerait dans la valeur —
# on enregistrerait « SMTP_HOTE=  Serveur SMTP [smtp-relay…] : smtp-relay… ».
#
# $4 : forme attendue — 'texte' (par défaut), 'port', 'courriel', 'adresse',
#      ou 'libre' pour ce qui peut légitimement contenir des espaces.
demander() {
  local cle="$1" question="$2" defaut="$3" forme="${4:-texte}"
  local actuel reponse essais=0
  actuel="$(lire_actuel "$cle")"
  [ -n "$actuel" ] && defaut="$actuel"

  while :; do
    essais=$((essais + 1))
    if [ "$essais" -gt 5 ]; then
      printf "\n  ✗ Trop de saisies incorrectes. Rien n'a été modifié.\n" >&2
      printf "    Reprenez à tête reposée : bash scripts/courriel.sh\n" >&2
      exit 1
    fi

    if [ -n "$defaut" ]; then
      printf "  %s\n  [%s] : " "$question" "$defaut" >&2
    else
      printf "  %s : " "$question" >&2
    fi
    vider_tampon
    read -r reponse
    reponse="${reponse:-$defaut}"

    case "$forme" in
      port)
        case "$reponse" in
          ''|*[!0-9]*) printf "  ↳ Un numéro de port, seulement des chiffres (587 ou 465).\n\n" >&2; continue ;;
        esac
        ;;
      courriel)
        case "$reponse" in
          *@*.*) : ;;
          *) printf "  ↳ Cela ne ressemble pas à une adresse électronique.\n\n" >&2; continue ;;
        esac
        ;;
      adresse)
        case "$reponse" in
          https://*) : ;;
          *) printf "  ↳ L'adresse doit commencer par https://\n\n" >&2; continue ;;
        esac
        ;;
      libre) : ;;
      *)
        if ressemble_a_commande "$reponse"; then
          printf "  ↳ « %s » ressemble à une commande, pas à un réglage.\n" "$reponse" >&2
          printf "     Cela arrive quand on tape la commande suivante pendant que le\n" >&2
          printf "     script démarre. Attendez la question, puis répondez.\n\n" >&2
          continue
        fi
        ;;
    esac

    [ -n "$reponse" ] && break
    printf "  ↳ Une réponse est nécessaire.\n\n" >&2
  done

  printf '%s' "$reponse"
}

echo "  ── Le fournisseur d'envoi ──"
echo "  Brevo est gratuit jusqu'à 300 courriels par jour et accepte un"
echo "  domaine hébergé chez Cloudflare comme le vôtre."
echo
HOTE="$(demander SMTP_HOTE 'Serveur SMTP' 'smtp-relay.brevo.com' texte)"
PORT="$(demander SMTP_PORT 'Port (587 ou 465)' '587' port)"
UTILISATEUR="$(demander SMTP_UTILISATEUR 'Identifiant SMTP' '' texte)"

if [ -z "$UTILISATEUR" ]; then
  echo
  echo "✗ L'identifiant est indispensable. Rien n'a été modifié."
  exit 1
fi

# Dernier filet : si malgré tout une commande s'est glissée dans une réponse,
# on refuse plutôt que d'écrire une configuration qui ne marchera jamais et
# dont personne ne comprendra pourquoi.
case "$HOTE$UTILISATEUR" in
  *' '*|*'&&'*|*';'*|*'|'*|*'$('*|'cd '*|*'git '*|*'bash '*|*'npm '*)
    echo
    echo "✗ Une des réponses ressemble à une commande, pas à un réglage :"
    echo "    serveur      : $HOTE"
    echo "    identifiant  : $UTILISATEUR"
    echo
    echo "  Cela arrive quand des lignes tapées avant le lancement dorment"
    echo "  encore dans le terminal. Rien n'a été modifié."
    echo
    echo "  Appuyez sur Entrée quelques fois pour vider l'écran, puis relancez :"
    echo "     bash scripts/courriel.sh"
    exit 1 ;;
esac

echo
echo "  Le mot de passe ne s'affichera pas."
echo "  ⚠ Chez Brevo, ce N'EST PAS le mot de passe de votre compte : il se"
echo "    trouve dans « SMTP & API », onglet SMTP, ligne « Master password »."
printf "  Mot de passe SMTP : "
vider_tampon
read -r -s MDP
echo

if [ -z "$MDP" ]; then
  ANCIEN="$(lire_actuel SMTP_MOTDEPASSE)"
  if [ -n "$ANCIEN" ]; then
    MDP="$ANCIEN"
    echo "  → Mot de passe inchangé."
  else
    echo "✗ Le mot de passe est indispensable. Rien n'a été modifié."
    exit 1
  fi
fi

echo
echo "  ── Les adresses ──"
echo "  L'expéditeur doit être une adresse VÉRIFIÉE chez le fournisseur,"
echo "  sinon l'envoi sera refusé."
EXPEDITEUR="$(demander COURRIEL_EXPEDITEUR 'Expéditeur affiché' 'Solarys <contact@20122011.xyz>' libre)"
EQUIPE="$(demander COURRIEL_EQUIPE 'Qui reçoit les demandes' 'wajdibennaya5@gmail.com' courriel)"

echo
echo "  ── Le site solaire ──"
ORIGINES="$(demander ORIGINES_SOLAIRE 'Adresse du site solaire' 'https://wajdibennaya5-max.github.io' adresse)"

# ------------------------------------------------------------- écriture
# Écriture atomique : le fichier n'est jamais laissé à moitié réécrit, même si
# le téléphone s'éteint au mauvais moment. Les autres réglages sont conservés.
TEMPO="$(mktemp "${CONF}.XXXXXX")"
chmod 600 "$TEMPO"
{
  grep -Ev '^(SMTP_HOTE|SMTP_PORT|SMTP_UTILISATEUR|SMTP_MOTDEPASSE|COURRIEL_EXPEDITEUR|COURRIEL_EQUIPE|ORIGINES_SOLAIRE)=' "$CONF" 2>/dev/null
  echo "SMTP_HOTE=$HOTE"
  echo "SMTP_PORT=$PORT"
  echo "SMTP_UTILISATEUR=$UTILISATEUR"
  echo "SMTP_MOTDEPASSE=$MDP"
  echo "COURRIEL_EXPEDITEUR=\"$EXPEDITEUR\""
  echo "COURRIEL_EQUIPE=$EQUIPE"
  echo "ORIGINES_SOLAIRE=$ORIGINES"
} > "$TEMPO"
mv "$TEMPO" "$CONF"
chmod 600 "$CONF"
unset MDP

echo
echo "  ────────────────────────────────────────────────"
echo "   Serveur     : $HOTE:$PORT"
echo "   Compte      : $UTILISATEUR"
echo "   Mot de passe: enregistré dans .env.local"
echo "   Expéditeur  : $EXPEDITEUR"
echo "   Notifications : $EQUIPE"
echo "  ────────────────────────────────────────────────"
echo

# ------------------------------------------------------------- essai
printf "  Envoyer un courriel d'essai maintenant ? [O/n] "
vider_tampon
read -r ESSAI
case "${ESSAI:-o}" in
  [oOyY]*)
    echo
    node "$PROJET/scripts/essai-courriel.mjs" || {
      echo
      echo "  La configuration est enregistrée malgré l'échec : corrigez ce qui"
      echo "  est signalé ci-dessus et relancez  bash scripts/courriel.sh"
      exit 1
    }
    ;;
  *) echo "  → Essai ignoré." ;;
esac

echo
echo "  Le site ne lit ce fichier qu'au démarrage : relancez-le pour que les"
echo "  notifications prennent effet."
echo
echo "     bash scripts/demarrer.sh"
echo
