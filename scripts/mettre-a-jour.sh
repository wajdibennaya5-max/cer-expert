#!/usr/bin/env bash
# ============================================================================
# Récupère la dernière version du site et la remet en ligne.
#
#   bash scripts/mettre-a-jour.sh                  (branche courante)
#   bash scripts/mettre-a-jour.sh nom-de-branche   (change de branche)
#
# Écrit pour un téléphone : aucune commande à recomposer, chaque étape dit ce
# qu'elle fait, et le script s'arrête AVANT de casser quoi que ce soit si
# quelque chose cloche.
#
# CE QU'IL NE TOUCHE JAMAIS : le dossier data/ (vos demandes, vos photos, vos
# réglages) et le fichier .env.local (vos mots de passe et vos clés). Ils ne
# sont pas dans le dépôt, et une mise à jour n'a aucune raison de les lire.
# ============================================================================
set -u

PROJET="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJET" || exit 1
BRANCHE="${1:-}"

echo "═══ Mise à jour du site ═══"
echo

# ------------------------------------------------- 1. rien à écraser d'abord
# Une modification locale non enregistrée serait perdue par la mise à jour.
# Mieux vaut refuser et le dire que rendre du travail introuvable.
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "✗ Des fichiers ont été modifiés sur ce téléphone et ne sont pas enregistrés :"
  git status --short | head -10
  echo
  echo "  Pour les garder      :  git stash"
  echo "  Pour les abandonner  :  git checkout -- ."
  echo "  Puis relancez cette commande."
  exit 1
fi

# --------------------------------------------------------- 2. récupération
echo "→ Récupération depuis GitHub…"
if ! git fetch --prune origin; then
  echo "✗ GitHub est injoignable. Vérifiez la connexion, puis relancez."
  exit 1
fi

if [ -n "$BRANCHE" ]; then
  if ! git rev-parse --verify "origin/$BRANCHE" > /dev/null 2>&1; then
    echo "✗ La branche « $BRANCHE » n’existe pas sur GitHub."
    echo "  Branches disponibles :"
    git branch -r --format='    %(refname:short)' | sed 's|origin/||' | head -10
    exit 1
  fi
  echo "→ Passage sur la branche « $BRANCHE »…"
  git checkout -B "$BRANCHE" "origin/$BRANCHE" || exit 1
else
  BRANCHE="$(git rev-parse --abbrev-ref HEAD)"
  echo "→ Branche : $BRANCHE"
  git merge --ff-only "origin/$BRANCHE" || {
    echo "✗ La mise à jour ne s’applique pas directement sur cette branche."
    echo "  Relancez en nommant la branche :  bash scripts/mettre-a-jour.sh $BRANCHE"
    exit 1
  }
fi
echo "→ Version : $(git log -1 --format='%h %s' | cut -c1-70)"

# ---------------------------------------------------------- 3. dépendances
# `npm ci` refait node_modules à l'identique du verrou. On ne l'exécute que si
# le verrou a changé : sur un téléphone, c'est plusieurs minutes.
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo "→ Installation des dépendances (quelques minutes)…"
  npm ci --no-audit --no-fund || {
    echo "✗ Installation impossible. Espace disque ? Connexion ?"
    exit 1
  }
else
  echo "→ Dépendances déjà à jour."
fi

# ------------------------------------------------------- 4. essais et build
echo "→ Vérification du code…"
npm run typecheck || { echo "✗ Le code ne compile pas : mise à jour interrompue."; exit 1; }
npm test 2>&1 | tail -6

echo "→ Construction du site (c’est l’étape la plus longue)…"
if ! npm run build; then
  echo
  echo "✗ La construction a échoué. LE SITE EN LIGNE N’A PAS ÉTÉ TOUCHÉ :"
  echo "  l’ancienne version tourne toujours. Rien n’est cassé."
  exit 1
fi

# ------------------------------------------------------------ 5. remise en ligne
echo "→ Remise en ligne…"
bash "$PROJET/scripts/arreter.sh" --site-seulement > /dev/null 2>&1 || true
bash "$PROJET/scripts/demarrer.sh" || exit 1

echo
echo "═══ À jour ═══"
echo "Version : $(git log -1 --format='%h %s' | cut -c1-70)"
