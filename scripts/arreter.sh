#!/usr/bin/env bash
# ============================================================================
# Arrête le site et le tunnel lancés par scripts/demarrer.sh.
#
#   bash scripts/arreter.sh                   # le site et le tunnel
#   bash scripts/arreter.sh --site-seulement  # le site seul, tunnel conservé
#
# L'arrêt est vérifié : tant que le port répond, le script insiste. Un serveur
# oublié d'une session précédente empêchait sinon tout redémarrage réel.
# ============================================================================
set -u
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/commun.sh
. "$PROJECT/scripts/commun.sh"

arreter_site || exit 1
[ "${1:-}" = "--site-seulement" ] || arreter_tunnel
