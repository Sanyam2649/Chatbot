'use client';
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, MessageCircle, Sparkles, Zap, Brain, Shield, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import LoadingPage from "./component/loadingPage";

const HomePage = () => {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [mounted, setMounted] = useState(false);
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const constraintsRef = useRef(null);
  
  // Fix: Only run after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavigate = () => {
    if (!isSignedIn) {
      router.push('/sign-in');
    } else {
      router.push('/home');
    }
  }

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Advanced AI",
      description: "Powered by cutting-edge language models for intelligent conversations"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Instant responses with real-time processing capabilities"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Your conversations are encrypted and never stored"
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Multi-Purpose",
      description: "From creative writing to technical assistance, we've got you covered"
    }
  ];

  const animatedTexts = [
    "Your Intelligent AI Assistant",
    "Conversations That Matter",
    "Powered by Advanced AI",
    "Ready to Help You Succeed"
  ];

  useEffect(() => {
    const animation = animate(count, 100, { duration: 2.5 });
    return animation.stop;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Show loading until mounted and Clerk is loaded
  if (!isLoaded || !mounted) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] overflow-hidden relative">
      {/* OPTIMIZED Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Reduced number of animated elements */}
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12, // Slower animation = less GPU usage
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
        
        {/* Simplified grid pattern - use CSS instead of background-image */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] bg-[size:80px_80px]" />
        
        {/* Reduced particles from 30 to 8 */}
        {mounted && [...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              scale: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              y: [null, -80, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Main Content - Lazy load heavy sections */}
      <div className="relative z-10 container mx-auto px-4">
        {/* Navigation */}
        <motion.nav
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center py-6" // Reduced padding
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-white text-lg font-bold">AI<span className="text-cyan-400">Chat</span></span>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNavigate}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:from-purple-700 hover:to-cyan-700 transition-all duration-300"
          >
            Get Started
          </motion.button>
        </motion.nav>

        {/* Hero Section - Reduced animations */}
        <div className="flex flex-col items-center text-center pt-16 pb-24">
          {/* Animated Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full mb-6"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="text-white text-xs">Next Generation AI Assistant</span>
          </motion.div>

          {/* Simplified Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-4"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AI Chat
            </span>
          </motion.h1>

          {/* Optimized Animated Subheading */}
          <div className="h-16 mb-6">
            <motion.p
              key={currentFeature}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-xl md:text-3xl text-white/80 font-light"
            >
              {animatedTexts[currentFeature]}
            </motion.p>
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-white/60 max-w-2xl mb-8 leading-relaxed"
          >
            Experience the future of conversation with our advanced AI chatbot. 
            Get instant, intelligent responses for any query.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNavigate}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium text-base hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 flex items-center space-x-2 shadow-lg"
            >
              <span>Start Chatting</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Stats - Simplified */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl"
          >
            {[
              { value: "10M+", label: "Conversations" },
              { value: "99.9%", label: "Uptime" },
              { value: "50+", label: "Languages" },
              { value: "24/7", label: "Available" }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-white/60 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Features Section - Lazy loaded */}
        <LazyFeatures features={features} />

        {/* Final CTA - Conditionally rendered */}
        {!user && <LazyCTA />}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center">
        <div className="text-white/40 text-sm">
          © 2024 AI Chat. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

// Lazy loaded components to improve initial render
const LazyFeatures = ({ features }) => (
  <motion.section
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true }}
    className="py-16"
  >
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-3xl md:text-4xl font-bold text-center text-white mb-4"
    >
      Why Choose <span className="text-cyan-400">AI Chat</span>?
    </motion.h2>
    
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
          whileHover={{ y: -5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3 text-white">
            {feature.icon}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
          <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

const LazyCTA = () => (
  <motion.section
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    className="py-16 text-center"
  >
    <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
        Ready to Transform Your <span className="text-cyan-400">Conversations</span>?
      </h2>
      <p className="text-white/60 mb-6">
        Join thousands of users experiencing AI-powered conversations.
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => window.location.href = "/sign-up"}
        className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-cyan-700 transition-all duration-300"
      >
        Get Started Free
      </motion.button>
    </div>
  </motion.section>
);

export default HomePage;