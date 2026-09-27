#!/usr/bin/env bash
# ============================================================================
# Installe le QR de paiement Flouci sur le serveur.
#
#   bash scripts/qr-paiement.sh ~/Téléchargements/mon-qr.jpg
#
# Le fichier est copié dans data/paiement/, qui est EXCLU DU DÉPÔT. Un QR de
# portefeuille identifie un compte personnel : déposé dans le dépôt, il entre
# dans l'historique Git et n'en sort plus jamais, y compris si le dépôt devient
# public un jour.
# ============================================================================
set -u

PROJET="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="${1:-}"
DESTINATION="${PROJET}/data/paiement"

if [ -z "$SOURCE" ]; then
  echo "Usage : bash scripts/qr-paiement.sh <chemin/vers/le-qr.jpg>"
  exit 1
fi
if [ ! -f "$SOURCE" ]; then
  echo "Fichier introuvable : $SOURCE"
  exit 1
fi

# On vérifie que c'est bien une image, par sa signature binaire et non par son
# nom : un fichier renommé en .jpg n'est pas une image.
SIGNATURE="$(head -c 4 "$SOURCE" | od -An -tx1 | tr -d ' \n')"
case "$SIGNATURE" in
  89504e47|ffd8ff*|52494646) ;;
  *) echo "Ce fichier n’est pas une image PNG, JPEG ou WebP."; exit 1 ;;
esac

TAILLE="$(wc -c < "$SOURCE")"
if [ "$TAILLE" -gt 2097152 ]; then
  echo "Fichier trop lourd (${TAILLE} octets). Un QR tient largement sous 2 Mo."
  exit 1
fi

case "$SIGNATURE" in
  89504e47) NOM="qr-flouci.png" ;;
  52494646) NOM="qr-flouci.webp" ;;
  *)        NOM="qr-flouci.jpg" ;;
esac

mkdir -p "$DESTINATION"
cp "$SOURCE" "${DESTINATION}/${NOM}"
chmod 600 "${DESTINATION}/${NOM}"

echo "QR installé : data/paiement/${NOM}"
echo
echo "Ajoutez cette ligne à .env.local, puis redémarrez le site :"
echo "  PAIEMENT_FLOUCI_QR=${NOM}"
echo
echo "Vérification : ouvrez https://votre-domaine/api/paiement/qr"
