import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Icon from '../components/common/Icon';
import Notice from '../components/common/Notice';
import authService from '../api/authService';

export default function SetupAdmin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [nom, setNom] = useState('Administrateur');
  const [email, setEmail] = useState('admin@factoryflow.local');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nom.trim()) {
      setError('Le nom complet est obligatoire.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('La confirmation ne correspond pas au mot de passe.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.setupInitialAdmin({
          nom: nom.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
      setSuccess('Compte administrateur créé avec succès ! Connexion en cours...');

      // Auto login with new credentials
      await login({ email: email.trim().toLowerCase(), password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.friendlyMessage ||
          'Impossible d\'initialiser le compte. Si le compte existe déjà, veuillez vous connecter directement.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <div className="brand" style={{ color: 'white' }}>
          <span className="brandmark">
            <Icon name="factory" size={24} />
          </span>
          FactoryFlow
        </div>

        <div className="auth-story">
          <div className="overline" style={{ color: '#93c5fd', marginBottom: 24 }}>
            INSTALLATION DU SYSTÈME
          </div>
          <h1>
            Configuration<br />de votre usine.
          </h1>
          <p>
            Créez le compte Administrateur principal pour déverrouiller l'accès complet à la gestion industrielle.
          </p>
          <div className="plant" style={{ maxWidth: 360, marginTop: 40, background: '#162033' }}>
            <span className="dot"></span>
            <strong>Mode Initialisation</strong>
            <p>Le premier administrateur disposera des pleins pouvoirs de gestion et de configuration.</p>
          </div>
        </div>

        <footer>
          <span>YouCode Safi · MERN Sprint 3</span>
          <span>FactoryFlow © 2026</span>
        </footer>
      </aside>

      <main className="auth-main">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="overline">INSTALLATION DE L'ESPACE DE TRAVAIL</div>
          <h1>Initialiser l'Admin</h1>
          <p>Renseignez les détails du compte Administrateur principal.</p>

          {error && <Notice tone="error" title="Erreur d'initialisation" message={error} />}
          {success && <Notice tone="success" title="Succès" message={success} />}

          <div className="field">
            <label htmlFor="nom">
              Nom complet <span className="required">*</span>
            </label>
            <input
              id="nom"
              name="nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex: Administrateur Principal"
              required
              disabled={isLoading}
            />
          </div>

          <div className="field">
            <label htmlFor="email">
              Email professionnel <span className="required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: admin@factoryflow.local"
              required
              disabled={isLoading}
            />
          </div>

          <div className="field">
            <label htmlFor="password">
              Mot de passe (min 6 caractères) <span className="required">*</span>
            </label>
            <div className="password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                <Icon name="eye" size={18} />
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">
              Confirmer le mot de passe <span className="required">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <Notice
            tone="info"
            title="Initialisation unique"
            message="Si le script scripts/seed-admin.js a déjà été exécuté sur le backend, vous pouvez vous connecter directement."
          />

          <button
            type="submit"
            className="btn primary full"
            disabled={isLoading}
            style={{ marginTop: 16 }}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Création et connexion...
              </>
            ) : (
              <>
                Créer l'administrateur
                <Icon name="arrow" size={16} />
              </>
            )}
          </button>

          <div className="auth-foot">
            Déjà configuré ? <Link to="/login">Retourner à la connexion</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
