'use client';
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Home, MessageCircle, Sparkles, Bot } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const [randomX, setRandomX] = useState(0);
  const [randomY, setRandomY] = useState(0);

  useEffect(() => {
    setRandomX(Math.random() * 40 - 20);
    setRandomY(Math.random() * 40 - 20);
  }, []);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-xl"
          animate={{
            x: [0, -60, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex justify-between items-center py-6 px-4"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-2 cursor-pointer"
          onClick={handleGoHome}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-white text-lg font-bold">AI<span className="text-cyan-400">Chat</span></span>
        </motion.div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center min-h-[80vh]">
        {/* Animated 404 Number */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="relative mb-8"
        >
          <motion.div
            animate={{
              x: [0, randomX, 0],
              y: [0, randomY, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-[180px] md:text-[240px] font-bold leading-none"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              404
            </span>
          </motion.div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-white text-sm">Oops! Page Lost in Space</span>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoHome}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 flex items-center space-x-2 shadow-lg"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}