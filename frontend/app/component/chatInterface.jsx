
"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send,  Bot, Loader2, Copy, CheckCheck, Plus , X } from 'lucide-react';
import { FileUpload } from './fileUpload';
// import { FileUpload } from './fileUpload';

export function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const [showModal , setShowModal] = useState(false);
  
  
  const handleShowModal = () => {
    setShowModal(!showModal);
  }
  
  console.log(showModal);
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
      history: messages.slice(-10)
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
    <div className="flex flex-col h-[600px] bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/60 overflow-hidden">
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
      
       {showModal && <FileUpload onClose={handleShowModal}/>}
    
      {/* Input Form */}
      <div className="border-t border-gray-200/60 p-6 bg-white/50">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          {!showModal ? <Plus className='w-6 h-6 justify-center items-center mt-3' onClick={handleShowModal}/> : <X className='w-6 h-6 justify-center items-center mt-3' onClick={handleShowModal}/>}
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Send</span>
          </motion.button>
        </form>
      </div>
    </div>
  );
}