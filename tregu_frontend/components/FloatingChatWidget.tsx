'use client';

import { useEffect, useState, useRef } from 'react';
import AnimatedAIAvatar from './AnimatedAIAvatar';

interface AICharacter {
  id: number;
  name: string;
  avatar_url?: string;
  personality: string;
  system_prompt?: string;
  is_active: boolean;
}

interface ChatMessage {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  created_at: string;
}

interface ChatConversation {
  id: number;
  user_id: number;
  character_id: number;
  title?: string;
  messages: ChatMessage[];
  character: AICharacter;
  created_at: string;
  updated_at?: string;
}

export default function FloatingChatWidget() {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<AICharacter | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCharacters = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/ai/characters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCharacters(data);
      } else {
        // Use mock data
        const mockCharacters: AICharacter[] = [
          {
            id: 1,
            name: 'Tregu Assistant',
            personality: 'A helpful and knowledgeable assistant for the Tregu platform.',
            system_prompt: 'You are Tregu Assistant, a helpful AI companion.',
            is_active: true
          },
          {
            id: 2,
            name: 'Commerce Expert',
            personality: 'An expert in business commerce and marketplace operations.',
            system_prompt: 'You are Commerce Expert, specializing in business operations.',
            is_active: true
          }
        ];
        setCharacters(mockCharacters);
      }
    } catch (err) {
      console.error('Failed to load characters:', err);
      const mockCharacters: AICharacter[] = [
        {
          id: 1,
          name: 'Tregu Assistant',
          personality: 'A helpful and knowledgeable assistant for the Tregu platform.',
          system_prompt: 'You are Tregu Assistant, a helpful AI companion.',
          is_active: true
        },
        {
          id: 2,
          name: 'Commerce Expert',
          personality: 'An expert in business commerce and marketplace operations.',
          system_prompt: 'You are Commerce Expert, specializing in business operations.',
          is_active: true
        }
      ];
      setCharacters(mockCharacters);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedCharacter) return;

    setLoading(true);
    const messageToSend = message;
    setMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageToSend,
          conversation_id: selectedConversation?.id,
          character_id: selectedCharacter.id
        })
      });

      if (res.ok) {
        const data = await res.json();

        if (!selectedConversation) {
          const newConversation: ChatConversation = {
            id: data.conversation_id,
            user_id: 0,
            character_id: selectedCharacter.id,
            title: `Chat with ${selectedCharacter.name}`,
            messages: [
              {
                id: Date.now(),
                conversation_id: data.conversation_id,
                role: 'user',
                content: messageToSend,
                created_at: new Date().toISOString()
              },
              {
                id: Date.now() + 1,
                conversation_id: data.conversation_id,
                role: 'assistant',
                content: data.reply,
                created_at: new Date().toISOString()
              }
            ],
            character: selectedCharacter,
            created_at: new Date().toISOString()
          };
          setSelectedConversation(newConversation);
        } else {
          setSelectedConversation(prev => prev ? {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: Date.now(),
                conversation_id: prev.id,
                role: 'user',
                content: messageToSend,
                created_at: new Date().toISOString()
              },
              {
                id: Date.now() + 1,
                conversation_id: prev.id,
                role: 'assistant',
                content: data.reply,
                created_at: new Date().toISOString()
              }
            ]
          } : null);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-2">
      {/* Chat Widget */}
      {widgetOpen && (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-96 h-96 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AnimatedAIAvatar size={32} isTalking={loading} />
              <div>
                <h3 className="font-semibold text-sm">{selectedCharacter?.name || 'Tregu AI'}</h3>
                <p className="text-xs text-blue-100">Online</p>
              </div>
            </div>
            <button
              onClick={() => setWidgetOpen(false)}
              className="text-white hover:bg-blue-800 rounded p-1"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          {selectedConversation && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {selectedConversation.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}>
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Character Selector */}
          {!selectedConversation && showCharacterSelector && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Select an AI:</p>
              {characters.slice(0, 3).map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    setSelectedCharacter(character);
                    setShowCharacterSelector(false);
                  }}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm border border-gray-200 transition-colors"
                >
                  <p className="font-medium text-gray-900">{character.name}</p>
                  <p className="text-xs text-gray-500 truncate">{character.personality.substring(0, 50)}...</p>
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {selectedCharacter && (
            <div className="border-t border-gray-200 p-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type message..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !message.trim()}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => {
          setWidgetOpen(!widgetOpen);
          if (!widgetOpen && !selectedCharacter && characters.length > 0) {
            setShowCharacterSelector(true);
          }
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center w-16 h-16 transition-all transform hover:scale-110"
        title="Open AI Chat"
      >
        {widgetOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
