#!/usr/bin/env bash
# ============================================================================
# Installe et configure ngrok, puis met le site en ligne sur une adresse fixe.
#
#   bash scripts/ngrok.sh
#
# Rien à composer : le script pose ses deux questions, et le jeton n'est ni
# affiché à l'écran ni enregistré dans l'historique du terminal.
# ============================================================================
set -u

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT" || exit 1

echo "═══ Adresse fixe ngrok ═══"
echo

# ------------------------------------------------------------- installation
if command -v ngrok > /dev/null 2>&1; then
  echo "→ ngrok déjà installé ($(ngrok version 2>/dev/null | head -1))."
else
  echo "→ Installation de ngrok…"
  if [ "$(id -u)" -ne 0 ]; then
    echo "✗ Cette étape demande les droits root (vous devez être dans Ubuntu)."
    exit 1
  fi
  # ngrok ne publie plus de lien de téléchargement direct : on passe par son
  # dépôt apt, ce qui donne aussi les mises à jour par la suite.
  if ! curl -sSLo /usr/share/keyrings/ngrok.asc https://ngrok-agent.s3.amazonaws.com/ngrok.asc; then
    echo "✗ Téléchargement de la clé impossible. Vérifiez la connexion."
    exit 1
  fi
  echo "deb [signed-by=/usr/share/keyrings/ngrok.asc] https://ngrok-agent.s3.amazonaws.com bookworm main" \
    > /etc/apt/sources.list.d/ngrok.list
  apt-get update -qq || true
  if ! apt-get install -y ngrok; then
    echo "✗ L'installation a échoué. Journal ci-dessus."
    exit 1
  fi
  echo "→ ngrok installé."
fi

# -------------------------------------------------------------------- jeton
CONF="${HOME}/.config/ngrok/ngrok.yml"
if [ -f "$CONF" ] && grep -q "authtoken" "$CONF" 2>/dev/null; then
  echo "→ Jeton déjà enregistré."
else
  echo
  echo "  Votre jeton se trouve sur dashboard.ngrok.com → « Your Authtoken »."
  echo "  Collez-le ci-dessous : il ne s'affichera pas, et n'entrera pas dans"
  echo "  l'historique du terminal."
  echo
  printf "  Jeton : "
  read -r -s TOKEN
  echo
  if [ -z "$TOKEN" ]; then
    echo "✗ Aucun jeton saisi."
    exit 1
  fi
  if ! ngrok config add-authtoken "$TOKEN" > /dev/null 2>&1; then
    echo "✗ Jeton refusé par ngrok. Vérifiez que vous l'avez copié en entier."
    unset TOKEN
    exit 1
  fi
  unset TOKEN
  echo "→ Jeton enregistré."
fi

# ------------------------------------------------------------------ domaine
NGROK_DOMAIN=""
# shellcheck disable=SC1091
[ -f tunnel.conf ] && . ./tunnel.conf

if [ -n "$NGROK_DOMAIN" ]; then
  echo "→ Domaine actuel : $NGROK_DOMAIN"
  printf "  Entrée pour le garder, ou collez un autre domaine : "
else
  echo
  echo "  Votre domaine se trouve sur dashboard.ngrok.com → « Domains »."
  echo "  Créez-en un si ce n'est pas fait (il est gratuit et définitif)."
  echo
  printf "  Domaine (ex. wajdi-tayssir.ngrok-free.app) : "
fi
read -r SAISIE
[ -n "$SAISIE" ] && NGROK_DOMAIN="$SAISIE"

# Tolère un collage complet du type https://xxx.ngrok-free.app/
NGROK_DOMAIN="${NGROK_DOMAIN#https://}"
NGROK_DOMAIN="${NGROK_DOMAIN#http://}"
NGROK_DOMAIN="${NGROK_DOMAIN%%/*}"

if [ -z "$NGROK_DOMAIN" ]; then
  echo "✗ Aucun domaine indiqué."
  exit 1
fi

echo "NGROK_DOMAIN=$NGROK_DOMAIN" > tunnel.conf
echo "→ Adresse fixe : https://$NGROK_DOMAIN"
echo

# ------------------------------------------------------------- mise en ligne
exec bash "$PROJECT/scripts/demarrer.sh"
