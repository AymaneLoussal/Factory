import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Icon from '../components/common/Icon';
import Notice from '../components/common/Notice';

export default function Login() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || (isAdmin ? '/dashboard' : '/operator');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await login({ email: email.trim(), password });
      const target = data.user.role === 'ADMIN' ? '/dashboard' : '/operator';
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.friendlyMessage || 'Identifiants invalides. Veuillez vérifier vos accès.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Aside visual brand story */}
      <aside className="auth-aside">
        <div className="brand" style={{ color: 'white' }}>
          <span className="brandmark">
            <Icon name="factory" size={24} />
          </span>
          FactoryFlow
        </div>

        <div className="auth-story">
          <div className="overline" style={{ color: '#93c5fd', marginBottom: 24 }}>
            PRÉCISION À CHAQUE ÉTAPE
          </div>
          <h1>
            La production,<br />en parfaite synchronisation.
          </h1>
          <p>
            Un espace unifié pour vos matières premières, vos équipes et chaque ordre de fabrication en atelier.
          </p>

          <div className="auth-diagram">
            <div className="overline">DE LA MATIÈRE PREMIÈRE AU PRODUIT FINI</div>
            <div className="stages">
              <div className="stage">
                <span>
                  <Icon name="layers" size={20} />
                </span>
                Matières
              </div>
              <Icon name="arrow" size={16} />
              <div className="stage">
                <span>
                  <Icon name="clipboard" size={20} />
                </span>
                Production
              </div>
              <Icon name="arrow" size={16} />
              <div className="stage">
                <span>
                  <Icon name="box" size={20} />
                </span>
                Produits
              </div>
            </div>
          </div>
        </div>

        <footer>
          <span>YouCode Safi · MERN Sprint 3</span>
          <span>FactoryFlow © 2026</span>
        </footer>
      </aside>

      {/* Main Login Form */}
      <main className="auth-main" id="main">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="overline">BIENVENUE SUR FACTORYFLOW</div>
          <h1>Connexion</h1>
          <p>Saisissez vos identifiants pour accéder à votre espace de travail.</p>

          {error && (
            <Notice
              tone="error"
              title="Échec de connexion"
              message={error}
              className="section-gap"
            />
          )}

          <div className="field">
            <label htmlFor="email">
              Adresse email <span className="required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: admin@factoryflow.local"
              required
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div className="field">
            <label htmlFor="password">
              Mot de passe <span className="required">*</span>
            </label>
            <div className="password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <Icon name="eye" size={18} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn primary full"
            disabled={isLoading}
            style={{ marginTop: 16 }}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Connexion en cours...
              </>
            ) : (
              <>
                Se connecter
                <Icon name="arrow" size={16} />
              </>
            )}
          </button>

          <div className="auth-foot">
            Premier démarrage du système ?{' '}
            <Link to="/setup-admin">Initialiser l'administrateur</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
