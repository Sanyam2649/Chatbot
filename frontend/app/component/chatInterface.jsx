
"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send,  Bot, Loader2, Copy, CheckCheck, Plus , X, Paperclip, Lightbulb } from 'lucide-react';
import { FileUpload } from './fileUpload';
import { useUser } from '@clerk/nextjs';

export function ChatInterface() {
  const {user} = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const [showModal , setShowModal] = useState(false);
  const [isDeepThinking , setIsDeepThinking] = useState(false);
  
  
  const handleShowModal = () => {
    setShowModal(!showModal);
  }
  
  const handleToggleDeepThinking = () => {
    setIsDeepThinking(!isDeepThinking);
  }  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  const userMessage = {
    id: Date.now(),
    content: input.trim(),
    role: 'user',
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: input.trim(),
      userId : user?.id,
      isDeepThinking : isDeepThinking
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Handle both response formats
  if (data.response) {
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      content: data.response,
      role: 'assistant',
      timestamp: new Date(),
      sources: data.sources || []
    }]);
  } else if (data.error) {
    throw new Error(data.error);
  } else {
    throw new Error('Invalid response format');
  }
  
} catch (error) {
  console.error('Chat error:', error);
  
  const errorMessage = {
    id: Date.now() + 2,
    content: 'Sorry, I encountered an error. Please try again.',
    role: 'assistant', 
    timestamp: new Date(),
    isError: true
  };
  
  setMessages(prev => [...prev, errorMessage]);
} finally {
  setIsLoading(false);
}
};

  const copyToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(content);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatMessage = (content) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  return (
    <>
     {showModal ? (<FileUpload onClose={handleShowModal}/>)
     :
    (  <div className="flex flex-col h-[600px] bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/60 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Assistant</h2>
            <p className="text-white/80 text-sm">Powered by advanced language model</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 overflow-y-auto">
        <AnimatePresence>
          { messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`relative group ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-2xl rounded-tr-md'
                        : message.isError
                        ? 'bg-red-50 border border-red-200 text-red-800 rounded-2xl rounded-tl-md'
                        : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-md'
                    } px-4 py-3 shadow-sm`}
                  >
                    {/* Copy Button */}
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:shadow-xl"
                      >
                        {copiedMessageId === message.content ? (
                          <CheckCheck className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-600" />
                        )}
                      </button>
                    )}

                    {/* Message Content */}
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: formatMessage(message.content) 
                      }} 
                    />

                    {/* Streaming Indicator */}
                    {message.isStreaming && (
                      <div className="flex space-x-1 mt-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
        
        {/* Loading Indicator */}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3 max-w-[80%]">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      {/* Input Form */}
      <div className="border-t border-gray-200/60 p-4 sm:p-6 bg-white/50">
  <form
    onSubmit={handleSubmit}
    className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 w-full"
  >
    {/* Input Container */}
    <div className="flex-1 relative bg-white border border-gray-200 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-purple-500/50 transition-all duration-200 w-full">
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Deep Thinking Button */}
        <button
          type="button"
          onClick={handleToggleDeepThinking}
          disabled={input.length > 500}
          className={`p-2 rounded-lg transition-all flex items-center justify-center shrink-0 ${
            input.length > 500
              ? 'text-gray-300 cursor-not-allowed'
              : isDeepThinking
              ? 'text-purple-600 bg-purple-50 shadow-inner'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
          title={
            input.length > 500
              ? 'Too long for deep thinking mode'
              : isDeepThinking
              ? 'Deep Thinking enabled'
              : 'Enable Deep Thinking'
          }
        >
          <Lightbulb
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
              isDeepThinking ? 'scale-110' : 'scale-100'
            }`}
          />
        </button>

        {/* Input + Counter */}
        <div className="flex flex-col flex-1 min-w-0">
          <textarea
            value={input}
            onChange={(e) => {
              const value = e.target.value;
              const limit = isDeepThinking ? 500 : 1000;
              if (value.length <= limit) setInput(value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={1}
            className="w-full bg-transparent border-none focus:outline-none resize-none text-gray-800 placeholder:text-gray-400 disabled:opacity-50 text-sm sm:text-base"
          />

          {/* Character Counter */}
          <div className="flex justify-end mt-1">
            <span
              className={`text-[10px] sm:text-xs ${
                input.length > (isDeepThinking ? 500 * 0.9 : 1000 * 0.9)
                  ? 'text-red-500'
                  : 'text-gray-400'
              }`}
            >
              {input.length}/{isDeepThinking ? 500 : 1000}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* File & Send Buttons */}
    <div className="flex items-center justify-between sm:justify-end gap-3">
      {!showModal && (
        <button
          type="button"
          onClick={handleShowModal}
          className="p-2 sm:p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <Paperclip className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
        </button>
      )}

      <motion.button
        type="submit"
        disabled={!input.trim() || isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.05 }}
        whileTap={{ scale: isLoading ? 1 : 0.95 }}
        className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 w-full sm:w-auto"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        <span>Send</span>
      </motion.button>
    </div>
  </form>
</div>
    </div>)}
    </>
  );
}