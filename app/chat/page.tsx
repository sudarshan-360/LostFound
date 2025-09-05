"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, MessageCircle, User } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  senderId: string
  receiverId: string
  itemId: number
  message: string
  timestamp: string
}

interface Conversation {
  id: string
  participants: string[]
  itemId: number
  itemName: string
  itemImage: string
  lastMessage: Message | null
  unreadCount: number
}

export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  // Mock current user - in real app, get from auth
  const currentUser = "current-user@vitstudent.ac.in"

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = () => {
    try {
      const storedMessages = JSON.parse(localStorage.getItem("chatMessages") || "[]") as Message[]
      const storedConversations = JSON.parse(localStorage.getItem("conversations") || "[]") as Conversation[]

      // Group messages by conversation and get latest message for each
      const conversationMap = new Map<string, Conversation>()

      // Initialize from stored conversations
      storedConversations.forEach((conv) => {
        conversationMap.set(conv.id, { ...conv, lastMessage: null, unreadCount: 0 })
      })

      // Update with latest messages
      storedMessages
        .filter((msg) => msg.senderId === currentUser || msg.receiverId === currentUser)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .forEach((msg) => {
          const conversationId =
            msg.senderId === currentUser
              ? `${currentUser}-${msg.receiverId}-${msg.itemId}`
              : `${msg.senderId}-${currentUser}-${msg.itemId}`

          if (!conversationMap.has(conversationId)) {
            // Create new conversation if it doesn't exist
            const otherUser = msg.senderId === currentUser ? msg.receiverId : msg.senderId
            conversationMap.set(conversationId, {
              id: conversationId,
              participants: [currentUser, otherUser],
              itemId: msg.itemId,
              itemName: `Item #${msg.itemId}`, // In real app, fetch item details
              itemImage: "/placeholder.svg",
              lastMessage: msg,
              unreadCount: msg.senderId !== currentUser ? 1 : 0,
            })
          } else {
            const conv = conversationMap.get(conversationId)!
            if (!conv.lastMessage || new Date(msg.timestamp) > new Date(conv.lastMessage.timestamp)) {
              conv.lastMessage = msg
              if (msg.senderId !== currentUser) {
                conv.unreadCount++
              }
            }
          }
        })

      setConversations(Array.from(conversationMap.values()))
    } catch (error) {
      console.error("Error loading conversations:", error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.participants.find((p) => p !== currentUser) || ""
    const searchLower = searchTerm.toLowerCase()
    return (
      otherUser.toLowerCase().includes(searchLower) ||
      conv.itemName.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.message.toLowerCase().includes(searchLower)
    )
  })

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-zinc-800 relative">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-200">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-lg text-white">Messages</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Your Conversations</h1>
          <p className="text-zinc-400">Chat with other students about lost and found items</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2 text-white">No conversations yet</h3>
            <p className="text-zinc-400 mb-4">Start chatting by contacting someone about their found item</p>
            <Link href="/browse-found">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">Browse Found Items</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.participants.find((p) => p !== currentUser) || ""
              const otherUserName = otherUser
                .split("@")[0]
                .replace(".", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())

              return (
                <Link key={conversation.id} href={`/chat/${conversation.id}`}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-zinc-800/50 border-zinc-700 hover:border-zinc-600">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Item Image */}
                        <div className="w-12 h-12 bg-zinc-700/50 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={conversation.itemImage || "/placeholder.svg"}
                            alt={conversation.itemName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate text-white">{otherUserName}</h3>
                              <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-300">
                                {conversation.itemName}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {conversation.lastMessage && (
                                <span className="text-xs text-zinc-400">
                                  {formatTime(conversation.lastMessage.timestamp)}
                                </span>
                              )}
                              {conversation.unreadCount > 0 && (
                                <Badge
                                  className="text-xs min-w-[20px] h-5 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
                                >
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                            <span className="text-xs text-zinc-400 truncate">{otherUser}</span>
                          </div>

                          {conversation.lastMessage && (
                            <p className="text-sm text-zinc-300 truncate mt-1">
                              {conversation.lastMessage.senderId === currentUser ? "You: " : ""}
                              {conversation.lastMessage.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
