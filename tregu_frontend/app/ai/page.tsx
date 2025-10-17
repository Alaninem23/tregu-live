'use client';

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AnimatedAIAvatar from '../../components/AnimatedAIAvatar'

interface AICharacter {
  id: number
  name: string
  avatar_url?: string
  personality: string
  system_prompt?: string
  is_active: boolean
}

interface ChatMessage {
  id: number
  conversation_id: number
  role: string
  content: string
  created_at: string
}

interface ChatConversation {
  id: number
  user_id: number
  character_id: number
  title?: string
  messages: ChatMessage[]
  character: AICharacter
  created_at: string
  updated_at?: string
}

export default function AIMessengerPage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<AICharacter[]>([])
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<AICharacter | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isSeller, setIsSeller] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<AICharacter | null>(null)
  const [characterForm, setCharacterForm] = useState({
    name: '',
    personality: '',
    system_prompt: '',
    avatar_url: ''
  })
  
  // Floating widget state
  const [widgetOpen, setWidgetOpen] = useState(false)
  const [showCharacterSelector, setShowCharacterSelector] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  useEffect(() => {
    checkAuth()
    loadCharacters()
    loadConversations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('tregu:user')
    const user = userStr ? JSON.parse(userStr) : null
    setCurrentUser(user)
    setIsSeller(user?.role === 'seller')
    // Allow access without sign-in
    // if (!token) {
    //   router.push('/auth/signin')
    //   return
    // }
  }

  const loadCharacters = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/ai/characters', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCharacters(data)
        if (data.length > 0 && !selectedCharacter) {
          setSelectedCharacter(data[0])
        }
      } else {
        // Use mock data if API fails
        console.log('Using mock character data')
        const mockCharacters: AICharacter[] = [
          {
            id: 1,
            name: 'Tregu Assistant',
            avatar_url: '/ai-avatar-1.png',
            personality: 'A helpful and knowledgeable assistant for the Tregu platform.',
            system_prompt: 'You are Tregu Assistant, a helpful AI companion.',
            is_active: true
          },
          {
            id: 2,
            name: 'Commerce Expert',
            avatar_url: '/ai-avatar-2.png',
            personality: 'An expert in business commerce and marketplace operations.',
            system_prompt: 'You are Commerce Expert, specializing in business operations.',
            is_active: true
          }
        ]
        setCharacters(mockCharacters)
        if (!selectedCharacter) {
          setSelectedCharacter(mockCharacters[0])
        }
      }
    } catch (err) {
      console.error('Failed to load characters:', err)
      // Use mock data if API fails
      const mockCharacters: AICharacter[] = [
        {
          id: 1,
          name: 'Tregu Assistant',
          avatar_url: '/ai-avatar-1.png',
          personality: 'A helpful and knowledgeable assistant for the Tregu platform.',
          system_prompt: 'You are Tregu Assistant, a helpful AI companion.',
          is_active: true
        },
        {
          id: 2,
          name: 'Commerce Expert',
          avatar_url: '/ai-avatar-2.png',
          personality: 'An expert in business commerce and marketplace operations.',
          system_prompt: 'You are Commerce Expert, specializing in business operations.',
          is_active: true
        }
      ]
      setCharacters(mockCharacters)
      if (!selectedCharacter) {
        setSelectedCharacter(mockCharacters[0])
      }
    }
  }

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/ai/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    }
  }

  const startNewConversation = async (character: AICharacter) => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          character_id: character.id,
          title: `Chat with ${character.name}`
        })
      })

      if (res.ok) {
        const newConv = await res.json()
        setConversations(prev => [newConv, ...prev])
        setSelectedConversation(newConv)
        setSelectedCharacter(character)
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !selectedCharacter) return

    setLoading(true)
    const messageToSend = message
    setMessage('')

    try {
      const token = localStorage.getItem('auth_token')
      const conversationId = selectedConversation?.id

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageToSend,
          conversation_id: conversationId,
          character_id: selectedCharacter.id
        })
      })

      if (res.ok) {
        const data = await res.json()

        // Update or create conversation
        if (!selectedConversation) {
          const newConversation: ChatConversation = {
            id: data.conversation_id,
            user_id: currentUser?.id || 0,
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
          }
          setSelectedConversation(newConversation)
          setConversations(prev => [newConversation, ...prev])
        } else {
          const userMessage: ChatMessage = {
            id: Date.now(),
            conversation_id: data.conversation_id,
            role: 'user',
            content: messageToSend,
            created_at: new Date().toISOString()
          }

          const aiMessage: ChatMessage = {
            id: Date.now() + 1,
            conversation_id: data.conversation_id,
            role: 'assistant',
            content: data.reply,
            created_at: new Date().toISOString()
          }

          setSelectedConversation(prev => prev ? {
            ...prev,
            messages: [...prev.messages, userMessage, aiMessage]
          } : null)
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      const mockReply = `Hello! I'm ${selectedCharacter.name}. I received your message: "${messageToSend}".`

      if (!selectedConversation) {
        const newConversation: ChatConversation = {
          id: Date.now(),
          user_id: currentUser?.id || 0,
          character_id: selectedCharacter.id,
          title: `Chat with ${selectedCharacter.name}`,
          messages: [
            {
              id: Date.now(),
              conversation_id: Date.now(),
              role: 'user',
              content: messageToSend,
              created_at: new Date().toISOString()
            },
            {
              id: Date.now() + 1,
              conversation_id: Date.now(),
              role: 'assistant',
              content: mockReply,
              created_at: new Date().toISOString()
            }
          ],
          character: selectedCharacter,
          created_at: new Date().toISOString()
        }
        setSelectedConversation(newConversation)
        setConversations(prev => [newConversation, ...prev])
      } else {
        const userMessage: ChatMessage = {
          id: Date.now(),
          conversation_id: selectedConversation.id,
          role: 'user',
          content: messageToSend,
          created_at: new Date().toISOString()
        }

        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          conversation_id: selectedConversation.id,
          role: 'assistant',
          content: mockReply,
          created_at: new Date().toISOString()
        }

        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, userMessage, aiMessage]
        } : null)
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`/api/ai/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  const openCharacterModal = (character?: AICharacter) => {
    if (character) {
      setEditingCharacter(character)
      setCharacterForm({
        name: character.name,
        personality: character.personality,
        system_prompt: character.system_prompt || '',
        avatar_url: character.avatar_url || ''
      })
    } else {
      setEditingCharacter(null)
      setCharacterForm({ name: '', personality: '', system_prompt: '', avatar_url: '' })
    }
    setShowCharacterModal(true)
  }

  const closeCharacterModal = () => {
    setShowCharacterModal(false)
    setEditingCharacter(null)
    setCharacterForm({ name: '', personality: '', system_prompt: '', avatar_url: '' })
  }

  const saveCharacter = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const method = editingCharacter ? 'PUT' : 'POST'
      const url = editingCharacter ? `/api/ai/characters/${editingCharacter.id}` : '/api/ai/characters'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(characterForm)
      })
      if (res.ok) {
        await loadCharacters()
        closeCharacterModal()
      }
    } catch (err) {
      console.error('Failed to save character:', err)
    }
  }

  const deleteCharacter = async (characterId: number) => {
    if (!confirm('Delete this character?')) return
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`/api/ai/characters/${characterId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      await loadCharacters()
    } catch (err) {
      console.error('Failed to delete character:', err)
    }
  }


  return (
    <div className="w-full h-screen bg-gray-50">
      {/* Floating Chat Widget */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-2">
        {/* Chat Widget Container */}
        {widgetOpen && (
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-96 h-96 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3">
            {/* Widget Header */}
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

            {/* Chat Messages Area */}
            {selectedConversation && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Character Selector (if no conversation yet) */}
            {!selectedConversation && showCharacterSelector && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Select an AI Assistant:</p>
                {characters.slice(0, 3).map((character) => (
                  <button
                    key={character.id}
                    onClick={() => {
                      setSelectedCharacter(character)
                      setShowCharacterSelector(false)
                    }}
                    className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm border border-gray-200 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{character.name}</p>
                    <p className="text-xs text-gray-500 truncate">{character.personality.substring(0, 50)}...</p>
                  </button>
                ))}
              </div>
            )}

            {/* Message Input */}
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
            setWidgetOpen(!widgetOpen)
            if (!widgetOpen && !selectedCharacter && characters.length > 0) {
              setShowCharacterSelector(true)
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

      {/* Full Page Content - Main UI when widget is closed */}
      {!widgetOpen && (
        <div className="w-full h-full flex flex-col bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <h1 className="text-3xl font-bold text-gray-900">Tregu AI Assistant</h1>
            <p className="text-gray-600 mt-1">Chat with AI assistants in the bottom-right corner</p>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available AI Assistants</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-200 hover:border-blue-300"
                    onClick={() => {
                      setSelectedCharacter(character)
                      setShowCharacterSelector(false)
                      setWidgetOpen(true)
                    }}
                  >
                    <div className="flex items-center justify-center mb-4">
                      <AnimatedAIAvatar size={64} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{character.name}</h3>
                    <p className="text-gray-600 text-sm">{character.personality}</p>
                    <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium">
                      Chat Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Character Management Modal - Old Sidebar Content */}
      <div className="hidden">
        {/* Characters Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">AI Characters</h3>
            {isSeller && (
              <button
                onClick={() => openCharacterModal()}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + New
              </button>
            )}
          </div>
          <div className="space-y-2">
            {characters.map((character) => (
              <div key={character.id} className="relative">
                <button
                  onClick={() => startNewConversation(character)}
                  className="w-full p-3 text-left rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <AnimatedAIAvatar size={40} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{character.name}</p>
                      <p className="text-sm text-gray-500 truncate">{character.personality}</p>
                    </div>
                  </div>
                </button>
                {isSeller && !['Tregu Assistant', 'Inventory Expert', 'Business Advisor'].includes(character.name) && (
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openCharacterModal(character)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Edit character"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCharacter(character.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete character"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conversations Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Conversations</h3>
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.id === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-gray-200'
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {conversation.title || `Chat with ${conversation.character.name}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {conversation.messages.length} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conversation.id)
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                    aria-label="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {selectedConversation && (
              <div className="flex items-center space-x-3">
                <AnimatedAIAvatar size={40} isTalking={loading} />
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.title || `Chat with ${selectedConversation.character.name}`}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedConversation.character.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedConversation ? (
            <>
              {selectedConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-3`}
                >
                  {msg.role === 'assistant' && (
                    <AnimatedAIAvatar size={32} isTalking={false} />
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : selectedCharacter ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AnimatedAIAvatar size={64} className="mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chat with {selectedCharacter.name}</h3>
                <p className="text-gray-500 mb-4">Send a message to start the conversation</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AnimatedAIAvatar size={64} className="mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to AI Messenger</h3>
                <p className="text-gray-500 mb-4">Select a character to start chatting</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {characters.slice(0, 3).map((character) => (
                    <button
                      key={character.id}
                      onClick={() => setSelectedCharacter(character)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <AnimatedAIAvatar size={48} className="mx-auto mb-3" />
                      <h4 className="font-medium text-gray-900">{character.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{character.personality.substring(0, 60)}...</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        {selectedCharacter && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !message.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Character Management Modal */}
      {showCharacterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingCharacter ? 'Edit Character' : 'Create New Character'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={characterForm.name}
                  onChange={(e) => setCharacterForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Character name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personality
                </label>
                <textarea
                  value={characterForm.personality}
                  onChange={(e) => setCharacterForm(prev => ({ ...prev, personality: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the character's personality"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Prompt
                </label>
                <textarea
                  value={characterForm.system_prompt}
                  onChange={(e) => setCharacterForm(prev => ({ ...prev, system_prompt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Instructions for how the AI should behave"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL (optional)
                </label>
                <input
                  type="url"
                  value={characterForm.avatar_url}
                  onChange={(e) => setCharacterForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/avatar.png"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeCharacterModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveCharacter}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingCharacter ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
