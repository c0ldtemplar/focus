import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Login as LoginComponent } from '../components/Auth/Login';
import { Signup as SignupComponent } from '../components/Auth/Signup';

const LoginPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Ruta a redirigir después del login (por defecto dashboard)
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirigir automáticamente si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const toggleMode = () => setIsLoginMode(!isLoginMode);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Back button */}
      <div className="p-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Volver al inicio</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-black">F</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">
              {isLoginMode ? 'Bienvenido de vuelta' : 'Crear cuenta'}
            </h1>
            <p className="text-zinc-400 mt-2">
              {isLoginMode 
                ? 'Inicia sesión para acceder a tu radar personal de eventos'
                : 'Únete a FOCO y descubre eventos que realmente te importan'
              }
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            {isLoginMode ? (
              <LoginComponent onSwitchToSignup={toggleMode} />
            ) : (
              <SignupComponent onSwitchToLogin={toggleMode} />
            )}
          </div>

          {/* Demo credentials hint */}
          {isLoginMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl"
            >
              <p className="text-xs text-zinc-500 text-center">
                <strong>Demo:</strong> test@focus.local / test123
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
