"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FolderOpen,
  Cloud,
  Loader2,
  Lock,
  AlertCircle,
  ArrowUp,
  X,
  CheckCircle,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export function FileUpload({ onClose }) {
  const { isSignedIn } = useUser();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const newFiles = acceptedFiles.filter(
        (newFile) =>
          !files.some(
            (existingFile) =>
              existingFile.name === newFile.name &&
              existingFile.size === newFile.size
          )
      );

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        setError(null);
        setSuccess(null);
      }
    },
    [files]
  );

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

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const file of files) {
        const formData = new FormData();
        formData.append("files", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // Set success or error message based on results
      if (errorCount === 0) {
        setSuccess(`Successfully uploaded all ${successCount} file${successCount > 1 ? 's' : ''}! Your documents are now being processed.`);
      } else if (successCount === 0) {
        setError(`Failed to upload all ${errorCount} file${errorCount > 1 ? 's' : ''}. Please check your connection and try again.`);
      } else {
        setSuccess(`Upload completed with ${successCount} successful and ${errorCount} failed upload${errorCount > 1 ? 's' : ''}.`);
      }

      // Reset files only if all uploads were successful
      if (errorCount === 0) {
        setFiles([]);
      }
    } catch (err) {
      setError(`Upload failed: Unable to connect to server. Please check your internet connection and try again.`);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setError(null);
    setSuccess(null);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setError(null);
    setSuccess(null);
  };

  if (!isSignedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center relative"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mb-6"
        >
          <Lock className="w-12 h-12 text-red-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Authentication Required
        </h2>
        <p className="text-gray-600 max-w-md mb-6">
          Please sign in to access the file upload functionality.
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
    <div className="max-w-4xl mx-auto p-6 space-y-6 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        {/* Simplified Drop Zone */}
        <motion.div
          whileHover={{ scale: files.length === 0 && !uploading ? 1.02 : 1 }}
          whileTap={{ scale: files.length === 0 && !uploading ? 0.98 : 1 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            if (!files.length && !uploading)
              document.getElementById("file-upload").click();
          }}
          className={`rounded-2xl p-10 text-center transition-all cursor-pointer border-2 border-dashed
            ${
              dragActive
                ? "border-blue-400 bg-blue-100 scale-[1.02]"
                : files.length > 0
                ? "border-green-300 bg-green-50 cursor-default"
                : "border-gray-300 hover:border-blue-400 hover:bg-white"
            } ${files.length === 0 && !uploading ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-blue-500 mx-auto mb-3 animate-spin" />
              <p className="text-gray-700 font-semibold">
                Uploading {files.length} file{files.length > 1 && "s"}...
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Please don&apos;t close this window while uploading
              </p>
            </>
          ) : files.length === 0 ? (
            <>
              {dragActive ? (
                <ArrowUp className="h-10 w-10 text-blue-500 mx-auto mb-3" />
              ) : (
                <FolderOpen className="h-10 w-10 text-blue-500 mx-auto mb-3" />
              )}
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Click or drag files to upload
              </h3>
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
            </>
          ) : (
            <>
              <Cloud className="h-10 w-10 text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-green-700 mb-4">
                Ready to upload {files.length} file{files.length > 1 && "s"}
              </h3>
              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={uploadFiles}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Now
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAllFiles}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold"
                >
                  Clear All
                </motion.button>
              </div>
            </>
          )}
        </motion.div>

        {/* File List */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h4 className="font-semibold text-gray-700">Selected Files:</h4>
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${file.size}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileIcon type={file.type} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{success}</p>
              <p className="text-sm text-green-600 mt-1">
                You can now close this window or upload more files.
              </p>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{error}</p>
              <p className="text-sm text-red-600 mt-1">
                Please try again or contact support if the problem persists.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Helper component for file type icons
function FileIcon({ type }) {
  const getIcon = () => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("text")) return "📃";
    return "📎";
  };

  return <span className="text-sm">{getIcon()}</span>;
}