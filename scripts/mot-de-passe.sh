#!/usr/bin/env bash
# ============================================================================
# Change le mot de passe de la console d'administration.
#
#   bash scripts/mot-de-passe.sh
#
# La saisie est masquée, demandée deux fois, et n'entre ni dans l'historique du
# terminal ni dans la liste des processus. Le fichier de configuration est mis
# à jour sur place : rien à recopier à la main sur un clavier de téléphone.
# ============================================================================
set -u

PROJET="$(cd "$(dirname "$0")/.." && pwd)"
CONF="$PROJET/.env.local"
cd "$PROJET" || exit 1

echo "═══ Mot de passe de l'administration ═══"
echo

if [ ! -f "$CONF" ]; then
  echo "→ Aucun fichier .env.local : il va être créé."
  : > "$CONF"
  chmod 600 "$CONF"
fi

# ------------------------------------------------------------ identifiant
# La dernière ligne, pas la première : en cas de doublon, c'est celle que
# Next.js retient au chargement du fichier.
ACTUEL="$(grep -E '^ADMIN_USERNAME=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2-)"
if [ -n "$ACTUEL" ]; then
  echo "  Identifiant actuel : $ACTUEL"
  printf "  Entrée pour le garder, ou tapez-en un autre : "
else
  printf "  Identifiant (ex. wajdi) : "
fi
read -r SAISIE
IDENTIFIANT="${SAISIE:-$ACTUEL}"
[ -z "$IDENTIFIANT" ] && IDENTIFIANT="admin"

# ---------------------------------------------------------- mot de passe
echo
echo "  Le mot de passe ne s'affichera pas. 10 caractères minimum."
printf "  Nouveau mot de passe : "
read -r -s MDP1
echo
printf "  Répétez-le           : "
read -r -s MDP2
echo

if [ "$MDP1" != "$MDP2" ]; then
  echo "✗ Les deux saisies diffèrent. Rien n'a été modifié."
  unset MDP1 MDP2
  exit 1
fi
if [ "${#MDP1}" -lt 10 ]; then
  echo "✗ Trop court : 10 caractères au minimum. Rien n'a été modifié."
  unset MDP1 MDP2
  exit 1
fi

# ------------------------------------------------------------- avertissement
# Signalé, jamais refusé : c'est votre décision, pas celle du script. Mais un
# mot de passe de cette liste est essayé dans les toutes premières secondes
# par n'importe quel robot, et la console donne accès aux coordonnées de vos
# clients.
FAIBLE=0
case "$(printf '%s' "$MDP1" | tr '[:upper:]' '[:lower:]')" in
  azertyuiop|qwertyuiop|1234567890|0123456789|motdepasse*|password*|admin*|123456*|qwerty*|azerty*)
    FAIBLE=1 ;;
esac
if [ "$FAIBLE" = "1" ]; then
  echo
  echo "  ⚠ Ce mot de passe fait partie des tout premiers essayés par les robots."
  echo "    Il est enregistré quand même, mais changez-le dès que possible :"
  echo "    quatre mots sans rapport font un mot de passe long et facile à"
  echo "    retenir, par exemple  Marteau-Citron-Sfax-74"
fi

# Le mot de passe passe par l'entrée standard, jamais en argument : un argument
# serait lisible par n'importe quel programme via `ps`.
EMPREINTE="$(printf '%s' "$MDP1" | node "$PROJET/scripts/hash-password.mjs")" || {
  echo "✗ Génération de l'empreinte impossible."
  unset MDP1 MDP2
  exit 1
}
unset MDP1 MDP2

# ------------------------------------------------------------- écriture
# Écriture atomique : le fichier n'est jamais laissé à moitié réécrit, même si
# le téléphone s'éteint au mauvais moment.
TEMPO="$(mktemp "${CONF}.XXXXXX")"
chmod 600 "$TEMPO"
{
  # L'ancien mot de passe en clair disparaît aussi : le laisser traîner
  # annulerait tout le bénéfice de l'empreinte.
  grep -Ev '^(ADMIN_USERNAME|ADMIN_PASSWORD|ADMIN_PASSWORD_HASH)=' "$CONF" 2>/dev/null
  echo "ADMIN_USERNAME=$IDENTIFIANT"
  echo "$EMPREINTE"
} > "$TEMPO"
mv "$TEMPO" "$CONF"
chmod 600 "$CONF"

echo
echo "  ────────────────────────────────────────────────"
echo "   Identifiant   : $IDENTIFIANT"
echo "   Mot de passe  : enregistré (empreinte irréversible)"
echo "  ────────────────────────────────────────────────"
echo
echo "  Le site ne lit ce fichier qu'au démarrage : relancez-le pour que le"
echo "  changement prenne effet."
echo
echo "     bash scripts/demarrer.sh"
echo
echo "  En cas de refus à la connexion, ce script dit pourquoi :"
echo
echo "     bash scripts/verifier-admin.sh"
echo
