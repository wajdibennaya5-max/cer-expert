#!/usr/bin/env bash
# ============================================================================
# Surveille le site et le remet en ligne tout seul.
#
#   bash scripts/veilleur.sh demarrer   # lance la surveillance en arrière-plan
#   bash scripts/veilleur.sh etat       # dit si elle tourne, et ce qu'elle a vu
#   bash scripts/veilleur.sh arreter    # l'arrête
#
# Pourquoi : le site vit sur un téléphone. Android gèle Termux au bout de
# quelques minutes d'écran éteint, le tunnel perd ses connexions, et
# Cloudflare répond 1033 à tout le monde — parfois pendant des heures, sans
# que personne s'en aperçoive. Le gardien s'en aperçoit, lui, et relance.
#
# Il n'agit qu'après DEUX échecs consécutifs : une requête isolée peut
# échouer parce que le réseau mobile a hoqueté, pas parce que le site est
# tombé. Relancer pour rien couperait le site une minute pour rien.
# ============================================================================
set -u

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/commun.sh
. "$PROJECT/scripts/commun.sh"

JOURNAL="$PROJECT/veilleur.log"
VEILLEUR_PID="$PROJECT/.veilleur.pid"
INTERVALLE="${INTERVALLE:-120}"
ECHECS_AVANT_ACTION=2

# L'adresse publique à surveiller, lue là où elle est déjà écrite.
# C'est bien l'adresse PUBLIQUE qui est interrogée, pas localhost : un site qui
# répond sur le téléphone mais dont le tunnel est tombé est hors ligne pour
# tout le monde sauf pour son propriétaire.
adresse_publique() {
  local CF_HOSTNAME="" NGROK_DOMAIN=""
  # Surcharge explicite, utile pour vérifier le gardien sans attendre une panne.
  if [ -n "${ADRESSE_SURVEILLEE:-}" ]; then
    echo "$ADRESSE_SURVEILLEE"
    return 0
  fi
  # shellcheck disable=SC1091
  [ -f "$PROJECT/tunnel.conf" ] && . "$PROJECT/tunnel.conf"
  if [ -n "$CF_HOSTNAME" ]; then
    echo "https://$CF_HOSTNAME"
  elif [ -n "$NGROK_DOMAIN" ]; then
    echo "https://$NGROK_DOMAIN"
  else
    # Tunnel temporaire : l'adresse change à chaque ouverture, on la relit.
    grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | tail -1
  fi
}

noter() {
  echo "$(date '+%Y-%m-%d %H:%M:%S')  $*" >> "$JOURNAL"
}

# ------------------------------------------------------------------ boucle
surveiller() {
  local url echecs=0 code
  url="$(adresse_publique)"
  if [ -z "$url" ]; then
    noter "✗ Aucune adresse publique connue. Lancez d'abord scripts/demarrer.sh."
    return 1
  fi
  noter "── Surveillance de $url toutes les ${INTERVALLE}s ──"

  while true; do
    code="$(curl -s -o /dev/null --max-time 25 -w '%{http_code}' "$url/fr" 2>/dev/null)"
    [ -z "$code" ] && code="000"

    if [ "$code" = "200" ]; then
      [ "$echecs" -gt 0 ] && noter "✓ De nouveau joignable (HTTP $code)."
      echecs=0
    else
      echecs=$((echecs + 1))
      noter "⚠ HTTP $code (échec $echecs/$ECHECS_AVANT_ACTION)."
      if [ "$echecs" -ge "$ECHECS_AVANT_ACTION" ]; then
        # 530 et 1033 : le tunnel a lâché. 502/503 : le tunnel tient mais le
        # site ne répond plus. demarrer.sh traite les deux, et conserve ce qui
        # fonctionne encore au lieu de tout couper.
        noter "→ Relance du site et du tunnel…"
        bash "$PROJECT/scripts/demarrer.sh" >> "$JOURNAL" 2>&1
        # Vérifier plutôt que supposer : un gardien qui écrit « relancé » alors
        # que le site est toujours à terre est pire qu'un gardien silencieux.
        code="$(curl -s -o /dev/null --max-time 25 -w '%{http_code}' "$url/fr" 2>/dev/null)"
        if [ "$code" = "200" ]; then
          noter "✓ Site de nouveau en ligne."
        else
          noter "✗ Toujours injoignable après relance (HTTP ${code:-000})."
        fi
        echecs=0
      fi
    fi
    sleep "$INTERVALLE"
  done
}

# ------------------------------------------------------------- commandes
tourne() {
  [ -f "$VEILLEUR_PID" ] && kill -0 "$(cat "$VEILLEUR_PID" 2>/dev/null)" 2>/dev/null
}

case "${1:-}" in
  demarrer)
    if tourne; then
      echo "→ Le gardien tourne déjà."
      exit 0
    fi
    nohup "$0" _boucle > /dev/null 2>&1 &
    echo $! > "$VEILLEUR_PID"
    sleep 1
    if tourne; then
      echo "✓ Gardien lancé. Il vérifie le site toutes les ${INTERVALLE}s"
      echo "  et le relance après deux échecs de suite."
      echo
      echo "  Ce qu'il a vu :  tail -20 veilleur.log"
      echo "  L'arrêter     :  bash scripts/veilleur.sh arreter"
    else
      echo "✗ Le gardien n'a pas démarré. Voir : tail -20 $JOURNAL"
      exit 1
    fi
    ;;
  arreter)
    if tourne; then
      kill "$(cat "$VEILLEUR_PID")" 2>/dev/null
      noter "── Surveillance arrêtée à la demande ──"
      echo "→ Gardien arrêté."
    else
      echo "→ Aucun gardien en cours."
    fi
    rm -f "$VEILLEUR_PID"
    ;;
  etat)
    if tourne; then
      echo "✓ Gardien actif (PID $(cat "$VEILLEUR_PID"))."
    else
      echo "✗ Aucun gardien en cours."
    fi
    echo
    echo "Dernières lignes du journal :"
    tail -12 "$JOURNAL" 2>/dev/null || echo "  (journal vide)"
    ;;
  _boucle)
    surveiller
    ;;
  *)
    echo "Usage :"
    echo "  bash scripts/veilleur.sh demarrer   # surveille et relance tout seul"
    echo "  bash scripts/veilleur.sh etat       # ce qu'il a vu"
    echo "  bash scripts/veilleur.sh arreter"
    exit 1
    ;;
esac
