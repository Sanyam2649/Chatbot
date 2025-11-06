// app/page.js
"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { 
  Brain, Upload, MessageCircle, BarChart3, FileText, 
  Users, Zap, Shield, Settings, Search, Bell, 
  FolderOpen, Database, Cpu, Sparkles, ChevronRight,
  Home, Bot, FileStack, LineChart
} from "lucide-react";
import { ChatInterface } from "../component/chatInterface";
import { FileUpload } from "../component/fileUpload";
import LoadingPage from "../component/loadingPage";

export default function Dashboard() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [authState, setAuthState] = useState('checking');
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/70 mb-8 text-lg"
          >
            Please sign in to access your AI workspace
          </motion.p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
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
                  AI-CHAT
                </h1>
              </div>
            </div>

            {/* Search Bar */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 max-w-2xl mx-8"
            >
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search conversations, files, or ask AI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100/80 border-0 rounded-2xl focus:ring-2 focus:ring-purple-500/50 focus:bg-white transition-all duration-300"
                />
              </div>
            </motion.div>

            {/* User Menu */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-4"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>
              
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
            </motion.div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Enhanced Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-80'}`}
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/60 overflow-hidden">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-gray-200/60">
                <div className="flex items-center justify-between">
                  {!sidebarCollapsed && (
                    <motion.h3 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-semibold text-gray-900 text-lg"
                    >
                      Navigation
                    </motion.h3>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                  </motion.button>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="p-4 space-y-2">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-200 group ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 shadow-lg shadow-blue-500/10'
                        : 'text-gray-600 hover:bg-gray-50/80 hover:shadow-lg'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    {!sidebarCollapsed && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 text-left"
                      >
                        <p className="font-semibold text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </nav>

              {/* Recent Files Section */}
              {!sidebarCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 border-t border-gray-200/60"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Recent Files</h3>
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Research Paper.pdf', date: '2 hours ago', icon: FileText },
                      { name: 'Financial Report.xlsx', date: 'Yesterday', icon: BarChart3 },
                      { name: 'Project Docs.zip', date: '3 days ago', icon: FolderOpen },
                    ].map((file, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ x: 5, backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                        className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/50 cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border">
                          <file.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.date}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick Stats */}
            {!sidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-6 text-white shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <Cpu className="w-8 h-8 text-white/80" />
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <h4 className="font-bold text-lg mb-2">AI Usage</h4>
                <p className="text-white/80 text-sm mb-4">23 conversations this week</p>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full w-3/4"></div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Main Content Area */}
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
                {activeTab === 'upload' && <FileUpload />}
                {activeTab === 'analytics' && (
                  <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/60 p-8 h-96 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                      <p className="text-gray-600">Coming soon with detailed insights and metrics</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}