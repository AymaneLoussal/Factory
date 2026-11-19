import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import * as router from 'react-router-dom';

// Vite loads the application's actual JSX and router dependencies in Node.
const vite = await createServer({ configFile: false, server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
after(async () => { await vite.close(); });
const { AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx');
const { default: AdminLayout } = await vite.ssrLoadModule('/src/components/layout/AdminLayout.jsx');
const { default: ProtectedRoute } = await vite.ssrLoadModule('/src/components/common/ProtectedRoute.jsx');
const h = React.createElement;
function render(element, auth, path = '/dashboard') {
  // React Router uses layout effects for client navigation; SSR cannot run them.
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].startsWith('Warning: useLayoutEffect does nothing on the server')) return;
    originalError(...args);
  };
  try {
    return renderToStaticMarkup(h(AuthContext.Provider, { value: auth },
      h(router.MemoryRouter, { initialEntries: [path], future: { v7_startTransition: true, v7_relativeSplatPath: true } }, element)));
  } finally { console.error = originalError; }
}
const admin = { isAuthenticated: true, role: 'ADMIN', isLoading: false, user: { nom: 'Test Admin', role: 'ADMIN' }, logout() {} };

test('AdminLayout renders real navigation, active link, nested outlet and mobile menu', () => {
  const view = h(router.Routes, null, h(router.Route, { element: h(AdminLayout) },
    h(router.Route, { path: '/matieres', element: h('div', null, 'Nested materials content') })));
  const html = render(view, admin, '/matieres');
  assert.match(html, /Nested materials content/);
  assert.match(html, /href="\/matieres"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/matieres"/);
  assert.match(html, /aria-label="Ouvrir le menu"/);
  assert.doesNotMatch(html, /class="icon-button mobile-menu"[^>]*style="[^"]*display:\s*none/);
  for (const path of ['/dashboard', '/lots', '/produits', '/compositions', '/ordres']) assert.ok(html.includes(`href="${path}"`), path);
});

test('ProtectedRoute renders its actual child for admin and hides it while loading', () => {
  const view = h(ProtectedRoute, { allowedRoles: ['ADMIN'] }, h('p', null, 'Protected content'));
  assert.match(render(view, admin), /Protected content/);
  const loading = render(view, { ...admin, isLoading: true });
  assert.doesNotMatch(loading, /Protected content/);
  assert.match(loading, /Chargement de la session/);
});

test('ProtectedRoute does not render an admin child to an operator or anonymous visitor', () => {
  const view = h(ProtectedRoute, { allowedRoles: ['ADMIN'] }, h('p', null, 'Protected content'));
  assert.doesNotMatch(render(view, { ...admin, role: 'OPERATEUR' }), /Protected content/);
  assert.doesNotMatch(render(view, { ...admin, isAuthenticated: false, role: null }), /Protected content/);
});
