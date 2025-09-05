"use client"

import type React from "react"

import { useState, useEffect, useRef, use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, User, Clock } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import PageTransition from "@/components/page-transition"

interface Message {
  id: string
  senderId: string
  receiverId: string
  itemId: number
  message: string
  timestamp: string
}

interface ItemInfo {
  id: number
  name: string
  image: string
  category: string
  location: string
}

export default function ChatWindowPage({ params }: { params: Promise<{ id: string }> }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [itemInfo, setItemInfo] = useState<ItemInfo | null>(null)
  const [otherUserName, setOtherUserName] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const resolvedParams = use(params)

  // Mock current user - in real app, get from auth
  const currentUser = "current-user@vitstudent.ac.in"
  const itemId = searchParams?.get("itemId")

  useEffect(() => {
    loadChatData()
  }, [resolvedParams.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatData = () => {
    try {
      const storedMessages = JSON.parse(localStorage.getItem("chatMessages") || "[]") as Message[]
      const conversationMessages = storedMessages
        .filter((msg) => {
          const msgConversationId =
            msg.senderId === currentUser
              ? `${currentUser}-${msg.receiverId}-${msg.itemId}`
              : `${msg.senderId}-${currentUser}-${msg.itemId}`
          return msgConversationId === resolvedParams.id
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      setMessages(conversationMessages)

      // Extract other user from conversation ID
      const parts = resolvedParams.id.split("-")
      const otherUser = parts.find((part) => part.includes("@") && part !== currentUser) || ""
      setOtherUserName(
        otherUser
          .split("@")[0]
          .replace(".", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      )

      // Load item info (mock data - in real app, fetch from API)
      if (itemId) {
        setItemInfo({
          id: Number.parseInt(itemId),
          name: `Item #${itemId}`,
          image: "/placeholder.svg",
          category: "Electronics",
          location: "Library",
        })
      } else if (conversationMessages.length > 0) {
        const firstMessage = conversationMessages[0]
        setItemInfo({
          id: firstMessage.itemId,
          name: `Item #${firstMessage.itemId}`,
          image: "/placeholder.svg",
          category: "Electronics",
          location: "Library",
        })
      } else {
        // Default item info for new conversations
        setItemInfo({
          id: 1,
          name: "Lost Item",
          image: "/placeholder.svg",
          category: "General",
          location: "Unknown",
        })
      }
    } catch (error) {
      console.error("Error loading chat data:", error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "end",
        inline: "nearest" 
      })
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = () => {
    if (!newMessage.trim() || !itemInfo) return

    const otherUser = resolvedParams.id.split("-").find((part: string) => part.includes("@") && part !== currentUser) || ""

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser,
      receiverId: otherUser,
      itemId: itemInfo.id,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    try {
      const storedMessages = JSON.parse(localStorage.getItem("chatMessages") || "[]") as Message[]
      storedMessages.push(message)
      localStorage.setItem("chatMessages", JSON.stringify(storedMessages))

      // Update conversations list
      const storedConversations = JSON.parse(localStorage.getItem("conversations") || "[]")
      const conversationExists = storedConversations.some((conv: any) => conv.id === resolvedParams.id)

      if (!conversationExists) {
        const newConversation = {
          id: resolvedParams.id,
          participants: [currentUser, otherUser],
          itemId: itemInfo.id,
          itemName: itemInfo.name,
          itemImage: itemInfo.image,
        }
        storedConversations.push(newConversation)
        localStorage.setItem("conversations", JSON.stringify(storedConversations))
      }

      setMessages((prev) => [...prev, message])
      setNewMessage("")
      
      // Scroll to bottom after message is added
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
      // Reset textarea height after sending
      const target = e.target as HTMLTextAreaElement
      target.style.height = '44px'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="h-screen bg-black text-white relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-zinc-800">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/chat"
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Chats</span>
              </Link>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {otherUserName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-heading font-bold text-white">{otherUserName}</div>
                  {itemInfo && <div className="text-sm text-zinc-400">About: {itemInfo.name}</div>}
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Online</span>
                  </div>
                </div>
              </div>
                </div>

                {itemInfo && (
                  <Link href={`/items/${itemInfo.id}`}>
                    <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800/50 hover:text-white hover:border-blue-500">
                      View Item
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* Main Chat Container */}
          <div className="flex-1 flex flex-col h-0">
            {/* Item Info Card */}
            {itemInfo && (
              <div className="flex-shrink-0 px-4 py-3">
                <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-700/50 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={itemInfo.image || "/placeholder.svg"}
                          alt={itemInfo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{itemInfo.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <span className="truncate">{itemInfo.category}</span>
                          <span>•</span>
                          <span className="truncate">{itemInfo.location}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-zinc-600 text-zinc-300 flex-shrink-0">Chat Topic</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 scroll-smooth">
              <div className="space-y-3 py-4 min-h-full flex flex-col justify-end">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-zinc-800/50 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-white">Start the conversation</h3>
                  <p className="text-zinc-400">Send a message to {otherUserName} about this item</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                {messages.map((message, index) => {
                  const isCurrentUser = message.senderId === currentUser
                  const showDate =
                    index === 0 || formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp)

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center py-2">
                          <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-300 bg-zinc-800/40 backdrop-blur-sm">
                            {formatDate(message.timestamp)}
                          </Badge>
                        </div>
                      )}

                      <div className={`flex items-start gap-2 sm:gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                          isCurrentUser 
                            ? "bg-gradient-to-br from-blue-600 to-purple-600" 
                            : "bg-gradient-to-br from-zinc-600 to-zinc-700"
                        }`}>
                          {isCurrentUser ? "Y" : otherUserName.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`flex flex-col min-w-0 max-w-[75%] sm:max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 word-wrap break-words ${
                              isCurrentUser 
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md" 
                                : "bg-zinc-800/70 border border-zinc-700 text-white rounded-bl-md backdrop-blur-sm"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.message}</p>
                          </div>
                          <div
                            className={`flex items-center gap-1 mt-1 text-xs text-zinc-400 ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span>{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
              </div>
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 border-t border-zinc-800 bg-black/80 backdrop-blur-sm">
              <div className="px-4 py-3">
                <div className="flex gap-3 items-end max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-400 rounded-2xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none overflow-hidden min-h-[44px] max-h-[120px] transition-colors"
                      style={{
                        height: 'auto',
                        minHeight: '44px'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                      }}
                    />
                  </div>
                  <Button 
                     onClick={sendMessage} 
                     disabled={!newMessage.trim()}
                     className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full w-11 h-11 p-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
                   >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
