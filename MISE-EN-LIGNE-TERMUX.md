# Mettre le site en ligne depuis Termux (téléphone Android)

Ce guide part d'un téléphone Android avec **Termux**, sans ordinateur.

> **Ce guide n'a pas pu être testé sur un téléphone** pendant le développement :
> l'environnement de travail était un Linux x86_64, pas Android. Les étapes
> suivent la méthode habituelle pour faire tourner Node.js sous Termux ; les
> deux points où un problème peut survenir sont signalés par ⚠️.

---

## À lire avant de commencer

**Un téléphone n'est pas un serveur d'entreprise.** C'est excellent pour
montrer le site à quelqu'un aujourd'hui, le tester en vrai, ou le faire voir à
un client. Ce n'est pas fiable pour un site que des clients vont chercher à
ouvrir à 22 h un soir de fuite d'eau :

- Android arrête les applications en arrière-plan pour économiser la batterie ;
- si le téléphone s'éteint, redémarre, sort du réseau ou chauffe, le site tombe ;
- un client qui tombe sur un site en panne appelle le concurrent d'à côté.

**Le bon usage :** Termux pour être en ligne tout de suite et gratuitement, le
temps de valider le site. Puis un petit serveur (VPS) quand il devient l'adresse
officielle de l'entreprise. Le site est exactement le même, la bascule prend
vingt minutes.

Il faut aussi savoir que le téléphone devra rester **allumé, branché et
connecté** tant que le site doit être accessible.

---

## Obstacle 1 : Next.js ne tourne pas directement dans Termux

Termux n'utilise pas la bibliothèque système d'un Linux classique. Or Next.js
s'appuie sur un composant compilé (`@next/swc`) qui n'existe pas pour Termux :
l'installation s'arrête souvent sur une erreur du type
`Failed to load SWC binary`.

La solution consiste à installer un vrai Ubuntu **à l'intérieur** de Termux,
avec `proot-distro`. C'est prévu pour ça, ça ne demande pas le root, et Node.js
y fonctionne normalement.

---

## Étape 1 — Préparer Termux

Installez Termux depuis **F-Droid** (la version du Play Store est abandonnée et
ne fonctionnera pas).

```bash
pkg update && pkg upgrade -y
pkg install -y proot-distro
```

Prévoyez **3 Go d'espace libre** environ (Ubuntu + dépendances + construction).

---

## Étape 2 — Installer Ubuntu dans Termux

```bash
proot-distro install ubuntu
proot-distro login ubuntu
```

À partir d'ici, vous êtes dans Ubuntu : l'invite change (`root@localhost`).
**Toutes les commandes suivantes se tapent dans cet Ubuntu.**

Pour y revenir plus tard : `proot-distro login ubuntu`.

---

## Étape 3 — Node.js et Git

```bash
apt update && apt install -y curl git ca-certificates
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

node -v      # doit afficher v22.x (le projet exige v20.9 minimum)
```

---

## Étape 4 — Récupérer le site

```bash
cd /root
git clone -b claude/wajdi-tayssir-website-c6a9w3 \
  https://github.com/wajdibennaya5-max/cer-expert.git wajdi-tayssir
cd wajdi-tayssir
npm ci
```

⚠️ `npm ci` télécharge environ 500 Mo et prend plusieurs minutes en 4G.
Faites-le en Wi-Fi.

---

## Étape 5 — Configurer

```bash
cp .env.example .env.local
```

Générez les deux valeurs de sécurité :

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
npm run admin:password -- "votre-mot-de-passe-solide"
```

Puis ouvrez le fichier (`nano .env.local`) et renseignez au minimum :

```
NEXT_PUBLIC_SITE_URL=https://votre-adresse-cloudflare.trycloudflare.com
SESSION_SECRET=<le résultat de la première commande>
ADMIN_USERNAME=wajdi
ADMIN_PASSWORD_HASH=<la ligne affichée par la seconde commande>
NEXT_PUBLIC_CONTACT_EMAIL=<votre vraie adresse e-mail>
```

Dans `nano` : `Ctrl+O` puis `Entrée` pour enregistrer, `Ctrl+X` pour quitter.

> `NEXT_PUBLIC_SITE_URL` est figé au moment de la construction. Vous ne
> connaîtrez l'adresse Cloudflare qu'à l'étape 7 : mettez une valeur
> provisoire, puis relancez `npm run build` une fois l'adresse connue.

---

## Étape 6 — Construire et lancer

```bash
npm run build
npm start
```

⚠️ La construction est l'étape la plus lourde : comptez 3 à 10 minutes selon le
téléphone. Si elle s'arrête sur un manque de mémoire
(`JavaScript heap out of memory`) :

```bash
NODE_OPTIONS=--max-old-space-size=2048 npm run build
```

Le site répond alors sur `http://localhost:3000`. Ouvrez cette adresse dans le
navigateur du téléphone : vous devez voir le site.

À ce stade il n'est visible **que depuis le téléphone**.

---

## Obstacle 2 : rendre le site visible de l'extérieur

Un téléphone n'a pas d'adresse publique sur Internet : en 4G, l'opérateur
partage une même adresse entre des milliers d'abonnés, et il n'y a pas de
« redirection de port » possible. Personne ne peut donc joindre votre téléphone
directement.

La solution est un **tunnel** : un service qui reçoit les visiteurs sur une
vraie adresse HTTPS et transmet à votre téléphone. Cloudflare le propose
gratuitement et sans compte pour un usage temporaire.

---

## Étape 7 — Le tunnel Cloudflare

> **Deux pièges rencontrés en conditions réelles**, corrigés ci-dessous.
> D'abord, aucune commande de ce guide ne contient de texte à remplacer :
> un `VOTRE_ADRESSE` recopié tel quel produit une erreur incompréhensible.
> Ensuite, le tunnel est forcé en **HTTP/2** : par défaut cloudflared utilise
> QUIC, qui passe par UDP. Sur un réseau mobile, le tunnel se crée et obtient
> bien une adresse, mais ne s'enregistre jamais auprès de Cloudflare — qui
> répond alors **530**.

Ouvrez une **seconde session Termux** (glissez depuis le bord gauche →
`NEW SESSION`), puis :

```bash
proot-distro login ubuntu
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

Ensuite, **une seule commande fait tout** :

```bash
cd ~/wajdi-tayssir
bash scripts/demarrer.sh
```

Le script démarre le site s'il ne tourne pas déjà, ouvre le tunnel en HTTP/2,
**attend qu'il soit réellement enregistré** auprès de Cloudflare, affiche
l'adresse publique et la teste depuis Internet. Il se termine sur un verdict
sans ambiguïté :

```
  ────────────────────────────────────────────────────
   Adresse du site      : https://xxxx-yyyy.trycloudflare.com
   Test depuis Internet : HTTP 200
  ────────────────────────────────────────────────────
   ✅ Le site est accessible depuis Internet.
```

Pour tout arrêter : `bash scripts/arreter.sh`

**L'adresse ne change pas tant que le tunnel tourne.** Relancer
`demarrer.sh` conserve un tunnel déjà fonctionnel — pratique pour redémarrer
le site sans perdre l'adresse déjà partagée :

```bash
kill $(cat .site.pid)   # arrête le site, garde le tunnel
rm -rf data             # facultatif : repartir sur des données vierges
bash scripts/demarrer.sh
```

Seul `arreter.sh` coupe le tunnel — et donc change l'adresse au prochain
démarrage.

Cloudflare affiche au bout de quelques secondes une adresse du type :

```
https://quelque-chose-au-hasard.trycloudflare.com
```

**C'est l'adresse de votre site.** Elle fonctionne depuis n'importe où, en
HTTPS, gratuitement.

Reportez-la dans `.env.local` (`NEXT_PUBLIC_SITE_URL`), puis relancez
`npm run build` et `npm start` dans la première session.

> Cette adresse gratuite **change à chaque redémarrage du tunnel**. Pour une
> adresse stable ou votre propre nom de domaine, il faut un compte Cloudflare
> (gratuit) et un « tunnel nommé » : `cloudflared tunnel login`, puis
> `cloudflared tunnel create wajdi-tayssir`. Cloudflare documente la suite.

---

## Étape 8 — Empêcher Android d'éteindre le site

Dans Termux (pas dans Ubuntu), tapez :

```bash
termux-wake-lock
```

Cela empêche Android de mettre le processeur en veille. À faire à chaque
démarrage.

En complément, dans les réglages Android : **Applications → Termux → Batterie →
Sans restriction**. Et laissez le téléphone branché.

L'application **Termux:Boot** (F-Droid également) permet de relancer le site
automatiquement au redémarrage du téléphone.

---

## Résumé : relancer le site après un redémarrage

Trois lignes, et une seule session suffit :

```bash
termux-wake-lock
proot-distro login ubuntu
cd ~/wajdi-tayssir && bash scripts/demarrer.sh
```

Le site et le tunnel tournent en arrière-plan ; la session reste utilisable.
Pour revoir leur état :

```bash
tail -20 tunnel.log
tail -20 site.log
```

---

## Sauvegarder vos données

Toutes les demandes, avis, photos et réglages sont dans un seul dossier.
Copiez-le dans la mémoire du téléphone pour le retrouver facilement :

```bash
cd /root/wajdi-tayssir
tar czf /root/sauvegarde-$(date +%F).tar.gz data/
```

Puis, depuis Termux (hors Ubuntu) :

```bash
termux-setup-storage      # une seule fois, accepte la demande d'accès
cp ~/../usr/var/lib/proot-distro/installed-rootfs/ubuntu/root/sauvegarde-*.tar.gz \
   ~/storage/downloads/
```

Le fichier se retrouve dans le dossier **Téléchargements** du téléphone.

---

## Quand passer à un vrai serveur

Dès que le site devient l'adresse que vous donnez aux clients. Le passage est
simple : les mêmes commandes sur un VPS Linux (voir `README.md` §
« Mise en ligne »), et vous transférez le dossier `data/` pour ne rien perdre.

Comptez quelques dollars par mois pour un petit VPS — largement suffisant, le
site est statique à 90 %.

---

## Si quelque chose bloque

| Message | Cause probable | Solution |
|---|---|---|
| `Failed to load SWC binary` | Vous êtes dans Termux, pas dans Ubuntu | `proot-distro login ubuntu` |
| `JavaScript heap out of memory` | Mémoire insuffisante à la construction | `NODE_OPTIONS=--max-old-space-size=2048 npm run build` |
| `EACCES` / `permission denied` | Écriture hors du dossier autorisé | Restez dans `/root/wajdi-tayssir` |
| Le site tombe au bout de quelques minutes | Android a mis Termux en veille | `termux-wake-lock` + batterie « sans restriction » |
| L'adresse Cloudflare ne répond plus | Le tunnel s'est arrêté | `bash scripts/demarrer.sh` |
| Erreur **530** | Le tunnel n'est pas enregistré (QUIC bloqué par le réseau mobile) | `bash scripts/demarrer.sh`, qui force HTTP/2 |
| Erreur **502** ou **503** | Le tunnel fonctionne mais le site est arrêté | `bash scripts/demarrer.sh` le redémarre |
| `npm ci` très lent ou interrompu | Réseau mobile | Refaites-le en Wi-Fi |
