#!/usr/bin/env bash
# ============================================================================
# Met le site en ligne sur VOTRE domaine, avec une adresse définitive.
#
#   bash scripts/domaine.sh
#
# Condition préalable : posséder un nom de domaine (acheté chez n'importe quel
# registrar) et l'avoir ajouté à un compte Cloudflare gratuit — c'est-à-dire
# avoir changé ses serveurs de noms pour ceux que Cloudflare indique.
#
# Ce que ce script fait ensuite est gratuit et définitif :
#   1. installe cloudflared si besoin ;
#   2. relie ce téléphone à votre compte Cloudflare ;
#   3. crée un tunnel nommé, qui garde la même adresse à chaque redémarrage ;
#   4. fait pointer votre domaine (et son www) vers ce tunnel ;
#   5. démarre le site.
#
# Avantages par rapport aux deux autres modes : l'adresse ne change jamais,
# il n'y a pas de page d'avertissement avant le site, et le domaine vous
# appartient — ce qui permet enfin de créer une adresse e-mail dessus et de
# valider votre fiche Google.
# ============================================================================
set -u

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT" || exit 1

echo "═══ Adresse définitive sur votre domaine ═══"
echo

# ------------------------------------------------------------- installation
if command -v cloudflared > /dev/null 2>&1; then
  echo "→ cloudflared déjà installé ($(cloudflared --version 2>/dev/null | head -1))."
else
  echo "→ Installation de cloudflared…"
  if [ "$(id -u)" -ne 0 ]; then
    echo "✗ Cette étape demande les droits root (vous devez être dans Ubuntu)."
    exit 1
  fi
  # Le téléphone est un processeur ARM 64 bits ; on prend le paquet correspondant.
  ARCH="arm64"
  case "$(uname -m)" in
    x86_64) ARCH="amd64" ;;
    armv7l) ARCH="arm" ;;
  esac
  DEB="/tmp/cloudflared.deb"
  if ! curl -sSLo "$DEB" \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb"; then
    echo "✗ Téléchargement impossible. Vérifiez la connexion et réessayez."
    exit 1
  fi
  if ! dpkg -i "$DEB" > /dev/null 2>&1; then
    apt-get install -y -f > /dev/null 2>&1 || { echo "✗ Installation échouée."; exit 1; }
  fi
  rm -f "$DEB"
  echo "→ cloudflared installé."
fi

# ------------------------------------------------------------------ domaine
CF_HOSTNAME=""
CF_TUNNEL_NAME=""
# shellcheck disable=SC1091
[ -f tunnel.conf ] && . ./tunnel.conf

if [ -n "$CF_HOSTNAME" ]; then
  echo "→ Domaine actuel : $CF_HOSTNAME"
  printf "  Entrée pour le garder, ou tapez un autre domaine : "
else
  echo
  echo "  Tapez votre nom de domaine, sans https:// et sans www."
  echo "  Exemple :  wajdi-tayssir-services.com"
  echo
  printf "  Domaine : "
fi
read -r SAISIE
[ -n "$SAISIE" ] && CF_HOSTNAME="$SAISIE"

# Tolère un collage complet du type https://www.exemple.com/contact
CF_HOSTNAME="${CF_HOSTNAME#https://}"
CF_HOSTNAME="${CF_HOSTNAME#http://}"
CF_HOSTNAME="${CF_HOSTNAME%%/*}"
CF_HOSTNAME="${CF_HOSTNAME#www.}"
CF_HOSTNAME="$(printf '%s' "$CF_HOSTNAME" | tr '[:upper:]' '[:lower:]')"

if [ -z "$CF_HOSTNAME" ]; then
  echo "✗ Aucun domaine indiqué."
  exit 1
fi
case "$CF_HOSTNAME" in
  *.*) : ;;
  *) echo "✗ « $CF_HOSTNAME » n'est pas un domaine (il manque l'extension)."; exit 1 ;;
esac
if [ "${CF_HOSTNAME%.trycloudflare.com}" != "$CF_HOSTNAME" ] \
   || [ "${CF_HOSTNAME%.ngrok-free.app}" != "$CF_HOSTNAME" ]; then
  echo "✗ « $CF_HOSTNAME » ne vous appartient pas : c'est une adresse prêtée"
  echo "  par Cloudflare ou ngrok. Il faut ici un domaine que vous avez acheté."
  exit 1
fi

[ -z "$CF_TUNNEL_NAME" ] && CF_TUNNEL_NAME="wajdi-tayssir"

# ------------------------------------------------- liaison au compte Cloudflare
if [ -f "$HOME/.cloudflared/cert.pem" ]; then
  echo "→ Téléphone déjà relié à votre compte Cloudflare."
else
  echo
  echo "  ─── Une seule étape se passe hors du terminal ───"
  echo
  echo "  cloudflared va afficher un lien. Appuyez dessus (ou copiez-le dans"
  echo "  votre navigateur), connectez-vous à Cloudflare, puis choisissez"
  echo "  $CF_HOSTNAME dans la liste et validez."
  echo
  echo "  Revenez ensuite ici : le script continue tout seul."
  echo
  if ! cloudflared tunnel login; then
    echo "✗ La liaison a échoué. Relancez : bash scripts/domaine.sh"
    exit 1
  fi
fi

# ------------------------------------------------------------------- tunnel
if cloudflared tunnel list 2>/dev/null | awk '{print $2}' | grep -qx "$CF_TUNNEL_NAME"; then
  echo "→ Tunnel « $CF_TUNNEL_NAME » déjà créé."
else
  echo "→ Création du tunnel « $CF_TUNNEL_NAME »…"
  if ! cloudflared tunnel create "$CF_TUNNEL_NAME"; then
    echo "✗ Création impossible. Message ci-dessus."
    exit 1
  fi
fi

# --------------------------------------------------------------------- DNS
# --overwrite-dns : sans lui, relancer le script échoue dès qu'un enregistrement
# existe déjà — or on veut pouvoir relancer autant de fois que nécessaire.
router() { # $1 = nom d'hôte
  if cloudflared tunnel route dns --overwrite-dns "$CF_TUNNEL_NAME" "$1" > /dev/null 2>&1; then
    echo "→ $1 pointe vers le tunnel."
  else
    echo "⚠️  $1 n'a pas pu être routé automatiquement."
    echo "    Ajoutez à la main, sur dash.cloudflare.com → DNS, un CNAME :"
    echo "      nom    : ${1%%.*}"
    echo "      cible  : $(cloudflared tunnel list 2>/dev/null | awk -v n="$CF_TUNNEL_NAME" '$2==n {print $1}').cfargotunnel.com"
    echo "      proxy  : activé (nuage orange)"
  fi
}
router "$CF_HOSTNAME"
router "www.$CF_HOSTNAME"

# ------------------------------------------------------------ enregistrement
{
  echo "CF_TUNNEL_NAME=$CF_TUNNEL_NAME"
  echo "CF_HOSTNAME=$CF_HOSTNAME"
} > tunnel.conf

echo
echo "→ Adresse définitive : https://$CF_HOSTNAME"
echo
echo "  Pensez ensuite à créer votre e-mail professionnel, gratuitement :"
echo "  dash.cloudflare.com → $CF_HOSTNAME → Email → Email Routing."
echo "  Créez  contact@$CF_HOSTNAME  et faites-le suivre vers votre Gmail."
echo "  C'est cette adresse que Google utilisera pour valider votre fiche."
echo

# ------------------------------------------------------------- mise en ligne
exec bash "$PROJECT/scripts/demarrer.sh"
