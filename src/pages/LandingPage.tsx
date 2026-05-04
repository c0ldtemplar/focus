import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Heart, Settings, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Si ya hay usuario autenticado, redirigir al dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/20">
              <Sparkles size={48} className="text-white" />
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6">
              FOCO
              <span className="block text-zinc-500 text-4xl md:text-5xl font-normal tracking-wider mt-2">
                FILTRO PRIORITARIO
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Descubre eventos auténticos en tu área. Nuestro scout local filtra el ruido 
              y te muestra solo lo que realmente te importa, basado en tus intereses.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/login"
                className="group bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center gap-2"
              >
                Comenzar
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/login?mode=signup"
                className="text-zinc-400 hover:text-zinc-100 px-8 py-4 rounded-full font-bold text-lg transition-colors border border-zinc-800 hover:border-zinc-600"
              >
                Crear cuenta
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-12 text-center">
            ¿Cómo funciona?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
            >
              <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
                <Settings size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Personaliza</h3>
              <p className="text-zinc-400">
                Selecciona tus intereses: gastronomía, música, arte, tecnología y más.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
            >
              <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
                <MapPin size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Explora</h3>
              <p className="text-zinc-400">
                Obtén eventos locales dentro de tu radio de proximidad configurable.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
            >
              <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
                <Heart size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Disfruta</h3>
              <p className="text-zinc-400">
                Guarda favoritos, comparte eventos y nunca te pierdas algo increíble.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 text-center text-zinc-600 text-sm">
          <p>© 2026 FOCO • RED DE PROXIMIDAD REAL</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
