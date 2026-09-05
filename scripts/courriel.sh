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

# La dernière ligne, pas la première : en cas de doublon, c'est celle que
# Next.js retient au chargement.
lire_actuel() {
  grep -E "^$1=" "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- | sed 's/^"\(.*\)"$/\1/'
}

# Pose une question en proposant la valeur déjà enregistrée, ou un exemple.
#
# L'INVITE PART SUR LA SORTIE D'ERREUR, jamais sur la sortie standard : celle-ci
# est capturée par $(…), et une invite écrite dessus entrerait dans la valeur —
# on enregistrerait « SMTP_HOTE=  Serveur SMTP [smtp-relay…] : smtp-relay… ».
demander() {
  local cle="$1" question="$2" defaut="$3" actuel reponse
  actuel="$(lire_actuel "$cle")"
  [ -n "$actuel" ] && defaut="$actuel"
  if [ -n "$defaut" ]; then
    printf "  %s\n  [%s] : " "$question" "$defaut" >&2
  else
    printf "  %s : " "$question" >&2
  fi
  read -r reponse
  printf '%s' "${reponse:-$defaut}"
}

echo "  ── Le fournisseur d'envoi ──"
echo "  Brevo est gratuit jusqu'à 300 courriels par jour et accepte un"
echo "  domaine hébergé chez Cloudflare comme le vôtre."
echo
HOTE="$(demander SMTP_HOTE 'Serveur SMTP' 'smtp-relay.brevo.com')"
PORT="$(demander SMTP_PORT 'Port (587 ou 465)' '587')"
UTILISATEUR="$(demander SMTP_UTILISATEUR "Identifiant SMTP" '')"

if [ -z "$UTILISATEUR" ]; then
  echo
  echo "✗ L'identifiant est indispensable. Rien n'a été modifié."
  exit 1
fi

echo
echo "  Le mot de passe ne s'affichera pas."
echo "  ⚠ Chez Brevo, ce N'EST PAS le mot de passe de votre compte : il se"
echo "    trouve dans « SMTP & API », onglet SMTP, ligne « Master password »."
printf "  Mot de passe SMTP : "
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
EXPEDITEUR="$(demander COURRIEL_EXPEDITEUR "Expéditeur affiché" 'Solarys <contact@20122011.xyz>')"
EQUIPE="$(demander COURRIEL_EQUIPE "Qui reçoit les demandes" 'wajdibennaya5@gmail.com')"

echo
echo "  ── Le site solaire ──"
ORIGINES="$(demander ORIGINES_SOLAIRE "Adresse du site solaire" 'https://wajdibennaya5-max.github.io')"

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
