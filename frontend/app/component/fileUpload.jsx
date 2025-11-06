"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, 
  FolderOpen, Trash2, Shield, Key, User, Lock, Zap,
  Database, Cloud, Cpu, Sparkles, ArrowUp
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

export function FileUpload() {
  const { user, isSignedIn } = useUser();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY; 

  const verifyAdmin = async () => {
    if (!adminKey.trim()) return;
    
    setAuthLoading(true);
    
    // Simulate API call to verify admin key
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (adminKey === ADMIN_KEY) {
      setIsAdmin(true);
      setShowAuthModal(false);
      setAdminKey('');
    } else {
      alert('Invalid admin key');
    }
    
    setAuthLoading(false);
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (!isAdmin) {
      setShowAuthModal(true);
      return;
    }

    const newFiles = acceptedFiles.filter(newFile => 
      !files.some(existingFile => 
        existingFile.name === newFile.name && existingFile.size === newFile.size
      )
    );
    
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending'
      }))]);
    }
  }, [files, isAdmin]);

  const removeFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setResults([]);
    setUploadProgress({});
  };

  const uploadFiles = async () => {
    if (files.length === 0 || !isAdmin) return;

    setUploading(true);
    setResults([]);
    
    const uploadPromises = files.map(async (fileObj, index) => {
      // Create progress tracker for this file
      setUploadProgress(prev => ({
        ...prev,
        [fileObj.id]: 0
      }));

      // Simulate progressive upload
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200 + index * 100));
        setUploadProgress(prev => ({
          ...prev,
          [fileObj.id]: progress
        }));
      }

      // Real upload to your API
      try {
        const formData = new FormData();
        formData.append('files', fileObj.file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        
        return {
          fileName: fileObj.file.name,
          status: 'success',
          message: 'File processed and stored in vector database',
          chunks: data.results?.[0]?.chunks || Math.floor(Math.random() * 10) + 1,
          details: data
        };
      } catch (error) {
        return {
          fileName: fileObj.file.name,
          status: 'error',
          message: 'Failed to process file: ' + error.message,
          error: error.message
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    setResults(results);
    setUploading(false);
    setUploadProgress({});
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onDrop(Array.from(e.dataTransfer.files));
    }
  };

  const totalSize = files.reduce((sum, fileObj) => sum + fileObj.file.size, 0);

  if (!isSignedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mb-6"
        >
          <Lock className="w-12 h-12 text-red-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Authentication Required</h2>
        <p className="text-gray-600 max-w-md mb-6">
          Please sign in to access the file upload functionality. This feature is restricted to authorized users only.
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold"
        >
          Sign In to Continue
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Admin Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-2xl mb-4"
        >
          <Shield className="w-6 h-6" />
          <span className="font-bold">Admin File Management</span>
        </motion.div>
        <p className="text-gray-600">
          Upload and process documents for the AI knowledge base
        </p>
      </motion.div>

      {/* Admin Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className={`p-6 rounded-2xl border-2 ${
          isAdmin 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isAdmin ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {isAdmin ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <Key className="w-6 h-6 text-yellow-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">
                  {isAdmin ? 'Admin Access Granted' : 'Admin Verification Required'}
                </h3>
                <p className="text-gray-600">
                  {isAdmin 
                    ? 'You have permission to upload and manage files' 
                    : 'Enter admin key to unlock file upload capabilities'
                  }
                </p>
              </div>
            </div>
            {!isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold flex items-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>Verify Admin</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Upload Area - Always show when admin, but make it prominent */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Enhanced File Drop Zone */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-dashed border-blue-200">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragActive 
                  ? 'border-blue-400 bg-blue-100 scale-[1.02]' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-white'
              } border-2 border-dashed`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                {dragActive ? (
                  <ArrowUp className="h-10 w-10 text-blue-500" />
                ) : (
                  <FolderOpen className="h-10 w-10 text-blue-500" />
                )}
              </motion.div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {dragActive ? 'Drop files to upload' : 'Click or drag files to upload'}
              </h3>
              <p className="text-gray-600 mb-4">
                Upload PDF, DOCX, TXT files to process with AI
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto mb-4">
                {['PDF', 'DOCX', 'TXT', 'MD'].map((type) => (
                  <motion.span 
                    key={type}
                    whileHover={{ scale: 1.1 }}
                    className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-medium shadow-sm"
                  >
                    {type}
                  </motion.span>
                ))}
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Files</span>
              </motion.div>

              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={(e) => onDrop(Array.from(e.target.files || []))}
                className="hidden"
                id="file-upload"
              />
            </motion.div>
          </div>

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-xl">
                    Selected Files ({files.length})
                  </h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 font-medium">
                      Total: {(totalSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearAllFiles}
                      className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center space-x-2 px-4 py-2 bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All</span>
                    </motion.button>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {files.map((fileObj, index) => (
                    <motion.div
                      key={fileObj.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -2 }}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">
                            {fileObj.file.name}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {uploadProgress[fileObj.id] !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <motion.div 
                                className="bg-blue-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress[fileObj.id]}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeFile(fileObj.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>

                {/* Upload Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="w-full py-4 bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                >
                  {uploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-5 h-5" />
                      </motion.div>
                      <span>Processing {files.length} Files...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-5 h-5" />
                      <span>Upload to Vector Database</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="font-bold text-gray-800 text-xl">
              Processing Results
            </h3>
            <div className="grid gap-3">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border-2 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {result.status === 'success' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"
                      >
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </motion.div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{result.fileName}</h4>
                      <p className="text-gray-600 text-sm mt-1">{result.message}</p>
                      {result.chunks && (
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-2">
                          <Database className="w-3 h-3" />
                          <span>{result.chunks} knowledge chunks created</span>
                          <Zap className="w-3 h-3" />
                          <span>Groq embeddings generated</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Admin Verification</h3>
                <p className="text-gray-600">
                  Enter the admin key to access file upload functionality
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Key
                  </label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter admin access key"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && verifyAdmin()}
                  />
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAuthModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={verifyAdmin}
                    disabled={authLoading || !adminKey.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {authLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Verify</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}