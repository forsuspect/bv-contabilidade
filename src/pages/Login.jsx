import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, User, Loader2, ArrowRight, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import styles from './Login.module.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForgotMessage, setShowForgotMessage] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => { document.body.style.overflowX = 'auto'; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const features = [
    "Gestão centralizada de todas as empresas",
    "Relatórios detalhados e guias exportáveis",
    "Ambiente 100% seguro e criptografado",
    "Sistema ágil e detalhado para facilitar o trabalho diário!"
  ];

  return (
    <div className={styles.container}>
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.logoText}>BV<span>Contabilidade</span></div>
          
          <div className={styles.headerText}>
            <h1 className={styles.title}>Bem-vindo de volta</h1>
            <p className={styles.subtitle}>Insira suas credenciais para acessar a plataforma.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Usuário</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.icon} />
                <input id="username" type="text" value={username}
                  onChange={(e) => setUsername(e.target.value)} placeholder="ex: admin" required />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Senha</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.icon} />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.forgotPasswordWrapper}>
              <button type="button" className={styles.forgotPassword} onClick={() => setShowForgotMessage(true)}>
                Esqueceu a senha?
              </button>
            </div>

            {showForgotMessage && (
              <div className={styles.forgotCard}>
                <div className={styles.forgotHeader}>
                  <div className={styles.forgotTitle}><Lock size={16} /> Recuperação de Acesso</div>
                  <button type="button" onClick={() => setShowForgotMessage(false)}><X size={16} /></button>
                </div>
                <p className={styles.forgotText}>
                  Para sua segurança, a redefinição de senha deve ser solicitada diretamente aos <strong>Administradores</strong> da BV Contabilidade ou à equipe de suporte da <strong>Automize</strong>.
                </p>
              </div>
            )}

            {error && (
              <div className={styles.error}>
                <AlertTriangle size={20} className={styles.errorIcon} />
                <div className={styles.errorText}>{error}</div>
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className={styles.spinner} /> : <><span>Entrar na plataforma</span><ArrowRight size={18} /></>}
            </button>
          </form>

          <p className={styles.footerText}>
            &copy; 2026 BV Contabilidade. Todos os direitos reservados.<br />
            Desenvolvido por <a href="https://automize-xi.vercel.app/index.html" target="_blank" rel="noopener noreferrer" className={styles.agencyLink}>Automize</a>
          </p>
        </div>
      </div>

      <div className={styles.visualSection}>
        <div className={styles.visualOverlay}></div>
        <div className={styles.visualContent}>
          <div>
            <h2 className={styles.visualTitle}>Transforme a gestão<br/>da sua contabilidade.</h2>
            <p className={styles.visualSubtitle}>
              O SaaS definitivo projetado para escritórios contábeis modernos, proporcionando agilidade, segurança e inteligência na tomada de decisão.
            </p>
            <ul className={styles.featureList}>
              {features.map((feature, index) => (
                <li key={index}>
                  <CheckCircle2 size={20} className={styles.featureIcon} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
