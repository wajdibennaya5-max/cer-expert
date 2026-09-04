# Guide d'utilisation — WAJDI & TAYSSIR SERVICES PRO

Ce guide s'adresse à la personne qui utilise le site au quotidien.
Aucune connaissance technique n'est nécessaire.

---

## 1. Se connecter

Rendez-vous sur **20122011.xyz/admin**, saisissez votre identifiant et votre
mot de passe. La session reste ouverte 8 heures, puis se referme d'elle-même.

> Si un bandeau orange apparaît en haut de la console, c'est que le mot de passe
> par défaut est encore actif. Demandez à la personne qui a installé le site de
> le remplacer avant d'ouvrir le site au public.

### Changer le mot de passe

Dans Termux, sur le téléphone qui héberge le site :

```bash
cd ~/wajdi-tayssir
bash scripts/mot-de-passe.sh
bash scripts/demarrer.sh
```

La saisie ne s'affiche pas pendant la frappe : c'est voulu. Le second ordre
est indispensable — le site ne relit ce réglage qu'au démarrage.

### La connexion est refusée

Deux messages différents, deux causes différentes :

| Message | Ce qui se passe | Quoi faire |
|---|---|---|
| **Trop de tentatives. Patientez quelques minutes.** | Le compteur anti-abus s'est déclenché après plusieurs essais ratés. Le mot de passe n'est pas en cause. | Attendre 15 minutes, ou redémarrer le site (le compteur repart de zéro) |
| **Identifiants incorrects.** | L'identifiant ou le mot de passe ne correspond pas à ce que **le serveur en cours** connaît | Lancer le diagnostic ci-dessous |

```bash
cd ~/wajdi-tayssir
bash scripts/verifier-admin.sh
```

Il demande le mot de passe, le compare à celui qui est enregistré, interroge le
site, puis dit laquelle des trois causes possibles est la bonne — et propose de
la corriger. Le piège le plus fréquent : un mot de passe changé alors que le
site tournait déjà. Le fichier est à jour, mais le serveur lancé avant continue
d'utiliser l'ancien. Il faut le relancer, pas le laisser tourner.

> Le clavier du téléphone met souvent une majuscule au premier caractère sans
> qu'on la voie. En cas de doute, appuyez une fois sur la touche majuscule
> avant de taper.

---

## 2. Le quotidien : traiter une demande

Quand un client remplit le formulaire ou parle à l'assistant, la demande arrive
immédiatement dans la console avec un **numéro de référence** (ex. `WT-0209-4821`).

**Le parcours d'une demande, en 5 statuts :**

| Statut | Ce qu'il signifie | Quand le poser |
|---|---|---|
| 🟡 Demande reçue | Le client a envoyé sa demande | Automatique |
| 🔵 En cours d'analyse | Vous avez lu la demande | Dès que vous la prenez en charge |
| 🟣 Rendez-vous programmé | La date est fixée avec le client | Après l'appel de confirmation |
| 🟠 Technicien en intervention | Quelqu'un est sur place | Le jour J |
| 🟢 Intervention terminée | C'est fini | À la fin du chantier |

**Le client voit ces statuts en temps réel** dans son espace client. Les tenir à
jour évite les appels « où en est ma demande ? ».

### Traiter une demande, pas à pas

1. **Demandes** dans le menu → cliquez sur la ligne du client.
2. Bouton **Appeler** en haut à droite : appel direct depuis le téléphone.
3. Fixez la date dans **Rendez-vous** (date, heure, technicien) → *Programmer*.
4. Changez le **statut**. Le commentaire saisi juste en dessous est **visible
   par le client** : « Nous passons jeudi entre 9 h et 11 h » y a sa place.
5. Utilisez **Note interne** pour tout ce qui ne regarde que l'équipe :
   pièce à prévoir, code d'entrée, remarque sur l'accès.

### Les urgences

Les demandes marquées « Urgence immédiate » apparaissent **en rouge** sur le
tableau de bord. Le compteur « Urgences en cours » ne retombe à zéro que
lorsqu'elles sont terminées ou annulées.

---

## 3. Le calendrier

**Calendrier** dans le menu : tous les rendez-vous du mois, avec l'heure et le
nom du client. Les flèches en haut à droite changent de mois. Un clic sur un
rendez-vous ouvre la demande correspondante.

Les rendez-vous se créent depuis la fiche d'une demande, pas depuis le
calendrier — ainsi un rendez-vous est toujours rattaché à un client.

---

## 4. La galerie

**Galerie** dans le menu. Deux façons d'ajouter une réalisation :

- **Photo** : votre propre photo de chantier (JPEG, PNG ou WebP, 5 Mo maximum).
  C'est ce qui convainc le plus.
- **Illustration** : un des dessins fournis avec le site, si vous n'avez pas
  encore de photo pour cette prestation.

Donnez un titre clair (« Remplacement d'un mitigeur de cuisine » vaut mieux que
« Photo 1 ») et choisissez la catégorie. Le bouton **Publié / Masqué** contrôle
l'affichage sur le site sans rien supprimer.

**Conseil :** les avant/après sont ce qui marche le mieux. Prenez la photo
« avant » avant de commencer — après, il est trop tard.

---

## 5. Les avis clients

**Avis** dans le menu. Aucun avis n'apparaît sur le site sans votre accord.

- **En attente** : les avis qui viennent d'arriver. À lire, puis publier ou refuser.
- **Répondre** : votre réponse s'affiche sous l'avis sur le site. Une réponse
  courte et polie à un avis mitigé rassure plus qu'un avis parfait.

Le site est livré avec **trois avis d'exemple**, clairement identifiés comme
tels. Dès que vous avez publié de vrais témoignages, allez dans
**Paramètres → Avis** et décochez « Afficher les avis d'exemple ».

---

## 6. Les paramètres

**Paramètres** dans le menu. Tout ce qui s'y trouve se modifie sans intervention
technique et s'applique au site en moins d'une minute.

- **Zones d'intervention** — les villes et quartiers où vous vous déplacez.
  Elles apparaissent dans le pied de page, la page contact, le formulaire et
  les informations lues par Google. Ajoutez-en dès que votre périmètre s'élargit.
- **Bandeau d'annonce** — le bandeau coloré en haut du site. Idéal pour une
  information temporaire (« Fermé le 15 août »). Décochez-le le reste du temps :
  un bandeau permanent finit par ne plus être lu.
- **Programme de fidélité** — points par demande, par intervention terminée,
  badges et paliers. Tout est modifiable.

> **Important sur la fidélité :** le site n'accorde jamais de réduction de
> lui-même. Les paliers portent le texte que vous écrivez. N'y annoncez que ce
> que vous pouvez tenir.

---

## 7. L'assistant du site

Le petit bouton bleu en bas de l'écran (une barre « Assistant » sur téléphone)
ouvre un assistant qui accueille le visiteur, comprend son problème, donne les
gestes de sécurité utiles et prépare une demande complète.

Ce qu'il fait :

- il pose les questions dans l'ordre et n'oublie jamais le téléphone ;
- il reconnaît les situations dangereuses (odeur de gaz, odeur de brûlé, fumée,
  eau près d'une prise) et affiche immédiatement les bons réflexes, puis invite
  à appeler ;
- il crée une vraie demande, avec son numéro de référence.

Ce qu'il ne fait **pas**, volontairement :

- aucun diagnostic technique ;
- aucun prix, aucun délai, aucune promesse en votre nom.

Les demandes qui en viennent portent la mention **« Via l'assistant »** sur leur
fiche.

---

## 8. Ce que voit votre client

Après l'envoi, le client reçoit un **numéro de référence**. Avec ce numéro et
son téléphone, il ouvre **votre-site.tn/fr/espace-client** et suit :
l'avancement, le rendez-vous, ses photos, l'historique et ses points fidélité.

Dites-le au téléphone : « vous pouvez suivre l'intervention sur le site avec
votre numéro de référence » — cela remplace beaucoup de rappels.

---

## 9. Sauvegarder

Toutes les données (demandes, avis, galerie, photos) sont dans un seul dossier :
**`data/`**. Une sauvegarde, c'est une copie de ce dossier.

Sur le serveur :

```bash
tar czf sauvegarde-$(date +%F).tar.gz data/
```

Faites-le avant toute mise à jour du site. Une fois par mois est un bon rythme.

---

## 10. En cas de problème

| Symptôme | À faire |
|---|---|
| Un client dit ne pas recevoir de réponse | Vérifiez **Demandes** : la demande est-elle bien arrivée ? |
| Une modification n'apparaît pas sur le site | Attendez une minute et rechargez : le site se rafraîchit toutes les 60 secondes. |
| « Trop de tentatives » à la connexion | Protection anti-intrusion. Patientez 15 minutes. |
| Mot de passe oublié | Il ne peut pas être récupéré (il n'est pas stocké en clair). Il faut en générer un nouveau — voir README.md § Sécurité. |
| Le site ne répond plus | Redémarrez le service sur le serveur ; les données ne sont pas perdues. |

---

## En résumé, chaque jour

1. Ouvrir le **tableau de bord** : nouvelles demandes et urgences.
2. **Appeler** les nouveaux clients depuis leur fiche.
3. Mettre le **statut** à jour après chaque appel et chaque intervention.
4. Publier les **avis** reçus.
5. Ajouter une **photo** de chantier de temps en temps.

Cinq minutes le matin suffisent.
