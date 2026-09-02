#!/usr/bin/env bash
# Arrête le site et le tunnel lancés par scripts/demarrer.sh.
set -u
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"

arreter() { # $1 = fichier de PID, $2 = libellé
  if [ -f "$1" ] && kill "$(cat "$1")" 2>/dev/null; then
    echo "→ $2 arrêté."
  else
    echo "→ Aucun $2 lancé par ce script."
  fi
  rm -f "$1"
}

arreter "$PROJECT/.tunnel.pid" "tunnel"
arreter "$PROJECT/.site.pid" "site"
# Filet de sécurité : `-x` cible le programme par son nom exact.
pkill -x cloudflared > /dev/null 2>&1 && echo "→ Tunnel résiduel arrêté."
