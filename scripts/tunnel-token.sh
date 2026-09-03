#!/usr/bin/env bash
# ============================================================================
# Solution de secours quand `cloudflared tunnel login` échoue.
#
#   bash scripts/tunnel-token.sh 20122011.xyz
#
# La liaison par navigateur n'attend que deux minutes : sur un réseau mobile
# lent, elle expire souvent avant qu'on ait fini de se connecter. Le jeton de
# tunnel contourne complètement cette étape — il n'expire pas.
#
# Le jeton est saisi en aveugle, enregistré hors du dépôt en lecture seule pour
# vous, et transmis à cloudflared par variable d'environnement plutôt qu'en
# argument : un argument serait lisible par n'importe quel programme via `ps`.
# ============================================================================
set -u

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT" || exit 1

CF_HOSTNAME="${1:-}"
CF_TOKEN_FILE="$HOME/.cloudflared/wt-token"

echo "═══ Tunnel par jeton ═══"
echo

# ------------------------------------------------------------------ domaine
if [ -z "$CF_HOSTNAME" ]; then
  # shellcheck disable=SC1091
  [ -f tunnel.conf ] && . ./tunnel.conf
fi
if [ -z "$CF_HOSTNAME" ]; then
  printf "  Votre domaine (ex. 20122011.xyz) : "
  read -r CF_HOSTNAME
fi
CF_HOSTNAME="${CF_HOSTNAME#https://}"
CF_HOSTNAME="${CF_HOSTNAME#http://}"
CF_HOSTNAME="${CF_HOSTNAME%%/*}"
[ -z "$CF_HOSTNAME" ] && { echo "✗ Aucun domaine indiqué."; exit 1; }

# ------------------------------------------------------------------- marche
if [ ! -s "$CF_TOKEN_FILE" ]; then
  cat <<INSTRUCTIONS

  ─── À faire d'abord dans le navigateur (une seule fois) ───

  1. one.dash.cloudflare.com  →  Networks  →  Tunnels
  2. « Create a tunnel »  →  type « Cloudflared »  →  nom : wajdi-tayssir
  3. Cloudflare affiche une commande d'installation contenant un long jeton
     après « --token ». Copiez UNIQUEMENT ce jeton (il commence par « ey »).
  4. Sans quitter la page, onglet « Public Hostname »  →  « Add a public
     hostname » :

        Subdomain : (laisser vide)
        Domain    : $CF_HOSTNAME
        Type      : HTTP
        URL       : localhost:3000

     Enregistrez, puis recommencez avec Subdomain : www

  Revenez ensuite ici.

INSTRUCTIONS
  printf "  Collez le jeton (il ne s'affichera pas) : "
  read -r -s TOKEN
  echo
  case "$TOKEN" in
    "") echo "✗ Aucun jeton saisi."; exit 1 ;;
    ey*) : ;;
    *) echo "✗ Ce n'est pas un jeton de tunnel : il doit commencer par « ey »."
       echo "  Vous avez peut-être copié la commande entière au lieu du jeton."
       unset TOKEN; exit 1 ;;
  esac
  mkdir -p "$(dirname "$CF_TOKEN_FILE")"
  ( umask 077; printf '%s' "$TOKEN" > "$CF_TOKEN_FILE" )
  unset TOKEN
  echo "→ Jeton enregistré (lisible par vous seul)."
else
  echo "→ Jeton déjà enregistré."
fi

# ------------------------------------------------------------ enregistrement
{
  echo "CF_HOSTNAME=$CF_HOSTNAME"
  echo "CF_TOKEN_FILE=$CF_TOKEN_FILE"
} > tunnel.conf

echo "→ Adresse : https://$CF_HOSTNAME"
echo
exec bash "$PROJECT/scripts/demarrer.sh"
