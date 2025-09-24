import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Button } from './common/CustomButton';
import { Input } from './common/CustomInput';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'sent' | 'received';
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadProviderName: string;
  loadId: string;
  onSendMessage: (message: string) => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  loadProviderName,
  loadId,
  onSendMessage
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'provider',
      senderName: loadProviderName,
      content: 'Hello! Thank you for your interest in this load. Please let me know if you have any questions.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'received'
    }
  ]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      senderName: 'You',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'sent'
    };

    setMessages(prev => [...prev, message]);
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Chat with {loadProviderName}</h3>
              <p className="text-sm text-slate-600">Load ID: {loadId.slice(0, 8)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.type === 'sent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <UserIcon className="h-4 w-4 opacity-70" />
                    <span className="text-xs font-medium opacity-70">
                      {message.senderName}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-2 opacity-70`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-slate-200">
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                rows={2}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="self-end"
              icon={<PaperAirplaneIcon className="h-4 w-4" />}
            >
              Send
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};