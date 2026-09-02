#!/usr/bin/env bash
# ============================================================================
# Installation complète, depuis un Ubuntu vierge jusqu'au site en ligne.
#
#   bash scripts/installer.sh
#
# Le script ne refait que ce qui manque : on peut le relancer sans risque.
# Il ne pose que les questions auxquelles lui seul ne peut pas répondre —
# votre mot de passe d'administration et votre adresse e-mail.
# ============================================================================
set -u

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT" || exit 1

echo "═══ WAJDI & TAYSSIR SERVICES PRO — installation ═══"
echo

# --------------------------------------------------------------- 1. Node.js
NODE_OK=0
if command -v node > /dev/null 2>&1; then
  MAJEUR="$(node -v | sed 's/^v//' | cut -d. -f1)"
  [ "$MAJEUR" -ge 20 ] 2>/dev/null && NODE_OK=1
fi

if [ "$NODE_OK" -eq 1 ]; then
  echo "→ Node.js $(node -v) : correct."
else
  echo "→ Installation de Node.js 22…"
  if [ "$(id -u)" -ne 0 ]; then
    echo "✗ Cette étape demande les droits root (vous devez être dans Ubuntu)."
    exit 1
  fi
  apt-get update -qq || true
  apt-get install -y curl ca-certificates gnupg > /dev/null || true
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
  if ! apt-get install -y nodejs; then
    echo "✗ Installation de Node.js impossible."
    exit 1
  fi
  echo "→ Node.js $(node -v) installé."
fi

# --------------------------------------------------------- 2. dépendances
if [ -d node_modules ] && [ -x node_modules/.bin/next ]; then
  echo "→ Dépendances déjà installées."
else
  echo "→ Installation des dépendances (environ 500 Mo, plusieurs minutes)…"
  # Réseau mobile : npm abandonne trop vite par défaut.
  npm config set fetch-retries=10 fetch-retry-mintimeout=20000 \
    fetch-retry-maxtimeout=120000 fetch-timeout=600000 > /dev/null 2>&1
  if ! npm ci; then
    echo
    echo "✗ L'installation a été interrompue — souvent une coupure réseau."
    echo "  Relancez ce script : npm reprendra où il s'est arrêté."
    exit 1
  fi
  echo "→ Dépendances installées."
fi

# ------------------------------------------------------ 3. configuration
if [ -f .env.local ] && grep -q "ADMIN_PASSWORD_HASH=scrypt" .env.local 2>/dev/null; then
  echo "→ Configuration déjà en place (.env.local)."
else
  echo
  echo "  ── Configuration ──"
  echo "  Deux réponses, puis le script s'occupe du reste."
  echo

  MDP=""
  while [ -z "$MDP" ]; do
    printf "  Mot de passe d'administration (10 caractères minimum) : "
    read -r -s MDP1; echo
    printf "  Confirmez : "
    read -r -s MDP2; echo
    if [ "$MDP1" != "$MDP2" ]; then
      echo "  ✗ Les deux saisies diffèrent. Recommencez."
    elif [ "${#MDP1}" -lt 10 ]; then
      echo "  ✗ Trop court : 10 caractères minimum."
    else
      MDP="$MDP1"
    fi
  done

  printf "  Votre adresse e-mail (celle que verront les clients) : "
  read -r COURRIEL
  [ -z "$COURRIEL" ] && COURRIEL="wajdibennaya@gmail.com"

  node -e "console.log('SESSION_SECRET='+require('node:crypto').randomBytes(32).toString('hex'))" > .env.local
  if ! node scripts/hash-password.mjs "$MDP" >> .env.local; then
    echo "✗ Le mot de passe a été refusé."
    rm -f .env.local
    exit 1
  fi
  unset MDP MDP1 MDP2
  echo "ADMIN_USERNAME=wajdi" >> .env.local
  echo "NEXT_PUBLIC_CONTACT_EMAIL=$COURRIEL" >> .env.local
  chmod 600 .env.local
  echo
  echo "→ Configuration écrite. Notez votre mot de passe : il n'est stocké"
  echo "  nulle part en clair et ne peut pas être retrouvé."
fi

# ------------------------------------------------------------ 4. construction
if [ -d .next ] && [ -f .next/BUILD_ID ]; then
  echo "→ Site déjà construit."
else
  echo "→ Construction du site (3 à 10 minutes sur un téléphone)…"
  if ! npm run build; then
    echo
    echo "→ Nouvelle tentative avec plus de mémoire…"
    if ! NODE_OPTIONS=--max-old-space-size=2048 npm run build; then
      echo "✗ La construction a échoué. Journal ci-dessus."
      exit 1
    fi
  fi
  echo "→ Site construit."
fi

# -------------------------------------------------------------- 5. en ligne
echo
exec bash "$PROJECT/scripts/demarrer.sh"
