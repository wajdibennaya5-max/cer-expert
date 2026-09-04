#!/usr/bin/env bash
# ============================================================================
# Dit pourquoi la connexion à l'administration est refusée, et le répare.
#
#   bash scripts/verifier-admin.sh
#
# Trois causes possibles, impossibles à distinguer depuis le navigateur :
#   1. le mot de passe enregistré n'est pas celui que l'on croit ;
#   2. il est bon, mais le serveur tourne encore avec l'ancien fichier de
#      configuration — .env.local n'est lu qu'au démarrage ;
#   3. un autre fichier d'environnement passe devant .env.local.
#
# Le test se fait sur localhost. Le compteur anti-abus distingue les visiteurs
# par adresse : essayer ici ne consomme donc pas les essais du navigateur.
# ============================================================================
set -u
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/commun.sh
. "$PROJECT/scripts/commun.sh"
CONF="$PROJECT/.env.local"
cd "$PROJECT" || exit 1

echo "═══ Vérification de l'accès administrateur ═══"
echo

# ------------------------------------------------------- 1. le fichier
if [ ! -f "$CONF" ]; then
  echo "✗ Aucun fichier .env.local : aucun mot de passe n'est enregistré."
  echo "  Créez-en un :  bash scripts/mot-de-passe.sh"
  exit 1
fi

# dotenv garde la DERNIÈRE affectation d'une même variable : on lit comme lui.
valeur() { grep -E "^$1=" "$CONF" 2>/dev/null | tail -1 | cut -d= -f2-; }
compte() { grep -cE "^$1=" "$CONF" 2>/dev/null; }

IDENTIFIANT="$(valeur ADMIN_USERNAME)"
EMPREINTE="$(valeur ADMIN_PASSWORD_HASH)"
CLAIR="$(valeur ADMIN_PASSWORD)"

echo "1. Fichier de configuration"
if [ -z "$IDENTIFIANT" ]; then
  echo "   ✗ Aucun identifiant (ADMIN_USERNAME) enregistré."
  echo "     Réparez :  bash scripts/mot-de-passe.sh"
  exit 1
fi
echo "   ✓ Identifiant enregistré : $IDENTIFIANT"

if [ -z "$EMPREINTE" ]; then
  if [ -n "$CLAIR" ]; then
    echo "   ⚠ Mot de passe stocké en clair (ADMIN_PASSWORD)."
    echo "     Remplacez-le par une empreinte :  bash scripts/mot-de-passe.sh"
  else
    echo "   ✗ Aucun mot de passe enregistré."
    echo "     Réparez :  bash scripts/mot-de-passe.sh"
    exit 1
  fi
elif echo "$EMPREINTE" | grep -qE '^scrypt:[0-9a-f]+:[0-9a-f]+$'; then
  echo "   ✓ Empreinte du mot de passe : format correct"
else
  echo "   ✗ Empreinte illisible : le fichier a été abîmé."
  echo "     Refaites-la :  bash scripts/mot-de-passe.sh"
  exit 1
fi

# Une variable écrite deux fois : seule la dernière compte, l'autre trompe.
for variable in ADMIN_USERNAME ADMIN_PASSWORD_HASH; do
  if [ "$(compte "$variable")" -gt 1 ]; then
    echo "   ⚠ $variable apparaît plusieurs fois : seule la dernière ligne compte."
    echo "     Remettez le fichier au propre :  bash scripts/mot-de-passe.sh"
  fi
done

# Next.js lit plusieurs fichiers, et .env.production.local passe AVANT
# .env.local quand le site tourne en production, c'est-à-dire toujours ici.
for autre in .env.production.local .env.local.production; do
  if [ -f "$PROJECT/$autre" ] && grep -qE '^ADMIN_' "$PROJECT/$autre" 2>/dev/null; then
    echo "   ⚠ $autre contient aussi des ADMIN_… et passe AVANT .env.local."
    echo "     C'est lui qui gagne. Videz-le ou supprimez-le."
  fi
done

# ---------------------------------------------------- 2. le mot de passe
echo
echo "2. Mot de passe"
echo "   Tapez le mot de passe avec lequel vous essayez de vous connecter."
echo "   Rien ne s'affichera pendant la frappe, c'est normal."
printf "   Mot de passe : "
read -r -s MDP
echo

if [ -z "$MDP" ]; then
  echo "   ✗ Rien n'a été saisi."
  exit 1
fi

# Le site répond-il en local ? Si oui, on lui soumet aussi ces identifiants :
# c'est le seul moyen de savoir ce que le serveur en cours a réellement chargé.
ADRESSE=""
site_repond && ADRESSE="http://localhost:$PORT"

RESULTAT="$(printf '%s' "$MDP" | EMPREINTE="$EMPREINTE" IDENTIFIANT="$IDENTIFIANT" ADRESSE="$ADRESSE" \
  node "$PROJECT/scripts/verifier-admin.mjs")" || {
  echo "   ✗ Vérification impossible (Node.js absent ?)."
  unset MDP
  exit 1
}
unset MDP

CORRESPONDANCE="$(echo "$RESULTAT" | grep '^correspondance=' | cut -d= -f2)"
SERVEUR="$(echo "$RESULTAT" | grep '^serveur=' | cut -d= -f2)"

if [ "$CORRESPONDANCE" = "oui" ]; then
  echo "   ✓ Ce mot de passe est bien celui enregistré dans le fichier."
else
  echo "   ✗ Ce mot de passe n'est PAS celui enregistré dans le fichier."
fi

# -------------------------------------------------------- 3. le serveur
echo
echo "3. Serveur en cours d'exécution"
if [ -z "$ADRESSE" ]; then
  echo "   ✗ Le site ne répond pas sur le port $PORT : il n'est pas démarré."
  echo
  echo "   ► Démarrez-le :  bash scripts/demarrer.sh"
  exit 1
fi
echo "   ✓ Le site répond sur le port $PORT"
if serveur_perime; then
  echo "   ⚠ Il a démarré AVANT la dernière modification de .env.local :"
  echo "     il travaille donc encore avec l'ancien mot de passe."
fi
case "$SERVEUR" in
  200) echo "   ✓ Connexion acceptée par le serveur." ;;
  401) echo "   ✗ Connexion refusée par le serveur." ;;
  429) echo "   ⚠ Trop d'essais : le compteur anti-abus est en cours." ;;
  *)   echo "   ⚠ Réponse inattendue du serveur (HTTP ${SERVEUR:-?})." ;;
esac

# ------------------------------------------------------- 4. la conclusion
echo
echo "  ────────────────────────────────────────────────"
if [ "$CORRESPONDANCE" = "non" ]; then
  echo "   Ce n'est pas le bon mot de passe."
  echo
  echo "   Sur un téléphone, le clavier ajoute souvent une majuscule au"
  echo "   premier caractère sans qu'on le voie. Le plus simple est d'en"
  echo "   choisir un nouveau :"
  echo
  echo "     bash scripts/mot-de-passe.sh"
  echo "     bash scripts/demarrer.sh"
elif [ "$SERVEUR" = "200" ]; then
  echo "   Tout est correct de ce côté."
  echo
  echo "   Identifiant   : $IDENTIFIANT"
  echo "   Adresse       : /admin"
  echo
  echo "   Si le navigateur refuse quand même, c'est la saisie qui diffère :"
  echo "   vérifiez la majuscule automatique du clavier, et rechargez la page"
  echo "   (les trois points → actualiser) avant de réessayer."
elif [ "$SERVEUR" = "429" ]; then
  echo "   Le mot de passe est bon : c'est le compteur anti-abus qui bloque."
  echo
  echo "   Attendez 15 minutes, ou redémarrez le site pour le remettre à zéro :"
  echo
  echo "     bash scripts/arreter.sh --site-seulement && bash scripts/demarrer.sh"
else
  echo "   Le mot de passe est bon, mais le serveur en cours ne le connaît pas :"
  echo "   il a été démarré avant, et ne relit pas le fichier tout seul."
  echo
  printf "   Le redémarrer maintenant ? [O/n] "
  read -r REPONSE
  case "${REPONSE:-o}" in
    [nN]*)
      echo
      echo "   À faire plus tard :"
      echo "     bash scripts/arreter.sh --site-seulement && bash scripts/demarrer.sh"
      ;;
    *)
      echo
      arreter_site || exit 1
      demarrer_site || exit 1
      echo
      echo "   ✓ Serveur redémarré avec la configuration actuelle."
      echo "     Reconnectez-vous sur /admin avec l'identifiant « $IDENTIFIANT »."
      ;;
  esac
fi
echo "  ────────────────────────────────────────────────"
