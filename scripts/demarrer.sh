#!/usr/bin/env bash
# ============================================================================
# Démarre le site et le tunnel Cloudflare, puis affiche l'adresse publique.
#
#   bash scripts/demarrer.sh
#
# Écrit pour un téléphone : rien à remplacer, rien à recopier, une seule
# commande. Chaque étape est attendue jusqu'à être réellement prête, et le
# résultat est vérifié depuis Internet avant d'annoncer quoi que ce soit.
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

site_repond() {
  curl -s -o /dev/null --max-time 3 "http://localhost:$PORT/fr"
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

# ---------------------------------------------------------------- le tunnel
if ! command -v cloudflared > /dev/null 2>&1; then
  echo "✗ cloudflared n'est pas installé. Voir MISE-EN-LIGNE-TERMUX.md."
  exit 1
fi

# Un tunnel déjà actif et fonctionnel est conservé tel quel : le redémarrer
# changerait l'adresse publique, qui a peut-être déjà été partagée. Pour en
# obtenir volontairement une nouvelle : bash scripts/arreter.sh d'abord.
URL=""
URL_ACTUELLE="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | tail -1)"
if pgrep -x cloudflared > /dev/null 2>&1 && [ -n "$URL_ACTUELLE" ]; then
  if [ "$(curl -s -o /dev/null --max-time 15 -w '%{http_code}' "$URL_ACTUELLE/fr" 2>/dev/null)" = "200" ]; then
    echo "→ Tunnel déjà actif : adresse conservée."
    URL="$URL_ACTUELLE"
  fi
fi

if [ -z "$URL" ]; then
  # `pkill -x` cible le programme par son nom exact : aucun risque d'emporter
  # au passage un shell dont la ligne de commande contiendrait le même texte.
  pkill -x cloudflared > /dev/null 2>&1 && sleep 2

  # --protocol http2 : par défaut cloudflared utilise QUIC (UDP), que les
  # réseaux mobiles filtrent souvent. Le tunnel obtient alors bien une adresse
  # mais ne s'enregistre jamais, et Cloudflare répond 530.
  echo "→ Ouverture du tunnel (HTTP/2)…"
  nohup cloudflared tunnel --protocol http2 --url "http://localhost:$PORT" > "$TUNNEL_LOG" 2>&1 &
  echo $! > "$TUNNEL_PID"

  for _ in $(seq 1 40); do
    sleep 2
    URL="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | tail -1)"
    if [ -n "$URL" ] && grep -q "Registered tunnel connection" "$TUNNEL_LOG" 2>/dev/null; then
      break
    fi
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
fi

# ------------------------------------------------------------ vérification
# Cloudflare prévient qu'une adresse fraîchement créée met un moment à devenir
# joignable : on réessaie plutôt que de conclure trop vite.
CODE="000"
for _ in $(seq 1 6); do
  CODE="$(curl -s -o /dev/null --max-time 20 -w '%{http_code}' "$URL/fr" 2>/dev/null)"
  [ -z "$CODE" ] && CODE="000"
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
  000) echo "   ⚠️  Aucune réponse. L'adresse peut mettre une minute de plus" ;
       echo "       à devenir joignable — retentez le test dans un instant :" ;
       echo "       curl -s -o /dev/null -w '%{http_code}\n' $URL/fr" ;;
  *) echo "   ⚠️  Réponse inattendue. Journal : tail -30 tunnel.log" ;;
esac
echo
echo "   Arrêt : bash scripts/arreter.sh"
