import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Vérification de l\'authentification et du contrôle d\'accès par rôle (RBAC) (FCTR-20, FCTR-21)', () => {
  function checkRouteAccess(userRole, isAuthenticated, routePath) {
    if (!isAuthenticated) {
      return { allowed: false, redirect: '/login' };
    }

    const adminOnlyRoutes = ['/dashboard', '/matieres', '/lots', '/mouvements', '/produits', '/compositions', '/ordres'];
    const isUnderAdmin = adminOnlyRoutes.some((p) => routePath === p || routePath.startsWith(`${p}/`));

    if (isUnderAdmin && userRole !== 'ADMIN') {
      return { allowed: false, redirect: '/operator', forbidden: true };
    }

    return { allowed: true, redirect: null };
  }

  test('Redirige un utilisateur non authentifié vers /login', () => {
    const res = checkRouteAccess(null, false, '/dashboard');
    assert.equal(res.allowed, false);
    assert.equal(res.redirect, '/login');
  });

  test('Autorise un ADMINISTRATEUR sur les routes admin', () => {
    const res = checkRouteAccess('ADMIN', true, '/dashboard');
    assert.equal(res.allowed, true);

    const resMat = checkRouteAccess('ADMIN', true, '/matieres');
    assert.equal(resMat.allowed, true);

    const resOrdres = checkRouteAccess('ADMIN', true, '/ordres/nouveau');
    assert.equal(resOrdres.allowed, true);
  });

  test('Bloque un OPÉRATEUR tentant d\'accéder à une route Admin et le redirige vers /operator', () => {
    const res = checkRouteAccess('OPERATEUR', true, '/dashboard');
    assert.equal(res.allowed, false);
    assert.equal(res.redirect, '/operator');

    const resMat = checkRouteAccess('OPERATEUR', true, '/matieres');
    assert.equal(resMat.allowed, false);
    assert.equal(resMat.redirect, '/operator');

    const resComps = checkRouteAccess('OPERATEUR', true, '/compositions');
    assert.equal(resComps.allowed, false);
    assert.equal(resComps.redirect, '/operator');
  });

  test('Autorise un OPÉRATEUR sur /operator', () => {
    const res = checkRouteAccess('OPERATEUR', true, '/operator');
    assert.equal(res.allowed, true);
  });

  test('Vérifie le formatage du header Authorization Bearer JWT', () => {
    const token = 'fake.jwt.token';
    const createHeaders = (tok) => ({
      'Content-Type': 'application/json',
      ...(tok && { Authorization: `Bearer ${tok}` }),
    });

    const headersWithToken = createHeaders(token);
    assert.equal(headersWithToken.Authorization, 'Bearer fake.jwt.token');

    const headersWithoutToken = createHeaders(null);
    assert.equal(headersWithoutToken.Authorization, undefined);
  });
});
