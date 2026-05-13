import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, User, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Login.module.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    };
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
    "Sistema agil e detalhado para facilitar o trabalho diario!"
  ];

  return (
    <div className={styles.container}>
      {/* Left Side - Form */}
      <div className={styles.formSection}>
        <motion.div 
          className={styles.formContainer}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className={styles.logoText}>
            BV<span>Contabilidade</span>
          </div>
          
          <div className={styles.headerText}>
            <h1 className={styles.title}>Bem-vindo de volta</h1>
            <p className={styles.subtitle}>Insira suas credenciais para acessar a plataforma.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Usuário</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.icon} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: admin"
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.passwordHeader}>
                <label htmlFor="password">Senha</label>
                <a href="#" className={styles.forgotPassword} onClick={() => alert('Entre em contato com os donos ou desenvolvedores do projeto para recuperar sua senha.')}>Esqueceu a senha?</a>
              </div>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.icon} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                className={styles.error}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isSubmitting ? (
                <Loader2 className={styles.spinner} />
              ) : (
                <>
                  Entrar na plataforma
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>
          {/* Build trigger comment: ensure all login messages are updated */}

          <p className={styles.footerText}>
            &copy; 2026 BV Contabilidade. Todos os direitos reservados.<br />
            Desenvolvido por <a href="https://automize-xi.vercel.app/index.html" target="_blank" rel="noopener noreferrer" className={styles.agencyLink}>Automize</a>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Visual */}
      <div className={styles.visualSection}>
        <div className={styles.visualOverlay}></div>
        <div className={styles.visualContent}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h2 className={styles.visualTitle}>Transforme a gestão<br/>da sua contabilidade.</h2>
            <p className={styles.visualSubtitle}>
              O SaaS definitivo projetado para escritórios contábeis modernos, proporcionando agilidade, segurança e inteligência na tomada de decisão.
            </p>
            
            <ul className={styles.featureList}>
              {features.map((feature, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1) }}
                >
                  <CheckCircle2 size={20} className={styles.featureIcon} />
                  <span>{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
