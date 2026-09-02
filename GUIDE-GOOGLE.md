# Valider la fiche Google Business Profile

Deux voies gratuites existent quand le code par SMS n'arrive pas : **la vidéo**
(immédiate, détaillée plus bas) et **l'e-mail** (qui suppose un nom de domaine).

- [Valider par e-mail](#valider-par-e-mail) — ce qu'il faut réunir d'abord
- [Valider par vidéo](#valider-par-vidéo) — sans rien acheter, sous 5 jours

---

## Valider par e-mail

### Pourquoi un domaine est obligatoire

Google n'envoie **jamais** le code sur une adresse Gmail. La méthode sert à
prouver que le site web vous appartient : le code part donc vers une adresse
**du domaine renseigné dans le champ « Site Web »** de la fiche.

| Site web renseigné | Adresse choisie par Google | Résultat |
| --- | --- | --- |
| `xxx.trycloudflare.com` | `…@xxx.trycloudflare.com` | ❌ boîte impossible : le domaine appartient à Cloudflare |
| `xxx.ngrok-free.app` | `…@xxx.ngrok-free.app` | ❌ même problème, chez ngrok |
| `wajdi-tayssir.eu.org` | `…@wajdi-tayssir.eu.org` | ✅ le domaine est à vous |
| `wajdi-tayssir.com` | `…@wajdi-tayssir.com` | ✅ |

Acheter une « boîte mail à 1 $ » chez un hébergeur ne sert à rien : elle serait
sur *leur* domaine, pas sur le vôtre. **Une fois le domaine obtenu, l'e-mail est
gratuit** (Cloudflare Email Routing).

### Les quatre étapes

**1. Obtenir un domaine.** Deux possibilités, et seulement deux :

| | 1re année | Ensuite | Délai | Remarque |
| --- | --- | --- | --- | --- |
| `.xyz` chez Namecheap ou Porkbun | **~1,18 $** | ~13 $/an | immédiat | dont 0,18 $ de taxe ICANN, incompressible : c'est le plancher du marché |
| `.me` via le [GitHub Student Pack](https://education.github.com/pack) | **0 $** | ~5 $/an | immédiat | **réservé aux étudiants inscrits**, sur justificatif |
| `.eu.org` sur [nic.eu.org](https://nic.eu.org/) | **0 $** | 0 $ | **semaines à plusieurs mois** | bénévole, examen manuel, refus possible |
| « domaine offert » d'un hébergeur | 0 $ | ~12 $/an | immédiat | ⚠️ conditionné à un hébergement à **30-100 $/an** dont ce site n'a aucun besoin |

> **Le « domaine gratuit la première année » des hébergeurs n'est pas une
> économie.** Il est toujours lié à l'achat d'un hébergement mutualisé. Or ce
> site tourne sur le téléphone : payer un hébergement pour obtenir un domaine
> revient à dépenser trente fois le prix du domaine seul.

**2. Mettre le domaine sur Cloudflare.** `dash.cloudflare.com` → *Add a site* →
plan **Free**. Cloudflare donne deux serveurs de noms à déclarer chez le
vendeur du domaine (ou dans le formulaire eu.org).

**3. Créer l'adresse e-mail, gratuitement.** Cloudflare → votre domaine →
**Email** → **Email Routing** → *Get started* → créer `contact@votredomaine`
et le rediriger vers votre Gmail. Cloudflare pose les enregistrements MX seul.

Vérifiez la redirection en vous envoyant un message d'essai **avant** de
relancer Google : si l'essai n'arrive pas, le code n'arrivera pas non plus.

**4. Relancer Google.** Dans la fiche : *Modifier* → **Site Web** →
`https://votredomaine` → enregistrer. Puis reprendre la validation et choisir
**e-mail**. Google proposera cette fois une adresse sur votre domaine ; le code
à 5 chiffres arrive dans votre Gmail.

### Ordre à respecter pour un `.eu.org`

Le formulaire réclame deux serveurs de noms **avant** d'attribuer le domaine.
Il faut donc préparer Cloudflare en premier, sinon la demande est rejetée :

1. `dash.cloudflare.com` → *Add a site* → tapez le nom visé
   (`wajdi-tayssir.eu.org`) → plan **Free** → **notez les deux serveurs de
   noms**. Cloudflare accepte ce nom comme domaine racine, `eu.org` figurant
   dans la Public Suffix List. Le tableau de bord affichera « pending » : c'est
   normal, le domaine n'existe pas encore.
2. [nic.eu.org](https://nic.eu.org/) → créer un compte (un « contact ») avec
   des coordonnées **exactes** — nom, adresse, e-mail réels. Attendre l'e-mail
   de validation du compte, qui demande déjà une intervention humaine.
3. Une fois connecté : *New domain* → le nom souhaité → renseigner les deux
   serveurs de noms Cloudflare notés à l'étape 1.
4. Attendre. Il n'y a rien d'autre à faire, et relancer n'accélère rien.

**Causes de refus connues :** coordonnées inexactes ou fantaisistes, nom
ressemblant à une marque déposée, moins de 4 caractères, serveurs de noms
absents ou injoignables.

---

## Valider par vidéo


La vidéo est **gratuite**, ne demande aucun achat ni aucun domaine, et elle est
prévue pour un artisan qui se déplace chez ses clients, sans local commercial.
C'est la seule voie qui aboutit le jour même quand le SMS n'arrive pas.

> **Réponse de Google : sous 5 jours ouvrés en général.** En cas de refus, on
> peut refaire une vidéo — le nombre d'essais n'est pas limité.

---

## Avant de filmer : régler le type d'activité

Dans la fiche Google, l'activité doit être déclarée en **zone desservie**
(*service-area business*) et **non** en boutique :

- *Modifier le profil* → **Adresse de l'établissement** → répondre **non** à
  « Les clients peuvent-ils venir à votre adresse ? »
- Renseigner à la place les **zones desservies** : Tunis, Ariana, Ben Arous…

C'est la première cause de refus : si Google croit à une boutique et que la
vidéo ne montre aucune devanture, la validation échoue automatiquement.

Ne jamais inventer une adresse pour « faire sérieux » : une adresse fausse fait
suspendre la fiche définitivement.

---

## Les règles techniques, à respecter à la lettre

| Règle | Détail |
| --- | --- |
| **Une seule prise** | Aucune coupure, aucun montage. On appuie une fois sur enregistrer, on ne s'arrête plus. |
| **En direct** | La vidéo se filme **depuis l'application Google**, au moment où elle le demande. Une vidéo prise avant, dans la galerie, est refusée. |
| **Durée** | Au moins 30 secondes. Viser **45 à 60 secondes**. |
| **Bon compte** | Le téléphone doit être connecté au compte Google qui gère la fiche. |
| **Aucune voix** | Ni commentaire, ni conversation en arrière-plan. Filmer au calme, seul. |
| **Aucun visage** | Pas de clients, pas de passants reconnaissables. |
| **Aucun document sensible** | Pas de matricule fiscal, pas de RIB, pas de facture client lisible. |

---

## Les trois choses que la vidéo doit prouver

Google cherche trois preuves, dans cet ordre :

1. **Le lieu** — que l'activité existe quelque part de réel ;
2. **L'activité** — que le métier est bien exercé ;
3. **L'autorité** — que c'est bien vous qui la dirigez.

Une vidéo qui montre seulement des outils est refusée : il manque les preuves
1 et 3.

---

## Déroulé conseillé — plomberie / électricité

À filmer d'un seul geste, sans parler, en pleine journée. Compter environ
10 secondes par étape.

**1. La rue (10 s)**
Commencer dehors. Filmer lentement une plaque de rue, un commerce voisin avec
son enseigne lisible, un repère du quartier. Cela ancre l'activité dans un lieu
identifiable.

**2. Le véhicule (10 s)**
Faire le tour du véhicule ou de la moto de service. Si le nom
« WAJDI & TAYSSIR SERVICES PRO » y figure, s'attarder dessus. Ouvrir le coffre
ou le caisson.

**3. Le matériel (15 s)**
Balayer le matériel réel du métier : clés à molette, coupe-tube, chalumeau,
déboucheur, multimètre, pince à sertir, rouleaux de câble, disjoncteurs, gaine.
Plus le matériel est spécifique, plus la preuve est forte.

**4. Le stock (5 s)**
Raccords, joints, coudes, prises, interrupteurs, boîtes de dérivation.

**5. La preuve que c'est vous (15 s)**
C'est l'étape que tout le monde oublie, et la deuxième cause de refus. Au
choix, sans jamais couper :
- ouvrir avec **votre clé** le local, le dépôt ou le coffre à outils ;
- montrer un **carnet de factures** ou un devis à l'en-tête de l'entreprise —
  **en masquant les numéros fiscaux et les coordonnées des clients** ;
- montrer un vêtement de travail, un autocollant ou une carte de visite au nom
  de l'entreprise ;
- finir en filmant votre téléphone affichant la fiche Google connectée.

---

## Erreurs qui font refuser

- La vidéo est coupée en deux, ou envoyée depuis la galerie.
- On entend une voix, la vôtre y compris.
- Moins de 30 secondes.
- Rien ne relie l'activité à un lieu : uniquement des outils sur une table.
- Aucune preuve d'autorité (ni clé, ni document, ni enseigne).
- Le nom de l'entreprise n'apparaît nulle part.
- La fiche est déclarée en boutique alors qu'il n'y a pas de devanture.

---

## Et le site web dans la fiche ?

Ne renseigner le champ **Site Web** qu'avec une adresse **stable** :

- ✅ un domaine à vous (`scripts/domaine.sh`) ;
- ✅ à défaut, l'adresse ngrok fixe (`scripts/ngrok.sh`) ;
- ❌ **jamais** une adresse `…trycloudflare.com` : elle change à chaque
  redémarrage, et Google pénalise puis suspend une fiche dont le site ne répond
  plus.

Mieux vaut laisser le champ vide qu'y mettre une adresse morte. La fiche peut
être validée sans site web, et le champ se remplit après coup.

---

## Après la validation

- Publier des photos de chantiers **réels** (avant / après) — c'est ce qui fait
  cliquer.
- Renseigner les horaires, y compris les urgences 24h/24 si c'est le cas.
- Demander un avis à chaque client satisfait, sans jamais en acheter : les faux
  avis font supprimer la fiche.
- Répondre à tous les avis, même les mauvais, calmement.
