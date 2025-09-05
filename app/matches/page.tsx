"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, MapPin, Calendar, Mail, Phone, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

// Function to get found items from localStorage
const getFoundItems = () => {
  if (typeof window === 'undefined') return []
  const items = localStorage.getItem('userReports')
  const allReports = items ? JSON.parse(items) : []
  return allReports.filter((item: any) => item.status === 'found')
}

// Function to get lost items from localStorage
const getLostItems = () => {
  if (typeof window === 'undefined') return []
  const items = localStorage.getItem('userReports')
  const allReports = items ? JSON.parse(items) : []
  return allReports.filter((item: any) => item.status === 'lost')
}

interface MatchedItem {
  item: any
  matchScore: number
  matchReasons: string[]
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reportedItem, setReportedItem] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Create some test found items if none exist
    const existingReports = JSON.parse(localStorage.getItem("userReports") || "[]")
    const foundItems = existingReports.filter((item: any) => item.status === "found")
    
    if (foundItems.length === 0) {
      // Add some test found items
      const testFoundItems = [
        {
          id: "test-found-1",
          itemName: "iPhone 14",
          description: "Black iPhone found in the library",
          category: "Electronics",
          location: "Library",
          date: new Date().toISOString().split('T')[0],
          status: "found",
          contactName: "Test User",
          contactEmail: "test@example.com",
          contactPhone: "123-456-7890",
          createdAt: new Date().toISOString()
        },
        {
          id: "test-found-2",
          itemName: "Samsung Phone",
          description: "White Samsung phone found near cafeteria",
          category: "Electronics",
          location: "Cafeteria",
          date: new Date().toISOString().split('T')[0],
          status: "found",
          contactName: "Test User 2",
          contactEmail: "test2@example.com",
          contactPhone: "123-456-7891",
          createdAt: new Date().toISOString()
        }
      ]
      
      const updatedReports = [...existingReports, ...testFoundItems]
      localStorage.setItem("userReports", JSON.stringify(updatedReports))
      console.log('Added test found items:', testFoundItems)
    }
    
    // Get the reported item data from localStorage or URL params
    // In a real app, this would come from your backend or route params
    const storedItem = localStorage.getItem("reportedItem")
    if (storedItem) {
      const item = JSON.parse(storedItem)
      setReportedItem(item)
      findMatches(item)
    } else {
      // Fallback for demo purposes
      const demoItem = {
        itemName: "iPhone 13",
        category: "Electronics",
        location: "Library",
        dateLost: "2024-01-14",
        status: "lost",
      }
      setReportedItem(demoItem)
      findMatches(demoItem)
    }
  }, [])

  const findMatches = (reportedItem: any) => {
    setIsLoading(true)

    // Simulate API delay
    setTimeout(() => {
      const matchedItems: MatchedItem[] = []

      const searchItems = reportedItem.status === "found" ? getLostItems() : getFoundItems()
      
      // Debug logging
      console.log('=== MATCHING DEBUG INFO ===')
      console.log('Reported item:', reportedItem)
      console.log('Search items to match against:', searchItems)
      console.log('Number of search items:', searchItems.length)

      searchItems.forEach((searchItem: any) => {
        const matchReasons: string[] = []
        let matchScore = 0
        
        console.log('\n--- Checking item:', searchItem.itemName, '---')
        console.log('Search item details:', searchItem)

        // Fuzzy text matching for item name (case-insensitive, partial matches)
        const reportedName = reportedItem.itemName.toLowerCase()
        const searchName = searchItem.itemName.toLowerCase()
        
        console.log('Name comparison:', reportedName, 'vs', searchName)

        if (searchName.includes(reportedName) || reportedName.includes(searchName)) {
          matchScore += 40
          matchReasons.push("Similar item name")
        } else {
          // Check for individual words
          const reportedWords = reportedName.split(" ")
          const searchWords = searchName.split(" ")
          const commonWords = reportedWords.filter((word: string) =>
            searchWords.some((searchWord: string) => searchWord.includes(word) || word.includes(searchWord)),
          )
          if (commonWords.length > 0) {
            matchScore += 20
            matchReasons.push("Partial name match")
          }
        }

        // Exact match for category
        if (searchItem.category === reportedItem.category) {
          matchScore += 30
          matchReasons.push("Same category")
        }

        // Location matching (exact or nearby)
        if (searchItem.location === reportedItem.location) {
          matchScore += 20
          matchReasons.push("Same location")
        }

        const reportedDate = new Date(reportedItem.status === "found" ? reportedItem.date || reportedItem.dateFound : reportedItem.date || reportedItem.dateLost)
        const searchDate = new Date(reportedItem.status === "found" ? searchItem.date || searchItem.dateLost : searchItem.date || searchItem.dateFound)
        const daysDiff = Math.abs((searchDate.getTime() - reportedDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff <= 7) {
          matchScore += 10
          matchReasons.push(
            `${reportedItem.status === "found" ? "Lost" : "Found"} ${Math.floor(daysDiff)} days ${searchDate > reportedDate ? "after" : "before"}`,
          )
        }

        // Only include items with a reasonable match score
        console.log('Final match score:', matchScore, 'Match reasons:', matchReasons)
        if (matchScore >= 20) {
          console.log('✅ Item added to matches!')
          matchedItems.push({
            item: searchItem,
            matchScore,
            matchReasons,
          })
        } else {
          console.log('❌ Item rejected (score < 20)')
        }
      })
      
      console.log('\n=== FINAL RESULTS ===')
      console.log('Total matched items:', matchedItems.length)
      console.log('Matched items:', matchedItems)

      // Sort by match score (highest first)
      matchedItems.sort((a, b) => b.matchScore - a.matchScore)

      setMatches(matchedItems)
      setIsLoading(false)
    }, 1500)
  }

  const getMatchBadgeColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800 border-green-200"
    if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-blue-100 text-blue-800 border-blue-200"
  }

  const getMatchLabel = (score: number) => {
    if (score >= 70) return "High Match"
    if (score >= 50) return "Good Match"
    return "Possible Match"
  }

  const handleStartChat = (item: any) => {
    const currentUser = "current-user@vitstudent.ac.in" // In real app, get from auth
    const otherUser = reportedItem?.status === "found" ? (item.contactEmail || item.reporterEmail) : (item.contactEmail || item.finderEmail)

    // Create consistent conversation ID by sorting emails alphabetically
    const users = [currentUser, otherUser].sort()
    const conversationId = `${users[0]}-${users[1]}-${item.id}`

    router.push(`/chat/${conversationId}?itemId=${item.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800 relative">
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
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading font-bold text-lg text-white">Lost & Found VIT</span>
              </div>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <main className="container mx-auto px-4 py-8 max-w-4xl relative">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-heading font-bold mb-2 text-white">Searching for Matches...</h1>
            <p className="text-zinc-400">We're looking through all found items to find potential matches</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800 relative">
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
                <Search className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-lg text-white">Lost & Found VIT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Potential Matches Found</h1>
          <p className="text-zinc-400">
            {reportedItem &&
              `We found ${matches.length} potential matches for your ${reportedItem.status === "found" ? "found" : "lost"} "${reportedItem.itemName}"`}
          </p>
        </div>

        {matches.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {matches.map(({ item, matchScore, matchReasons }) => (
              <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow bg-zinc-900/50 backdrop-blur-xl border border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">{item.itemName}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1 text-zinc-400">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </CardDescription>
                    </div>
                    <Badge className={`${getMatchBadgeColor(matchScore)} border`}>{getMatchLabel(matchScore)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(item as any).image && (
                    <div className="relative h-48 bg-zinc-800 rounded-lg overflow-hidden">
                      <Image
                        src={(item as any).image || "/placeholder.svg"}
                        alt={item.itemName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">{item.description}</p>

                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {reportedItem?.status === "found"
                          ? `Lost ${new Date((item as any).date || (item as any).dateLost).toLocaleDateString()}`
                          : `Found ${new Date((item as any).date || (item as any).dateFound).toLocaleDateString()}`}
                      </span>
                      <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">
                        {item.category}
                      </Badge>
                      {(item as any).reward && (
                        <Badge variant="secondary" className="text-xs bg-gradient-to-b from-primary to-primary/80 text-primary-foreground border-primary/50">
                          Reward: {(item as any).reward}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-400">Why this might match:</p>
                    <div className="flex flex-wrap gap-1">
                      {matchReasons.map((reason, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-gradient-to-b from-primary to-primary/80 text-primary-foreground border-primary/50">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="border-t border-zinc-700 pt-4 space-y-2">
                    <p className="text-sm font-medium text-white">
                      {reportedItem?.status === "found" ? "Contact the reporter:" : "Contact the finder:"}
                    </p>
                    <div className="space-y-1 text-sm text-zinc-400">
                      <p className="font-medium text-white">
                        {reportedItem?.status === "found" ? (item as any).contactName || (item as any).reporterName : (item as any).contactName || (item as any).finderName}
                      </p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-blue-500" />
                        <a
                          href={`mailto:${reportedItem?.status === "found" ? (item as any).contactEmail || (item as any).reporterEmail : (item as any).contactEmail || (item as any).finderEmail}`}
                          className="hover:text-blue-400 transition-colors"
                        >
                          {reportedItem?.status === "found" ? (item as any).contactEmail || (item as any).reporterEmail : (item as any).contactEmail || (item as any).finderEmail}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-blue-500" />
                        <a
                          href={`tel:${reportedItem?.status === "found" ? (item as any).contactPhone || (item as any).reporterPhone : (item as any).contactPhone || (item as any).finderPhone}`}
                          className="hover:text-blue-400 transition-colors"
                        >
                          {reportedItem?.status === "found" ? (item as any).contactPhone || (item as any).reporterPhone : (item as any).contactPhone || (item as any).finderPhone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <Button onClick={() => handleStartChat(item)} size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {reportedItem?.status === "found" ? "Contact Reporter" : "Contact Finder"}
                    </Button>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" asChild>
                        <a
                          href={`mailto:${reportedItem?.status === "found" ? (item as any).contactEmail || (item as any).reporterEmail : (item as any).contactEmail || (item as any).finderEmail}`}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" asChild>
                        <a
                          href={`tel:${reportedItem?.status === "found" ? (item as any).contactPhone || (item as any).reporterPhone : (item as any).contactPhone || (item as any).finderPhone}`}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* No Matches State */
          <Card className="text-center py-12 bg-zinc-900/50 backdrop-blur-xl border-zinc-800">
            <CardContent>
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2 text-white">No matches found yet</h3>
              <p className="text-zinc-400 mb-4 max-w-md mx-auto">
                {reportedItem?.status === "found"
                  ? "No one has reported losing an item that matches your found item yet. We'll notify you if someone does!"
                  : "Don't worry! We'll keep looking and notify you as soon as someone reports finding an item that matches your description."}
              </p>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto text-sm italic">
                If these aren't yours, keep up your spirit! It'll definitely reach you. Wait patiently for someone to find it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" asChild>
                  <Link href="/browse-found">Browse All Found Items</Link>
                </Button>
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-zinc-400">
          <p>
            Found your item? Great! Contact the finder directly using the information provided above.
            <br />
            Remember to verify the item details before meeting up.
          </p>
          <p className="mt-4 italic text-muted-foreground">
            If these aren't yours, keep up your spirit! It'll definitely reach you. Wait patiently for someone to find it.
          </p>
        </div>
      </main>
    </div>
  )
}
