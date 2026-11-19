import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import ordreService from '../src/api/ordreService.js';

describe('Vérification du moteur d\'agrégation des matières premières (FCTR-38)', () => {
  test('Exemple d\'agrégation officiel : 10 × Produit A (2 kg X) et 5 × Produit B (3 kg X + 1 kg Y) => 35 kg X et 5 kg Y', () => {
    // Mock Catalog Products
    const productA = { _id: 'prod-A', reference: 'PR-A', nom: 'Produit A' };
    const productB = { _id: 'prod-B', reference: 'PR-B', nom: 'Produit B' };

    // Mock Raw Materials
    const materialX = { _id: 'mat-X', reference: 'RM-X', nom: 'Matière X', unite: 'kg', seuilAlerte: 20 };
    const materialY = { _id: 'mat-Y', reference: 'RM-Y', nom: 'Matière Y', unite: 'kg', seuilAlerte: 5 };

    // Product A composition: 2 kg of X (and 0 of Y)
    // Product B composition: 3 kg of X + 1 kg of Y
    const compositionsMap = {
      'prod-A': [
        { matiere: materialX, quantiteUnitaire: 2 },
      ],
      'prod-B': [
        { matiere: materialX, quantiteUnitaire: 3 },
        { matiere: materialY, quantiteUnitaire: 1 },
      ],
    };

    // Order items: 10 of Product A, 5 of Product B
    const items = [
      { produitId: 'prod-A', quantite: 10 },
      { produitId: 'prod-B', quantite: 5 },
    ];

    const results = ordreService.calculateAggregatedRequirements(items, compositionsMap);

    // Assertions
    const reqX = results.find((r) => r.matiereId === 'mat-X');
    const reqY = results.find((r) => r.matiereId === 'mat-Y');

    assert.ok(reqX, 'Matière X doit être présente dans les exigences calculées');
    assert.ok(reqY, 'Matière Y doit être présente dans les exigences calculées');

    // 10 * 2 kg + 5 * 3 kg = 20 + 15 = 35 kg
    assert.equal(reqX.quantiteTotale, 35, 'Le besoin total pour Matière X doit être exactement de 35 kg');
    assert.equal(reqX.unite, 'kg');

    // 5 * 1 kg = 5 kg
    assert.equal(reqY.quantiteTotale, 5, 'Le besoin total pour Matière Y doit être exactement de 5 kg');
    assert.equal(reqY.unite, 'kg');
  });

  test('Gère les ordres avec un seul produit sans régression', () => {
    const materialSteel = { _id: 'mat-steel', reference: 'RM-STEEL', nom: 'Acier', unite: 'kg', seuilAlerte: 10 };
    const compositionsMap = {
      'prod-frame': [
        { matiere: materialSteel, quantiteUnitaire: 4 },
      ],
    };

    const items = [{ produitId: 'prod-frame', quantite: 8 }];
    const results = ordreService.calculateAggregatedRequirements(items, compositionsMap);

    assert.equal(results.length, 1);
    assert.equal(results[0].quantiteTotale, 32); // 8 * 4 = 32 kg
  });

  test('Ignore les lignes avec quantité 0 ou produit manquant', () => {
    const materialWood = { _id: 'mat-wood', nom: 'Bois', unite: 'unite' };
    const compositionsMap = {
      'prod-chair': [{ matiere: materialWood, quantiteUnitaire: 5 }],
    };

    const items = [
      { produitId: 'prod-chair', quantite: 0 },
      { produitId: '', quantite: 10 },
    ];
    const results = ordreService.calculateAggregatedRequirements(items, compositionsMap);

    assert.equal(results.length, 0);
  });
});
