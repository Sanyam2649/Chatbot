// app/page.js
"use client";

import { useUser, useAuth, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { 
  Brain, Upload, MessageCircle, BarChart3, FileText, 
  Users, Zap, Shield, Settings, Search, Bell, 
  FolderOpen, Database, Cpu, Sparkles, ChevronRight,
  Home, Bot, FileStack, LineChart,
  LogOut
} from "lucide-react";
import { ChatInterface } from "../component/chatInterface";
import LoadingPage from "../component/loadingPage";

export default function Dashboard() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [authState, setAuthState] = useState('checking');
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);
  
    const handleLogout = async () => {
    await signOut();
     window.location.href = "/sign-in";
  };

  // Enhanced authentication state handling
  useEffect(() => {
    const checkAuthState = async () => {
      if (!isLoaded) {
        setAuthState('loading');
        return;
      }

      if (isSignedIn) {
        try {
          await getToken();
          setAuthState('authenticated');
        } catch (error) {
          console.error("Token error:", error);
          setAuthState('error');
        }
      } else {
        setAuthState('unauthenticated');
      }
    };

    checkAuthState();
  }, [isLoaded, isSignedIn, user, getToken]);

  // Navigation items with improved structure
  const navItems = [
    { id: 'chat', label: 'AI Assistant', icon: Bot, description: 'Chat with AI', color: 'from-blue-500 to-cyan-500' },
    { id: 'upload', label: 'File Upload', icon: FileStack, description: 'Upload documents', color: 'from-green-500 to-emerald-500' },
  ];

  // Show loading state
  if (!isLoaded || authState === 'loading' || !mounted) {
    return <LoadingPage />;
  }

  // Show authentication required
  if (!isSignedIn || authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white p-8 max-w-md w-full"
        >
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-lg border border-red-500/30"
          >
            <Shield className="w-12 h-12 text-red-400" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
          >
            Welcome Back
          </motion.h2>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(192, 132, 252, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = "/sign-in"}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg w-full relative overflow-hidden group"
          >
            <span className="relative z-10">Sign In to Continue</span>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Show error state
  if (authState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white p-8 max-w-md w-full"
        >
          <div className="w-24 h-24 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-lg border border-yellow-500/30">
            <Zap className="w-12 h-12 text-yellow-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Authentication Issue</h2>
          <p className="text-white/70 mb-8">There was a problem with authentication. Please try again.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="bg-yellow-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-yellow-700 transition-all w-full"
          >
            Retry Connection
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 overflow-hidden">
      {/* Enhanced Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Brain className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  AI CHAT
                </h1>
              </div>
            </div>

            {/* User Menu */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-4"
            > 
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-3 bg-white/80 rounded-2xl p-2 border border-gray-200/60"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-gray-900 text-sm">{user.firstName} {user.lastName}</p>
                  <p className="text-gray-500 text-xs">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
              </motion.div>
              
               <LogOut onClick={handleLogout} className="color-gradient-to-br from-purple-600 to-blue-600"/>
            </motion.div>
          </div>
        </div>
      </motion.nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="flex-1 min-w-0"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {activeTab === 'chat' && <ChatInterface />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}