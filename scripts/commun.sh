#!/usr/bin/env bash
# ============================================================================
# Fonctions partagées par demarrer.sh, arreter.sh et verifier-admin.sh.
# Ce fichier ne se lance pas : il se charge avec «  . scripts/commun.sh  ».
#
# Pourquoi il existe : un `kill` sur le PID enregistré ne suffit pas à arrêter
# le site. Après une coupure de Termux ou un redémarrage du téléphone, le
# fichier .site.pid peut être périmé alors qu'un serveur lancé lors d'une
# session précédente occupe toujours le port. demarrer.sh voyait alors « le
# site répond » et ne relançait rien : le serveur continuait de tourner avec
# l'ANCIEN .env.local — donc avec l'ancien identifiant et l'ancien mot de
# passe, ce qui rendait la console d'administration inaccessible sans qu'aucun
# message n'explique pourquoi.
# ============================================================================

PROJECT="${PROJECT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PORT="${PORT:-3000}"
SITE_LOG="$PROJECT/site.log"
TUNNEL_LOG="$PROJECT/tunnel.log"
SITE_PID="$PROJECT/.site.pid"
TUNNEL_PID="$PROJECT/.tunnel.pid"

# --------------------------------------------------------------- inspection

# Le site répond-il vraiment ? (une page, pas seulement un port ouvert)
site_repond() {
  curl -s -o /dev/null --max-time 3 "http://localhost:$PORT/fr"
}

# PID du processus qui écoute sur le port, s'il y en a un.
# Trois méthodes : aucune n'est présente sur toutes les installations de
# Termux (fuser vient de psmisc, ss de iproute2, lsof est rarement là).
pid_du_port() {
  local pid=""
  if command -v fuser > /dev/null 2>&1; then
    pid="$(fuser "$PORT/tcp" 2>/dev/null | tr -s ' ' '\n' | grep -E '^[0-9]+$' | head -1)"
  fi
  if [ -z "$pid" ] && command -v ss > /dev/null 2>&1; then
    pid="$(ss -ltnp 2>/dev/null | grep -F ":$PORT " | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2)"
  fi
  if [ -z "$pid" ] && command -v lsof > /dev/null 2>&1; then
    pid="$(lsof -t -i ":$PORT" -sTCP:LISTEN 2>/dev/null | head -1)"
  fi
  if [ -z "$pid" ] && [ -f "$SITE_PID" ]; then
    local enregistre
    enregistre="$(cat "$SITE_PID" 2>/dev/null)"
    kill -0 "$enregistre" 2>/dev/null && pid="$enregistre"
  fi
  echo "$pid"
}

port_occupe() {
  site_repond && return 0
  [ -n "$(pid_du_port)" ]
}

# Le serveur en cours tourne-t-il avec une configuration dépassée ?
# Le fichier .env.local n'est lu qu'une fois, au démarrage : un serveur plus
# ancien que ce fichier ignore tout changement de mot de passe.
# Renvoie « faux » quand la question ne peut pas être tranchée : on ne coupe
# pas un site qui marche sur un doute.
serveur_perime() {
  local conf="$PROJECT/.env.local" pid demarrage modif
  [ -f "$conf" ] || return 1
  pid="$(pid_du_port)"
  [ -n "$pid" ] || return 1
  # Sous Linux, la date du répertoire /proc/<pid> est celle du démarrage.
  demarrage="$(stat -c %Y "/proc/$pid" 2>/dev/null)" || return 1
  modif="$(stat -c %Y "$conf" 2>/dev/null)" || return 1
  [ -n "$demarrage" ] && [ -n "$modif" ] || return 1
  [ "$modif" -gt "$demarrage" ]
}

# ------------------------------------------------------------------- arrêt

# Arrête le site et n'abandonne qu'une fois le port réellement libre.
arreter_site() {
  local pid essai

  if [ -f "$SITE_PID" ]; then
    pid="$(cat "$SITE_PID" 2>/dev/null)"
    [ -n "$pid" ] && kill "$pid" 2>/dev/null
    rm -f "$SITE_PID"
  fi

  for essai in $(seq 1 12); do
    port_occupe || { echo "→ Site arrêté, port $PORT libre."; return 0; }
    pid="$(pid_du_port)"
    if [ -n "$pid" ]; then
      # Poliment d'abord (le serveur ferme ses fichiers proprement), fermement
      # ensuite s'il ne rend pas la main.
      if [ "$essai" -le 6 ]; then kill "$pid" 2>/dev/null; else kill -9 "$pid" 2>/dev/null; fi
    else
      # Personne n'écoute mais le site répond quand même : un serveur d'une
      # session précédente, invisible aux outils absents de cette machine.
      pkill -f "next-server" > /dev/null 2>&1
      pkill -f "next start" > /dev/null 2>&1
    fi
    sleep 1
  done

  if port_occupe; then
    echo "✗ Le port $PORT reste occupé par un programme impossible à arrêter d'ici."
    echo "  Fermez complètement Termux (notification → « Exit ») puis rouvrez-le."
    return 1
  fi
  echo "→ Site arrêté, port $PORT libre."
}

arreter_tunnel() {
  if [ -f "$TUNNEL_PID" ] && kill "$(cat "$TUNNEL_PID")" 2>/dev/null; then
    echo "→ Tunnel arrêté."
  fi
  rm -f "$TUNNEL_PID"
  # Filet de sécurité : « -x » cible le programme par son nom exact.
  pkill -x cloudflared > /dev/null 2>&1 && echo "→ Tunnel Cloudflare résiduel arrêté."
  pkill -x ngrok > /dev/null 2>&1 && echo "→ Tunnel ngrok résiduel arrêté."
  return 0
}

# ---------------------------------------------------------------- démarrage

# Lance le serveur et attend qu'il réponde. Renvoie faux s'il ne démarre pas.
demarrer_site() {
  if [ ! -d "$PROJECT/.next" ]; then
    echo "✗ Le site n'est pas construit. Lancez d'abord : npm run build"
    return 1
  fi
  echo "→ Démarrage du site…"
  # Le binaire Next est lancé directement plutôt que via `npm start` : npm crée
  # un processus intermédiaire, et l'arrêter laisserait le serveur en vie.
  nohup "$PROJECT/node_modules/.bin/next" start -p "$PORT" > "$SITE_LOG" 2>&1 &
  echo $! > "$SITE_PID"
  local _
  for _ in $(seq 1 30); do
    sleep 2
    site_repond && { echo "→ Site prêt."; return 0; }
  done
  echo "✗ Le site n'a pas démarré. Dernières lignes :"
  tail -15 "$SITE_LOG"
  return 1
}
