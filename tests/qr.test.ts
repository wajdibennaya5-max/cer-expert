import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import * as qr from "@/lib/paiement/qr";
import { canaux } from "@/lib/paiement/fournisseurs/manuel";

/**
 * Chaque cas travaille dans son propre dossier.
 *
 * `DATA_DIR` est relu à l'appel et non au chargement du module — c'est ce qui
 * permet d'écrire ces essais sans recharger le module à chaque fois, et c'est
 * aussi ce qui évite, en production, un chemin calculé avant que la
 * configuration du serveur soit posée.
 */
async function avecDossier(
  fn: (
    outils: {
      dossier: string;
      qr: typeof import("@/lib/paiement/qr");
      ecrire: (nom: string, octets: Buffer) => Promise<void>;
    },
  ) => Promise<void>,
) {
  const racine = await mkdtemp(path.join(tmpdir(), "qr-"));
  const avant = process.env.DATA_DIR;
  process.env.DATA_DIR = racine;
  try {
    await mkdir(path.join(racine, "paiement"), { recursive: true });
    await fn({
      dossier: racine,
      qr,
      ecrire: (nom, octets) => writeFile(path.join(racine, "paiement", nom), octets),
    });
  } finally {
    if (avant === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = avant;
    await rm(racine, { recursive: true, force: true });
  }
}

/** Un PNG minuscule mais authentique : signature, en-tête, fin de fichier. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 0x20)]);

const avecNom = async (nom: string | undefined, fn: () => Promise<void> | void) => {
  const avant = process.env.PAIEMENT_FLOUCI_QR;
  if (nom === undefined) delete process.env.PAIEMENT_FLOUCI_QR;
  else process.env.PAIEMENT_FLOUCI_QR = nom;
  try { await fn(); } finally {
    if (avant === undefined) delete process.env.PAIEMENT_FLOUCI_QR;
    else process.env.PAIEMENT_FLOUCI_QR = avant;
  }
};

test("SANS QR CONFIGURÉ, LA PAGE N’EN INVENTE PAS UN", () => avecDossier(async ({ qr }) => {
  await avecNom(undefined, async () => {
    assert.equal(qr.qrConfigure(), false);
    assert.equal(qr.nomFichierQr(), null);
    const r = await qr.lireQr();
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.raison, /PAIEMENT_FLOUCI_QR/);
  });
}));

test("un QR déposé est lu, et son type vient de son contenu", () =>
  avecDossier(async ({ qr, ecrire }) => {
    await ecrire("qr-flouci.png", PNG);
    await avecNom("qr-flouci.png", async () => {
      assert.equal(qr.qrConfigure(), true);
      const r = await qr.lireQr();
      assert.ok(r.ok);
      if (r.ok) {
        assert.equal(r.mime, "image/png");
        assert.deepEqual(r.octets, PNG);
      }
    });
    await ecrire("photo.jpg", JPEG);
    await avecNom("photo.jpg", async () => {
      const r = await qr.lireQr();
      assert.ok(r.ok);
      if (r.ok) assert.equal(r.mime, "image/jpeg");
    });
  }));

test("UN FICHIER RENOMMÉ EN .PNG N’EST PAS UNE IMAGE", () =>
  avecDossier(async ({ qr, ecrire }) => {
    // Le nom ne prouve rien. Servir le contenu d'un fichier arbitraire avec un
    // type d'image serait au mieux inutile, au pire dangereux.
    await ecrire("piege.png", Buffer.from("<?php echo 'bonjour'; ?>"));
    await avecNom("piege.png", async () => {
      const r = await qr.lireQr();
      assert.equal(r.ok, false);
      if (!r.ok) assert.match(r.raison, /pas une image/);
    });
  }));

test("AUCUN CHEMIN NE SORT DU DOSSIER PRÉVU", () => avecDossier(async ({ qr, dossier }) => {
  // La valeur vient de l'environnement, donc d'un administrateur — mais une
  // valeur mal recopiée ne doit pas pouvoir désigner un fichier ailleurs sur
  // le disque, et surtout pas un secret.
  await writeFile(path.join(dossier, "secret.png"), PNG);
  for (const tentative of ["../secret.png", "../../etc/passwd", "/etc/passwd",
    "paiement/../../secret.png", "..", "."]) {
    await avecNom(tentative, async () => {
      const r = await qr.lireQr();
      assert.equal(r.ok, false, `« ${tentative} » a été accepté`);
    });
  }
}));

test("un QR absent, vide ou énorme est refusé, avec sa raison", () =>
  avecDossier(async ({ qr, ecrire }) => {
    await avecNom("jamais-depose.png", async () => {
      const r = await qr.lireQr();
      assert.equal(r.ok, false);
      if (!r.ok) assert.match(r.raison, /introuvable/i);
    });
    await ecrire("vide.png", Buffer.alloc(0));
    await avecNom("vide.png", async () => {
      assert.equal((await qr.lireQr()).ok, false);
    });
    await ecrire("enorme.png", Buffer.concat([PNG, Buffer.alloc(qr.TAILLE_MAX)]));
    await avecNom("enorme.png", async () => {
      const r = await qr.lireQr();
      assert.equal(r.ok, false);
      if (!r.ok) assert.match(r.raison, /Taille inattendue/);
    });
  }));

test("LE QR NE CASSE JAMAIS LA PAGE DE PAIEMENT", () => avecDossier(async ({ qr }) => {
  // Un QR absent doit laisser le numéro à saisir à la main, pas faire tomber
  // l'écran où le client est venu payer.
  for (const nom of [undefined, "absent.png", "../evasion.png", ""]) {
    await avecNom(nom, async () => {
      const r = await qr.lireQr();
      assert.equal(typeof r, "object");
      assert.equal(r.ok, false);
      if (!r.ok) assert.ok(r.raison.length > 10);
    });
  }
}));

test("le canal Flouci annonce le QR seulement s’il existe", () =>
  avecDossier(async ({ ecrire }) => {
    const avantTel = process.env.PAIEMENT_FLOUCI_TELEPHONE;
    // Un numéro d'essai, jamais un vrai : une donnée personnelle recopiée
    // dans un fichier de test entre dans l'historique Git et n'en sort plus.
    process.env.PAIEMENT_FLOUCI_TELEPHONE = "20000000";
    try {
      await avecNom(undefined, () => {
        const flouci = canaux().find((c) => c.id === "flouci");
        assert.ok(flouci);
        assert.equal(flouci?.qr, undefined);
        assert.match(flouci?.aide ?? "", /saisissez/, "sans QR, on explique la saisie");
      });

      await ecrire("qr-flouci.png", PNG);
      await avecNom("qr-flouci.png", () => {
        const flouci = canaux().find((c) => c.id === "flouci");
        assert.equal(flouci?.qr, "/api/paiement/qr");
        assert.match(flouci?.aide ?? "", /Scanner/, "avec QR, on explique le scan");
        // Le numéro reste affiché : tous les clients ne sont pas sur téléphone,
        // et une caméra peut refuser de coopérer.
        assert.ok(flouci?.lignes.some((l) => l.valeur === "20000000"));
      });
    } finally {
      if (avantTel === undefined) delete process.env.PAIEMENT_FLOUCI_TELEPHONE;
      else process.env.PAIEMENT_FLOUCI_TELEPHONE = avantTel;
    }
  }));
