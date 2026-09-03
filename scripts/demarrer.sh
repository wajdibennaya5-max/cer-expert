#!/usr/bin/env bash
# ============================================================================
# Démarre le site et son tunnel, puis affiche l'adresse publique.
#
#   bash scripts/demarrer.sh
#
# Trois tunnels possibles, choisis d'après `tunnel.conf` à la racine :
#
#   • Cloudflare nommé, sur VOTRE domaine — le meilleur : adresse définitive,
#     gratuite, sans page d'avertissement. Se configure avec scripts/domaine.sh
#     et pose  CF_TUNNEL_NAME=…  et  CF_HOSTNAME=…
#   • ngrok, adresse fixe mais en .ngrok-free.app, avec une page intermédiaire
#     avant le site. Se configure avec scripts/ngrok.sh et pose  NGROK_DOMAIN=…
#   • Cloudflare temporaire, sinon : rien à configurer, mais l'adresse change à
#     chaque ouverture de tunnel.
#
# Écrit pour un téléphone : rien à remplacer dans les commandes, chaque étape
# est attendue jusqu'à être réellement prête, et le résultat est vérifié depuis
# Internet avant d'annoncer quoi que ce soit.
# ============================================================================
set -u

PORT="${PORT:-3000}"
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
SITE_LOG="$PROJECT/site.log"
TUNNEL_LOG="$PROJECT/tunnel.log"
SITE_PID="$PROJECT/.site.pid"
TUNNEL_PID="$PROJECT/.tunnel.pid"

cd "$PROJECT" || exit 1
echo "→ Projet : $PROJECT"

URL=""

site_repond() {
  curl -s -o /dev/null --max-time 3 "http://localhost:$PORT/fr"
}

# Interroge l'adresse publique ; renvoie le code HTTP, ou 000 si aucune réponse.
tester() {
  local code
  code="$(curl -s -o /dev/null --max-time 20 -w '%{http_code}' "$1/fr" 2>/dev/null)"
  [ -z "$code" ] && code="000"
  echo "$code"
}

# ------------------------------------------------------------------ le site
if site_repond; then
  echo "→ Le site tourne déjà sur le port $PORT."
else
  if [ ! -d .next ]; then
    echo "✗ Le site n'est pas construit. Lancez d'abord : npm run build"
    exit 1
  fi
  echo "→ Démarrage du site…"
  # Le binaire Next est lancé directement plutôt que via `npm start` : npm
  # crée un processus intermédiaire, et l'arrêter laisserait le serveur en vie.
  nohup "$PROJECT/node_modules/.bin/next" start -p "$PORT" > "$SITE_LOG" 2>&1 &
  echo $! > "$SITE_PID"
  for _ in $(seq 1 30); do
    sleep 2
    site_repond && break
  done
  if ! site_repond; then
    echo "✗ Le site n'a pas démarré. Dernières lignes :"
    tail -15 "$SITE_LOG"
    exit 1
  fi
  echo "→ Site prêt."
fi

# ------------------------------------------------------- tunnel ngrok (fixe)
demarrer_ngrok() {
  if ! command -v ngrok > /dev/null 2>&1; then
    echo "✗ ngrok n'est pas installé. Voir MISE-EN-LIGNE-TERMUX.md."
    exit 1
  fi

  URL="https://$NGROK_DOMAIN"

  if pgrep -x ngrok > /dev/null 2>&1 && [ "$(tester "$URL")" = "200" ]; then
    echo "→ Tunnel ngrok déjà actif : adresse conservée."
    return 0
  fi

  pkill -x ngrok > /dev/null 2>&1 && sleep 2
  echo "→ Ouverture du tunnel ngrok sur $NGROK_DOMAIN…"

  # Le nom de l'option a changé selon les versions de ngrok : on demande à
  # l'outil lui-même laquelle il comprend plutôt que de parier.
  local option
  if ngrok http --help 2>&1 | grep -q -- "--url"; then
    option="--url=$URL"
  else
    option="--domain=$NGROK_DOMAIN"
  fi

  nohup ngrok http "$option" "$PORT" --log=stdout > "$TUNNEL_LOG" 2>&1 &
  echo $! > "$TUNNEL_PID"

  for _ in $(seq 1 20); do
    sleep 3
    [ "$(tester "$URL")" = "200" ] && return 0
    if grep -q "ERR_NGROK_105" "$TUNNEL_LOG" 2>/dev/null; then
      echo "✗ Jeton d'authentification ngrok invalide ou absent."
      echo "  Corrigez avec : ngrok config add-authtoken VOTRE_JETON"
      exit 1
    fi
    if grep -q "ERR_NGROK_108" "$TUNNEL_LOG" 2>/dev/null; then
      echo "✗ Une autre session ngrok est déjà ouverte sur ce compte."
      echo "  Fermez-la depuis dashboard.ngrok.com, puis relancez."
      exit 1
    fi
  done
  return 0
}

# ------------------------------- tunnel Cloudflare par jeton (votre domaine)
demarrer_cloudflared_jeton() {
  if ! command -v cloudflared > /dev/null 2>&1; then
    echo "✗ cloudflared n'est pas installé. Lancez : bash scripts/domaine.sh"
    exit 1
  fi
  if [ ! -s "$CF_TOKEN_FILE" ]; then
    echo "✗ Jeton introuvable. Relancez : bash scripts/tunnel-token.sh"
    exit 1
  fi

  URL="https://$CF_HOSTNAME"

  if pgrep -x cloudflared > /dev/null 2>&1 && [ "$(tester "$URL")" = "200" ]; then
    echo "→ Tunnel déjà actif sur $CF_HOSTNAME."
    return 0
  fi

  pkill -x cloudflared > /dev/null 2>&1 && sleep 2
  echo "→ Ouverture du tunnel vers $CF_HOSTNAME…"

  # Le jeton passe par l'environnement : en argument, il serait lisible par
  # n'importe quel programme de la machine via `ps`.
  TUNNEL_TOKEN="$(cat "$CF_TOKEN_FILE")" \
    nohup cloudflared tunnel --protocol http2 run > "$TUNNEL_LOG" 2>&1 &
  echo $! > "$TUNNEL_PID"

  for _ in $(seq 1 30); do
    sleep 3
    [ "$(tester "$URL")" = "200" ] && return 0
    if grep -qi "invalid tunnel secret\|Unauthorized" "$TUNNEL_LOG" 2>/dev/null; then
      echo "✗ Jeton refusé par Cloudflare."
      echo "  Effacez-le puis recommencez : rm $CF_TOKEN_FILE"
      exit 1
    fi
  done
  return 0
}

# ----------------------------------- tunnel Cloudflare nommé (votre domaine)
demarrer_cloudflared_nomme() {
  if ! command -v cloudflared > /dev/null 2>&1; then
    echo "✗ cloudflared n'est pas installé. Lancez : bash scripts/domaine.sh"
    exit 1
  fi

  URL="https://$CF_HOSTNAME"

  if pgrep -x cloudflared > /dev/null 2>&1 && [ "$(tester "$URL")" = "200" ]; then
    echo "→ Tunnel déjà actif sur $CF_HOSTNAME."
    return 0
  fi

  pkill -x cloudflared > /dev/null 2>&1 && sleep 2
  echo "→ Ouverture du tunnel « $CF_TUNNEL_NAME » vers $CF_HOSTNAME…"

  # --protocol http2 : comme pour le tunnel temporaire, QUIC (UDP) est filtré
  # par la plupart des réseaux mobiles tunisiens.
  nohup cloudflared tunnel --protocol http2 run \
    --url "http://localhost:$PORT" "$CF_TUNNEL_NAME" > "$TUNNEL_LOG" 2>&1 &
  echo $! > "$TUNNEL_PID"

  for _ in $(seq 1 30); do
    sleep 3
    [ "$(tester "$URL")" = "200" ] && return 0
    if grep -q "tunnel credentials file" "$TUNNEL_LOG" 2>/dev/null; then
      echo "✗ Identifiants du tunnel introuvables sur ce téléphone."
      echo "  Relancez la configuration : bash scripts/domaine.sh"
      exit 1
    fi
  done
  return 0
}

# ------------------------------------------- tunnel Cloudflare (temporaire)
demarrer_cloudflared() {
  if ! command -v cloudflared > /dev/null 2>&1; then
    echo "✗ Aucun tunnel installé (ni ngrok ni cloudflared)."
    echo "  Voir MISE-EN-LIGNE-TERMUX.md."
    exit 1
  fi

  # Un tunnel déjà actif et fonctionnel est conservé : le redémarrer changerait
  # l'adresse publique, qui a peut-être déjà été partagée.
  local actuelle
  actuelle="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | tail -1)"
  if pgrep -x cloudflared > /dev/null 2>&1 && [ -n "$actuelle" ] && [ "$(tester "$actuelle")" = "200" ]; then
    echo "→ Tunnel déjà actif : adresse conservée."
    URL="$actuelle"
    return 0
  fi

  pkill -x cloudflared > /dev/null 2>&1 && sleep 2

  # --protocol http2 : par défaut cloudflared utilise QUIC (UDP), que les
  # réseaux mobiles filtrent souvent. Le tunnel obtient alors bien une adresse
  # mais ne s'enregistre jamais, et Cloudflare répond 530.
  echo "→ Ouverture du tunnel Cloudflare (HTTP/2)…"
  nohup cloudflared tunnel --protocol http2 --url "http://localhost:$PORT" > "$TUNNEL_LOG" 2>&1 &
  echo $! > "$TUNNEL_PID"

  for _ in $(seq 1 40); do
    sleep 2
    URL="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | tail -1)"
    [ -n "$URL" ] && grep -q "Registered tunnel connection" "$TUNNEL_LOG" 2>/dev/null && break
  done

  if [ -z "$URL" ]; then
    echo "✗ Aucune adresse obtenue. Dernières lignes du journal :"
    tail -15 "$TUNNEL_LOG"
    exit 1
  fi
  if ! grep -q "Registered tunnel connection" "$TUNNEL_LOG" 2>/dev/null; then
    echo "✗ Adresse obtenue ($URL) mais le tunnel ne s'est pas enregistré."
    echo "  Réseau instable : réessayez, de préférence en Wi-Fi."
    tail -15 "$TUNNEL_LOG"
    exit 1
  fi
  return 0
}

# ---------------------------------------------------------------- le tunnel
NGROK_DOMAIN=""
CF_TUNNEL_NAME=""
CF_HOSTNAME=""
CF_TOKEN_FILE=""
# shellcheck disable=SC1091
[ -f "$PROJECT/tunnel.conf" ] && . "$PROJECT/tunnel.conf"

if [ -n "$CF_TOKEN_FILE" ] && [ -n "$CF_HOSTNAME" ]; then
  demarrer_cloudflared_jeton
elif [ -n "$CF_TUNNEL_NAME" ] && [ -n "$CF_HOSTNAME" ]; then
  demarrer_cloudflared_nomme
elif [ -n "$NGROK_DOMAIN" ]; then
  demarrer_ngrok
else
  demarrer_cloudflared
fi

# ------------------------------------------------------------ vérification
# Une adresse fraîchement ouverte met parfois un moment à devenir joignable :
# on réessaie plutôt que de conclure trop vite.
CODE="000"
for _ in $(seq 1 6); do
  CODE="$(tester "$URL")"
  [ "$CODE" = "200" ] && break
  sleep 8
done

echo
echo "  ────────────────────────────────────────────────────"
echo "   Adresse du site      : $URL"
echo "   Test depuis Internet : HTTP $CODE"
echo "  ────────────────────────────────────────────────────"
case "$CODE" in
  200) echo "   ✅ Le site est accessible depuis Internet." ;;
  502|503) echo "   ⚠️  Tunnel actif, mais le site ne répond pas." ;;
  530) echo "   ⚠️  Cloudflare ne joint pas le tunnel. Réseau instable." ;;
  404) echo "   ⚠️  Le domaine ne pointe pas encore vers ce tunnel." ;
       echo "       Relancez : bash scripts/domaine.sh" ;;
  000) echo "   ⚠️  Aucune réponse. L'adresse met parfois une minute de plus" ;
       echo "       à devenir joignable — retentez dans un instant :" ;
       echo "       curl -s -o /dev/null -w '%{http_code}\n' $URL/fr" ;;
  *) echo "   ⚠️  Réponse inattendue. Journal : tail -30 tunnel.log" ;;
esac
echo
echo "   Arrêt : bash scripts/arreter.sh"
