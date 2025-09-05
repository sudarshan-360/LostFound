"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MapPin, Calendar, Mail, Phone, MessageCircle, Gift, User, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import PageTransition from "@/components/page-transition"

// Mock data - same as browse page
const mockFoundItems = [
  {
    id: 1,
    itemName: "iPhone 13 Pro",
    description:
      "Black iPhone 13 Pro with a cracked screen protector. Found near the library entrance. The phone appears to be in good working condition despite the cracked screen protector. It was found around 3 PM near the main entrance of the library.",
    category: "Electronics",
    location: "Library",
    dateFound: "2024-01-15",
    finderName: "Rahul Sharma",
    finderEmail: "rahul.sharma@vitstudent.ac.in",
    finderPhone: "+91 9876543210",
    reward: "₹1000",
    image: "/black-iphone.jpg",
    status: "available",
    additionalDetails: {
      timeFound: "3:00 PM",
      exactLocation: "Main entrance, near the security desk",
      condition: "Good condition, minor screen protector damage",
      additionalNotes:
        "Phone was found in a small puddle, but appears to be working fine. Screen lights up when touched.",
    },
  },
  {
    id: 2,
    itemName: "Blue Backpack",
    description:
      "Navy blue Wildcraft backpack with laptop compartment. Contains some notebooks and a water bottle. The backpack has some wear but is in good condition overall.",
    category: "Bags & Backpacks",
    location: "Cafeteria",
    dateFound: "2024-01-14",
    finderName: "Priya Patel",
    finderEmail: "priya.patel@vitstudent.ac.in",
    finderPhone: "+91 9876543211",
    reward: "Coffee treat",
    image: "/blue-backpack.png",
    status: "available",
    additionalDetails: {
      timeFound: "1:30 PM",
      exactLocation: "Table near the south entrance",
      condition: "Good condition, some minor wear on straps",
      additionalNotes: "Contains notebooks with 'CSE' written on them and a half-full water bottle.",
    },
  },
  // Add other items with similar structure...
]

interface ContactSectionProps {
  item: any
  onStartChat: () => void
}

function ContactSection({ item, onStartChat }: ContactSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Contact Information
        </CardTitle>
        <CardDescription>Get in touch with the person who found this item</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{item.finderName}</div>
              <div className="text-sm text-muted-foreground">VIT Student</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{item.finderEmail}</div>
              <div className="text-sm text-muted-foreground">Email Address</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{item.finderPhone}</div>
              <div className="text-sm text-muted-foreground">Phone Number</div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Button onClick={onStartChat} className="w-full flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Start Chat
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild className="flex items-center gap-2 bg-transparent">
              <a href={`mailto:${item.finderEmail}`}>
                <Mail className="w-4 h-4" />
                Email
              </a>
            </Button>
            <Button variant="outline" asChild className="flex items-center gap-2 bg-transparent">
              <a href={`tel:${item.finderPhone}`}>
                <Phone className="w-4 h-4" />
                Call
              </a>
            </Button>
          </div>
        </div>

        {item.reward && (
          <>
            <Separator />
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Gift className="w-4 h-4 text-primary" />
              <div>
                <div className="font-medium text-primary">Reward Offered</div>
                <div className="text-sm text-primary/80">{item.reward}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function ItemDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const resolvedParams = use(params)

  useEffect(() => {
    // Simulate API call
    const foundItem = mockFoundItems.find((item) => item.id === Number.parseInt(resolvedParams.id))
    setItem(foundItem)
    setLoading(false)
  }, [resolvedParams.id])

  const handleStartChat = () => {
    const currentUser = "current-user-id" // In real app, get from auth
    const conversationId = `${currentUser}-${item.finderEmail}-${item.id}`
    router.push(`/chat/${conversationId}?itemId=${item.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading item details...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Item Not Found</h1>
          <p className="text-muted-foreground mb-4">The item you're looking for doesn't exist.</p>
          <Link href="/browse-found">
            <Button>Browse All Items</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/browse-found"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Browse</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-200">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <span className="font-heading font-bold text-lg">Lost & Found VIT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Image and Basic Info */}
            <Card>
              <div className="aspect-square lg:aspect-video bg-muted relative rounded-t-lg overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.itemName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant={item.status === "available" ? "default" : "secondary"}>
                    {item.status === "available" ? "Available" : "Claimed"}
                  </Badge>
                </div>
                {item.reward && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      <Gift className="w-3 h-3 mr-1" />
                      {item.reward}
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader>
                <CardTitle className="text-2xl">{item.itemName}</CardTitle>
                <CardDescription className="text-base">{item.description}</CardDescription>
              </CardHeader>
            </Card>

            {/* Detailed Information */}
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">Location Found</div>
                      <div className="text-sm text-muted-foreground">{item.location}</div>
                      {item.additionalDetails?.exactLocation && (
                        <div className="text-xs text-muted-foreground">{item.additionalDetails.exactLocation}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">Date Found</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.dateFound).toLocaleDateString()}
                      </div>
                      {item.additionalDetails?.timeFound && (
                        <div className="text-xs text-muted-foreground">{item.additionalDetails.timeFound}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">Category</div>
                      <div className="text-sm text-muted-foreground">{item.category}</div>
                    </div>
                  </div>

                  {item.additionalDetails?.condition && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">Condition</div>
                        <div className="text-sm text-muted-foreground">{item.additionalDetails.condition}</div>
                      </div>
                    </div>
                  )}
                </div>

                {item.additionalDetails?.additionalNotes && (
                  <>
                    <Separator />
                    <div>
                      <div className="font-medium mb-2">Additional Notes</div>
                      <p className="text-sm text-muted-foreground">{item.additionalDetails.additionalNotes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <ContactSection item={item} onStartChat={handleStartChat} />

            {/* Similar Items */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Items</CardTitle>
                <CardDescription>Other items in the same category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockFoundItems
                    .filter((similarItem) => similarItem.category === item.category && similarItem.id !== item.id)
                    .slice(0, 3)
                    .map((similarItem) => (
                      <Link key={similarItem.id} href={`/items/${similarItem.id}`}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <img
                            src={similarItem.image || "/placeholder.svg"}
                            alt={similarItem.itemName}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{similarItem.itemName}</div>
                            <div className="text-xs text-muted-foreground">{similarItem.location}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      </div>
    </PageTransition>
  )
}
