# WAJDI & TAYSSIR SERVICES PRO — site web

**Plomberie • Électricité • Dépannage à domicile**
*Votre confort, notre métier. Une intervention rapide, fiable et professionnelle.*

Site vitrine et outil de travail : il présente les prestations, transforme un
visiteur en demande d'intervention qualifiée, et donne à l'équipe une console
pour suivre chaque intervention du premier appel à la fin du chantier.

---

## ⚠️ À vérifier avant la mise en ligne

Trois points, deux minutes :

1. **L'adresse e-mail.** Le site affiche `wajdibennaya@gmail.com`. La demande
   initiale comportait un espace (`wajdi bennaya@gmail.com`), qui n'est pas une
   adresse valide — l'espace a donc été retiré. **Si votre adresse réelle est
   différente** (par exemple `wajdibennaya5@gmail.com`), corrigez-la dans
   `.env.local` via `NEXT_PUBLIC_CONTACT_EMAIL`, ou dans `src/lib/site.ts`.
2. **Le mot de passe d'administration.** Sans configuration, le compte de
   développement `admin / admin` est actif. Voir § Sécurité.
3. **La clé de session** (`SESSION_SECRET`). Sans elle, une valeur de
   développement connue est utilisée. Voir § Sécurité.

La console d'administration affiche un bandeau d'avertissement tant que les
points 2 et 3 ne sont pas réglés.

---

## Démarrer

```bash
npm install
npm run dev          # http://localhost:3000
```

Le site fonctionne immédiatement, sans base de données, sans compte externe et
sans clé d'API : les demandes sont enregistrées dans le dossier `data/`.

```bash
npm run build && npm start   # version de production
npm run seed                 # 5 demandes de démonstration (développement)
npm run lint                 # analyse statique
npm run typecheck            # vérification des types
```

**Prérequis :** Node.js 20.9 ou plus récent.

---

## Ce que contient le site

### Pages publiques (français, anglais, arabe)

| Adresse | Contenu |
|---|---|
| `/fr` | Accueil : héros, services, preuves de confiance, méthode, galerie, avis, fidélité, FAQ |
| `/fr/services` | Les 21 prestations, classées par métier |
| `/fr/services/<prestation>` | Fiche détaillée d'une prestation (21 × 3 langues) |
| `/fr/demande` | Formulaire de demande d'intervention avec photos |
| `/fr/realisations` | Galerie filtrable avec visionneuse |
| `/fr/avis` | Avis clients + dépôt d'un avis |
| `/fr/contact` | Téléphone, WhatsApp, e-mail, horaires, zones |
| `/fr/espace-client` | Suivi des demandes et avantages fidélité |
| `/fr/confidentialite`, `/fr/conditions` | Mentions légales |

`/` redirige vers la langue du visiteur (cookie, puis en-tête `Accept-Language`,
puis français). Les versions `/en/...` et `/ar/...` sont complètes ; l'arabe
s'affiche en écriture de droite à gauche.

### Console d'administration — `/admin`

- **Tableau de bord** : nouvelles demandes, urgences, rendez-vous, clients,
  histogramme des 14 derniers jours, répartition par statut, services les plus
  demandés.
- **Demandes** : recherche plein texte, filtres (statut, urgence, métier),
  fiche détaillée, changement de statut, prise de rendez-vous, notes internes.
- **Calendrier** : vue mensuelle des rendez-vous.
- **Galerie** : téléversement de photos de chantier ou choix d'une illustration
  intégrée, publication/masquage, suppression.
- **Avis** : modération (publier / en attente / refuser), réponse publique.
- **Paramètres** : zones d'intervention, bandeau d'annonce, avis d'exemple,
  et l'intégralité des règles du programme de fidélité.

### Assistant conversationnel

Accessible depuis le bouton flottant (bureau) ou la barre d'action (mobile).
Il accueille le visiteur, reconnaît le besoin décrit en texte libre, donne les
gestes de sécurité utiles, pose les questions une par une et **crée une vraie
demande d'intervention** avec un numéro de référence.

Points importants :

- Il **ne pose aucun diagnostic** et ne l'affirme jamais.
- Il **détecte les situations dangereuses** (odeur de gaz, odeur de brûlé,
  fumée, étincelles, eau près d'une prise, choc électrique) et affiche
  immédiatement les gestes reconnus, puis pousse à l'appel téléphonique.
- Il fonctionne **sans aucun service externe** (voir § L'assistant en détail).

---

## Architecture

```
src/
├── app/
│   ├── (site)/[lang]/        Site public — mise en page racine n°1
│   ├── (admin)/admin/        Console — mise en page racine n°2
│   ├── api/                  Routes serveur (demandes, assistant, médias, admin)
│   ├── opengraph-image.tsx   Vignette de partage, générée au build
│   ├── sitemap.ts, robots.ts, manifest.ts, icon.svg
│   └── globals.css           Système de design (Tailwind v4)
├── components/               Composants d'interface, par domaine
├── content/services.ts       Les 21 prestations, trilingues
├── lib/
│   ├── site.ts               Coordonnées et identité (source unique)
│   ├── i18n/                 Dictionnaires fr / en / ar
│   ├── store/                Accès aux données (interface + implémentation)
│   ├── ai/                   Assistant : connaissances, moteur, connecteur LLM
│   ├── auth.ts               Sessions signées, mots de passe (scrypt)
│   ├── validation.ts         Schémas Zod partagés navigateur/serveur
│   ├── rate-limit.ts         Limitation d'abus
│   ├── rewards.ts            Programme de fidélité
│   ├── seo.ts                Données structurées schema.org
│   └── stats.ts              Agrégats du tableau de bord
└── middleware.ts             Routage linguistique

Dockerfile, compose.yaml       Déploiement en conteneur (facultatif)
scripts/                       Génération du mot de passe admin, jeu de démo
```

**Deux mises en page racines.** Le site public et la console sont deux arbres
indépendants : la console ne charge ni l'assistant, ni les polices arabes, ni
la barre d'action mobile, et le site public n'embarque rien de la console.

**Choix techniques**

| Sujet | Choix | Raison |
|---|---|---|
| Cadre | Next.js 15 (App Router) + React 19 + TypeScript | Rendu serveur pour le SEO, routes d'API intégrées, sitemap et métadonnées natifs |
| Style | Tailwind CSS v4 | Aucune feuille de style à maintenir à la main, purge automatique |
| Validation | Zod | Un seul schéma pour le navigateur et le serveur |
| Données | Fichiers JSON (`data/`) | Aucun service externe, aucun abonnement, sauvegarde = copie d'un dossier |
| Images | Illustrations SVG dessinées pour le projet | Aucune licence à vérifier, quelques kilo-octets, jamais de lien mort |
| Graphiques | SVG/CSS écrits à la main | Aucune librairie de graphiques à charger |
| Icônes | Jeu maison (40 icônes) | Style homogène, poids négligeable |

**Dépendances de production : 4** — `next`, `react`, `react-dom`, `zod`
(plus `@anthropic-ai/sdk`, chargé dynamiquement et uniquement si vous branchez
un modèle de langage).

---

## Configuration

Toutes les variables sont décrites dans **`.env.example`**. Copiez-le :

```bash
cp .env.example .env.local
```

| Variable | Rôle | Obligatoire |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Adresse publique (sitemap, SEO, partage) | En production |
| `NEXT_PUBLIC_CONTACT_PHONE` | Numéro affiché et composé | Non (valeur par défaut) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Adresse e-mail affichée | Non (valeur par défaut) |
| `SESSION_SECRET` | Signature des sessions | **En production** |
| `ADMIN_USERNAME` | Identifiant de la console | **En production** |
| `ADMIN_PASSWORD_HASH` | Empreinte du mot de passe | **En production** |
| `DATA_DIR` | Dossier de stockage | Non (`./data`) |
| `ASSISTANT_PROVIDER` | `rules` ou `anthropic` | Non (`rules`) |
| `ANTHROPIC_API_KEY` | Clé du modèle de langage | Seulement si `anthropic` |

Ce qui se modifie **sans redéployer** (depuis `/admin/parametres`) : zones
d'intervention, bandeau d'annonce, avis d'exemple, règles de fidélité, galerie,
avis, statuts et rendez-vous.

---

## Sécurité

**Avant toute mise en ligne :**

```bash
# 1. Clé de signature des sessions
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
#    → à copier dans SESSION_SECRET

# 2. Mot de passe d'administration
npm run admin:password -- "un-mot-de-passe-long-et-unique"
#    → affiche la ligne ADMIN_PASSWORD_HASH=... à copier telle quelle
```

Ce qui est en place :

- **Mots de passe** : jamais stockés en clair (scrypt + sel aléatoire),
  comparaison à temps constant.
- **Sessions** : cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production,
  signé en HMAC-SHA256 et daté. Le cookie ne contient aucune donnée sensible.
- **Validation** : chaque entrée est revalidée côté serveur. La validation du
  navigateur n'est qu'un confort d'affichage.
- **Fichiers envoyés** : type MIME, taille (5 Mo) *et* signature binaire réelle
  vérifiés ; le nom d'origine n'est jamais utilisé sur disque ; les fichiers
  sont stockés hors du dossier public et servis par une route dédiée.
- **Limitation d'abus** : par adresse IP sur les formulaires, l'assistant, les
  envois de photos et les connexions (fenêtre stricte sur l'administration).
- **Champ piège anti-robot** sur les formulaires publics.
- **En-têtes HTTP** : `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
- **Messages d'erreur** : aucun détail technique n'est renvoyé au visiteur ;
  le détail part dans les journaux du serveur.
- **Espace client** : accès par référence **et** téléphone, avec un message
  d'erreur unique qui n'indique pas lequel des deux est faux.
- **Console** : `noindex`, exclue de `robots.txt`, chaque route d'API vérifie
  la session avant toute lecture ou écriture.

**Ce qui n'est pas garanti :** aucun site n'est inviolable. La limitation
d'abus est propre à chaque instance du serveur et se réinitialise au
redémarrage ; pour un déploiement multi-instances, branchez un compteur
partagé. Le programme de fidélité n'a pas vocation à porter de valeur
monétaire.

---

## Base de données

Par défaut, les données vivent dans des fichiers JSON sous `data/` :
`requests.json`, `reviews.json`, `gallery.json`, `media.json`, `clients.json`,
`settings.json`, et les photos dans `data/uploads/`.

Les écritures sont **sérialisées** (file d'attente) et **atomiques** (fichier
temporaire puis `rename`) : pas de fichier corrompu en cas d'écritures
simultanées.

**Sauvegarde** : copiez le dossier `data/`. C'est tout.

```bash
tar czf sauvegarde-$(date +%F).tar.gz data/
```

**Changer de base de données** : toute l'application passe par `store`
(`src/lib/store/index.ts`). Fournir un objet exposant les mêmes méthodes
(`listRequests`, `createRequest`, `getSettings`, …) suffit à basculer sur
PostgreSQL, SQLite ou autre — sans toucher aux pages, aux composants ni aux
routes d'API. Les types sont dans `src/lib/store/types.ts`.

⚠️ **Ce stockage exige un disque persistant.** Sur un hébergement 100 %
« serverless » (voir plus bas), le dossier `data/` est réinitialisé à chaque
démarrage : les demandes seraient perdues. C'est le point à trancher avant de
choisir un hébergeur.

---

## L'assistant en détail

### Mode par défaut : `rules` — réellement gratuit, sans limite

Le moteur (`src/lib/ai/engine.ts`) est une machine à états déterministe,
adossée à une base de connaissances (`src/lib/ai/knowledge.ts`) :

- reconnaissance du besoin par mots-clés issus des 21 prestations,
- règles de sécurité prioritaires sur tout le reste du dialogue,
- collecte en 8 étapes, puis création d'une vraie demande.

Il tourne sur votre serveur, sans appel externe : **pas de quota, pas de coût,
pas de service tiers qui peut fermer.**

### Mode facultatif : `anthropic` — payant

En posant `ASSISTANT_PROVIDER=anthropic` et `ANTHROPIC_API_KEY`, la **phrase
d'accueil** de chaque réponse est reformulée par un modèle de langage, pour un
ton plus naturel. Le reste ne change pas :

- le modèle ne peut ni poser de diagnostic, ni annoncer un prix ou un délai,
  ni sauter une étape (consigne stricte + garde-fous dans le code) ;
- les messages de sécurité, le récapitulatif et la référence ne sont **jamais**
  réécrits ;
- en cas d'erreur, de lenteur, de quota dépassé ou de refus, la réponse du
  moteur est renvoyée telle quelle : **l'assistant ne tombe jamais en panne à
  cause du modèle** ;
- la clé reste côté serveur, jamais exposée au navigateur.

**Honnêteté sur le coût :** l'API Anthropic est facturée à l'usage. Il n'existe
pas d'offre gratuite illimitée. Le mode `rules` est là précisément pour que le
site soit complet sans cette dépense.

---

## Mise en ligne

### Ce qui est réellement gratuit

| Élément | Gratuit ? | Limites |
|---|---|---|
| Le code de ce site | Oui, sans réserve | Aucune |
| Assistant en mode `rules` | Oui, sans réserve | Aucune |
| Illustrations, icônes, polices | Oui | Polices Google, chargées au build |
| Hébergement | Selon l'hébergeur | Voir ci-dessous |
| Nom de domaine | **Non** | Compter ~10-40 DT/an en `.tn` |
| Assistant en mode `anthropic` | **Non** | Facturé à l'usage |

⚠️ Les niveaux gratuits des hébergeurs sont **modifiables sans préavis** par
leurs éditeurs. Ce document décrit la situation au moment de la livraison ;
vérifiez les conditions en vigueur avant de vous engager.

### Option recommandée — un hébergeur Node avec disque persistant

C'est la seule configuration où **tout** fonctionne tel quel, y compris
l'enregistrement des demandes et les photos.

```bash
npm ci
npm run build
NODE_ENV=production \
SESSION_SECRET=... ADMIN_USERNAME=... ADMIN_PASSWORD_HASH=... \
NEXT_PUBLIC_SITE_URL=https://votre-domaine.tn \
npm start          # écoute sur le port 3000
```

Placez un serveur web (Nginx, Caddy) devant pour le HTTPS, et un gestionnaire
de processus (`pm2`, `systemd`) pour le redémarrage automatique. Un petit VPS
(~5 $/mois) ou un hébergement Node mutualisé suffit largement : le site est
statique à 90 %.

#### Avec Docker

Un `Dockerfile` et un `compose.yaml` sont fournis :

```bash
cp .env.example .env.local   # puis renseignez SESSION_SECRET, ADMIN_*, l'URL
docker compose up -d
```

Le volume `wajdi-data` conserve les demandes, les avis, la galerie et les
photos. **Sans ce volume, tout serait perdu à chaque redémarrage.**

> Ces fichiers ont été écrits à partir d'un démarrage réellement vérifié en
> dépendances de production (`npm ci --omit=dev`, site servi, demande créée),
> mais la construction de l'image n'a pas pu être exécutée pendant le
> développement : aucun démon Docker n'était disponible. Faites un
> `docker compose build` d'essai avant de vous appuyer dessus en production.

#### Avec systemd

Exemple de service `systemd` :

```ini
[Unit]
Description=Wajdi & Tayssir Services Pro
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/wajdi-tayssir
EnvironmentFile=/var/www/wajdi-tayssir/.env.local
ExecStart=/usr/bin/npm start
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

### Option « niveau gratuit » — Vercel, Netlify, Cloudflare

Le déploiement est immédiat (import du dépôt Git, aucune configuration), et le
niveau gratuit couvre largement le trafic d'une entreprise artisanale.
**Mais** ces plateformes n'offrent pas de disque persistant : les demandes
enregistrées disparaîtraient au redéploiement ou après une mise en veille.

Deux façons de procéder :

1. **Site vitrine seul** : parfait tout de suite. Les visiteurs appellent,
   écrivent sur WhatsApp ou envoient un e-mail. Le formulaire et l'assistant
   fonctionnent, mais ne conservez pas l'historique.
2. **Site complet** : branchez une base externe en remplaçant l'implémentation
   de `store` (voir § Base de données). Les niveaux gratuits de Neon,
   Supabase ou Turso conviennent — avec, là encore, des quotas susceptibles
   d'évoluer.

### Après la mise en ligne

- Déclarez le site dans **Google Search Console** et soumettez
  `https://votre-domaine.tn/sitemap.xml`.
- Créez une fiche **Google Business Profile** : pour une entreprise locale,
  c'est le premier levier de visibilité, avant le site lui-même.
- Remplacez les avis d'exemple par de vrais témoignages, puis décochez
  « Afficher les avis d'exemple » dans les paramètres.
- Publiez de vraies photos de chantier dans la galerie.

---

## Référencement

- Titres, descriptions et mots-clés propres à chaque page, dans les 3 langues.
- Structure `h1` / `h2` / `h3` respectée, une seule `h1` par page.
- Données structurées : `LocalBusiness` + `Plumber` + `Electrician`, `Service`
  (par prestation), `FAQPage`, `BreadcrumbList`, `WebSite`.
  **Aucune adresse postale n'est inventée** : l'entreprise est déclarée comme
  intervenant sur des zones (`areaServed`), ce qui correspond à la réalité.
- `sitemap.xml` (87 adresses) et `robots.txt` générés automatiquement.
- Balises `hreflang` réciproques entre les trois langues, URL canoniques.
- Open Graph et Twitter Card avec une vignette générée au build
  (`/image-partage`, 1200 × 630).
- Adresses lisibles et stables (`/fr/services/reparation-fuite-eau`).

Pour ajouter une zone d'intervention : `/admin/parametres`. Elle apparaît
aussitôt dans le pied de page, la page contact, le formulaire et les données
structurées.

---

## Performance

- 100 pages pré-générées au build (les 3 langues × toutes les pages publiques).
- Contenus modifiables rafraîchis toutes les 60 secondes, sans redéploiement.
- ~103 ko de JavaScript partagé (React inclus) ; les pages n'ajoutent que
  quelques centaines d'octets.
- Aucune image bitmap dans l'interface : les illustrations sont vectorielles.
- Photos téléversées servies avec un cache d'un an (nom de fichier unique).
- Animations en CSS uniquement, et `prefers-reduced-motion` respecté.

---

## Accessibilité

Contrastes vérifiés sur fond sombre comme sur fond clair, navigation complète
au clavier avec un anneau de focus visible partout, lien « Aller au contenu »,
libellés associés à tous les champs, `aria-label` sur les boutons icônes,
`role="alert"` sur les erreurs de formulaire, FAQ en `<details>` natif
(fonctionne sans JavaScript), et zones tactiles d'au moins 44 px sur mobile.

---

## Multilingue

Français (par défaut), anglais, arabe (droite à gauche).

Les textes vivent dans `src/lib/i18n/dictionaries/`. Le français
(`fr.ts`) sert de référence de types : **si vous ajoutez une clé en français,
TypeScript refuse de compiler tant qu'elle manque en anglais et en arabe.**
Impossible, donc, d'oublier une traduction.

Pour ajouter une langue : ajoutez le code dans `src/lib/i18n/config.ts`, créez
le dictionnaire correspondant, et complétez les champs de
`src/content/services.ts`.

---

## Vérifications effectuées

- `npm run build` : succès, 100 pages générées, aucun avertissement.
- `npm run typecheck` : aucune erreur.
- `npm run lint` : aucune erreur, aucun avertissement.
- `npm ci --omit=dev` puis `npm start` : le site démarre et enregistre une
  demande avec les seules dépendances de production.
- Toutes les pages testées en HTTP (200), 404 localisée comprise.
- Parcours complet de l'assistant, de l'accueil à la création de la demande.
- Formulaire : succès, erreurs de validation, limitation d'abus, champ piège.
- Espace client : mauvais identifiants refusés, bons identifiants acceptés.
- Console : accès refusé sans session, changement de statut, prise de
  rendez-vous, notes, galerie, avis, paramètres.
- Rendu vérifié au navigateur en 1440 px, 390 px (iPhone) et en arabe (RTL).
- Aucune erreur dans la console du navigateur.

---

## Guide d'utilisation quotidienne

Voir **[GUIDE-ADMIN.md](./GUIDE-ADMIN.md)** — rédigé pour une utilisation sans
connaissances techniques.

---

© WAJDI & TAYSSIR SERVICES PRO
