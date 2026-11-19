import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Validation des règles métier industrielles (FCTR-27, FCTR-31, FCTR-33, FCTR-37)', () => {
  describe('Règle : Interdiction des doublons de matières dans une composition (FCTR-33)', () => {
    function validateComposition(rows) {
      if (!rows || rows.length === 0) return 'La composition doit comporter au moins une matière première.';
      const seen = new Set();
      for (const row of rows) {
        if (!row.matiereId) return 'Matière obligatoire.';
        if (seen.has(row.matiereId)) return 'Matière dupliquée détectée.';
        seen.add(row.matiereId);
        if (typeof row.quantiteUnitaire !== 'number' || row.quantiteUnitaire <= 0) {
          return 'Quantité strictement positive requise.';
        }
      }
      return null;
    }

    test('Rejette une composition avec une matière en doublon', () => {
      const rows = [
        { matiereId: 'mat-1', quantiteUnitaire: 2 },
        { matiereId: 'mat-1', quantiteUnitaire: 3 },
      ];
      assert.equal(validateComposition(rows), 'Matière dupliquée détectée.');
    });

    test('Rejette une composition avec quantité unitaire <= 0', () => {
      const rows = [{ matiereId: 'mat-1', quantiteUnitaire: 0 }];
      assert.equal(validateComposition(rows), 'Quantité strictement positive requise.');

      const rowsNeg = [{ matiereId: 'mat-1', quantiteUnitaire: -2 }];
      assert.equal(validateComposition(rowsNeg), 'Quantité strictement positive requise.');
    });

    test('Valide une composition conforme sans doublons avec quantités positives', () => {
      const rows = [
        { matiereId: 'mat-1', quantiteUnitaire: 2 },
        { matiereId: 'mat-2', quantiteUnitaire: 0.5 },
      ];
      assert.equal(validateComposition(rows), null);
    });
  });

  describe('Règle : Interdiction des doublons de produits dans un ordre de fabrication (FCTR-37)', () => {
    function validateOrderItems(items) {
      if (!items || items.length === 0) return 'Au moins un produit est requis.';
      const seen = new Set();
      for (const item of items) {
        if (!item.produitId) return 'Produit obligatoire.';
        if (seen.has(item.produitId)) return 'Produit dupliqué dans la commande.';
        seen.add(item.produitId);
        if (typeof item.quantite !== 'number' || item.quantite < 1 || !Number.isInteger(item.quantite)) {
          return 'La quantité doit être un entier >= 1.';
        }
      }
      return null;
    }

    test('Rejette un ordre avec un produit en double sur deux lignes', () => {
      const items = [
        { produitId: 'prod-A', quantite: 10 },
        { produitId: 'prod-A', quantite: 5 },
      ];
      assert.equal(validateOrderItems(items), 'Produit dupliqué dans la commande.');
    });

    test('Rejette un ordre avec une quantité décimale ou négative', () => {
      const itemsDec = [{ produitId: 'prod-A', quantite: 2.5 }];
      assert.equal(validateOrderItems(itemsDec), 'La quantité doit être un entier >= 1.');

      const itemsZero = [{ produitId: 'prod-A', quantite: 0 }];
      assert.equal(validateOrderItems(itemsZero), 'La quantité doit être un entier >= 1.');
    });

    test('Valide un ordre multi-produits conforme', () => {
      const items = [
        { produitId: 'prod-A', quantite: 10 },
        { produitId: 'prod-B', quantite: 5 },
      ];
      assert.equal(validateOrderItems(items), null);
    });
  });

  describe('Règle : Unicité des références', () => {
    test('Détecte une référence matière déjà existante', () => {
      const existing = ['RM-001', 'RM-002', 'RM-003'];
      const isRefUnique = (ref) => !existing.includes(ref.trim().toUpperCase());

      assert.equal(isRefUnique('RM-001'), false);
      assert.equal(isRefUnique('RM-004'), true);
    });

    test('Détecte une référence produit déjà existante', () => {
      const existing = ['PR-001', 'PR-002'];
      const isRefUnique = (ref) => !existing.includes(ref.trim().toUpperCase());

      assert.equal(isRefUnique('PR-001'), false);
      assert.equal(isRefUnique('PR-003'), true);
    });
  });
});
