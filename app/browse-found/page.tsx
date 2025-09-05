"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Search, Filter, MapPin, Calendar, Mail, Gift, Upload, Plus, X } from "lucide-react"
import Link from "next/link"
import PageTransition from "@/components/page-transition"

// Mock data for found items
const mockFoundItems = [
  {
    id: 1,
    itemName: "iPhone 13 Pro",
    description: "Black iPhone 13 Pro with a cracked screen protector. Found near the library entrance.",
    category: "Electronics",
    location: "Library",
    dateFound: "2024-01-15",
    finderName: "Rahul Sharma",
    finderEmail: "rahul.sharma@vitstudent.ac.in",
    finderPhone: "+91 9876543210",
    reward: "₹1000",
    image: "/placeholder.jpg",
    status: "available",
  },
  {
    id: 2,
    itemName: "Blue Backpack",
    description: "Navy blue Wildcraft backpack with laptop compartment. Contains some notebooks.",
    category: "Bags & Backpacks",
    location: "Cafeteria",
    dateFound: "2024-01-14",
    finderName: "Priya Patel",
    finderEmail: "priya.patel@vitstudent.ac.in",
    finderPhone: "+91 9876543211",
    reward: "Coffee treat",
    image: "/placeholder.jpg",
    status: "available",
  },
  {
    id: 3,
    itemName: "Student ID Card",
    description: "VIT student ID card belonging to Amit Kumar, Computer Science, 3rd year.",
    category: "ID Cards & Documents",
    location: "Main Building",
    dateFound: "2024-01-13",
    finderName: "Sneha Reddy",
    finderEmail: "sneha.reddy@vitstudent.ac.in",
    finderPhone: "+91 9876543212",
    reward: "",
    image: "/placeholder.jpg",
    status: "claimed",
  },
  {
    id: 4,
    itemName: "Wireless Earbuds",
    description: "White Apple AirPods Pro with charging case. Found in the sports complex.",
    category: "Electronics",
    location: "Sports Complex",
    dateFound: "2024-01-12",
    finderName: "Arjun Singh",
    finderEmail: "arjun.singh@vitstudent.ac.in",
    finderPhone: "+91 9876543213",
    reward: "₹500",
    image: "/placeholder.jpg",
    status: "available",
  },
  {
    id: 5,
    itemName: "Physics Textbook",
    description: "Resnick Halliday Krane Physics textbook, 5th edition. Has some notes written inside.",
    category: "Books & Stationery",
    location: "Library",
    dateFound: "2024-01-11",
    finderName: "Kavya Nair",
    finderEmail: "kavya.nair@vitstudent.ac.in",
    finderPhone: "+91 9876543214",
    reward: "",
    image: "/placeholder.jpg",
    status: "available",
  },
  {
    id: 6,
    itemName: "Silver Watch",
    description: "Casio silver digital watch with metal strap. Battery seems to be working fine.",
    category: "Jewelry",
    location: "Hostel Block A",
    dateFound: "2024-01-10",
    finderName: "Rohit Gupta",
    finderEmail: "rohit.gupta@vitstudent.ac.in",
    finderPhone: "+91 9876543215",
    reward: "₹300",
    image: "/placeholder.jpg",
    status: "available",
  },
]

export default function BrowseFoundItems() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [foundItems, setFoundItems] = useState(mockFoundItems)
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    location: "",
    dateFound: "",
    image: null as File | null,
  })

  const categories = [
    "Electronics",
    "Books & Stationery",
    "Clothing & Accessories",
    "ID Cards & Documents",
    "Keys",
    "Bags & Backpacks",
    "Sports Equipment",
    "Jewelry",
    "Other",
  ]

  const locations = [
    "Main Building (MB)",
    "Silver Jubilee Tower (SJT)",
    "Technology Tower (TT)",
    "Pearl Research Park (PRP)",
    "Sri M. Vishweshwaraiah Building (SMV Block)",
    "GDN Block",
    "CBMR Building",
    "Library",
    "Anna Auditorium",
    "MB Auditorium",
    "Dr. M. Channa Reddy Auditorium",
    "Foodys (SMV)",
    "Foodys (SJT)",
    "Other",
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, image: file })
    }
  }

  const handleSubmitFoundItem = (e: React.FormEvent) => {
    e.preventDefault()

    const newItem = {
      id: foundItems.length + 1,
      itemName: formData.itemName,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      dateFound: formData.dateFound,
      finderName: "Current User",
      finderEmail: "user@vitstudent.ac.in",
      finderPhone: "+91 9876543216",
      reward: "",
      image: formData.image ? URL.createObjectURL(formData.image) : "/found-item.jpg",
      status: "available" as const,
    }

    setFoundItems([newItem, ...foundItems])

    setFormData({
      itemName: "",
      category: "",
      description: "",
      location: "",
      dateFound: "",
      image: null,
    })
    setShowReportForm(false)

    const existingReports = JSON.parse(localStorage.getItem("userReports") || "[]")
    const reportData = {
      ...newItem,
      type: "found",
      reportedBy: "user@vitstudent.ac.in",
      reportedAt: new Date().toISOString(),
    }
    localStorage.setItem("userReports", JSON.stringify([reportData, ...existingReports]))
  }

  const filteredItems = useMemo(() => {
    return foundItems.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      const matchesLocation = selectedLocation === "all" || item.location === selectedLocation
      const matchesStatus = selectedStatus === "all" || item.status === selectedStatus

      return matchesSearch && matchesCategory && matchesLocation && matchesStatus
    })
  }, [searchTerm, selectedCategory, selectedLocation, selectedStatus, foundItems])

  const handleContactFinder = (item: (typeof foundItems)[0]) => {
    alert(`Contact ${item.finderName} at ${item.finderEmail} or ${item.finderPhone}`)
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Browse Found Items</h1>
          <p className="text-muted-foreground">Search through items found by your fellow VIT students</p>
        </div>

        <div className="mb-8">
          {!showReportForm ? (
            <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">Found an item?</h3>
                  <p className="text-muted-foreground mb-4">Help a fellow student by reporting what you found</p>
                  <Button onClick={() => setShowReportForm(true)} className="bg-primary hover:bg-primary/90">
                    Report Found Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Report Found Item</CardTitle>
                  <CardDescription>Fill in the details of the item you found</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowReportForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitFoundItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-18">
                      <Label htmlFor="itemName">Item Name *</Label>
                      <Input
                        id="itemName"
                        value={formData.itemName}
                        onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                        placeholder="e.g., iPhone 13, Blue Backpack"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location Found *</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => setFormData({ ...formData, location: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Where did you find it?" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateFound">Date Found *</Label>
                      <Input
                        id="dateFound"
                        type="date"
                        value={formData.dateFound}
                        onChange={(e) => setFormData({ ...formData, dateFound: e.target.value })}
                        max={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the item in detail (color, brand, condition, etc.)"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Upload Image</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input id="image" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <label htmlFor="image" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {formData.image ? formData.image.name : "Click to upload an image"}
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Report Found Item
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowReportForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <div className="text-sm text-muted-foreground">{filteredItems.length} items found</div>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="claimed">Claimed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-1">
                <div className="aspect-square bg-muted relative">
                  <img
                    src={item.image || "/placeholder.svg?height=300&width=300&query=found item"}
                    alt={item.itemName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={item.status === "available" ? "default" : "secondary"}>
                      {item.status === "available" ? "Available" : "Claimed"}
                    </Badge>
                  </div>
                  {item.reward && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                        <Gift className="w-3 h-3 mr-1" />
                        {item.reward}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{item.itemName}</CardTitle>
                  <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.dateFound}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Found by:</span> {item.finderName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {item.finderEmail}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <Link href={`/items/${item.id}`}>
                      <Button variant="outline" className="w-full bg-orange-25 border-orange-100 text-orange-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-800 hover:shadow-[0_0_15px_rgba(251,146,60,0.3)] transition-all duration-200 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-300 dark:hover:bg-orange-900/30 dark:hover:border-orange-700/60">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/chat/${item.id}`}>
                      <Button
                        className="w-full bg-blue-25 border border-blue-100 text-blue-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-200 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300 dark:hover:bg-blue-900/30 dark:hover:border-blue-700/60"
                        variant="outline"
                        disabled={item.status === "claimed"}
                      >
                        {item.status === "available" ? "Contact Finder" : "Already Claimed"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-heading font-semibold text-lg mb-2">Can't find your item?</h3>
            <p className="text-muted-foreground mb-4">Report your lost item so others can help you find it</p>
            <Link href="/report">
              <Button>Report Lost Item</Button>
            </Link>
          </div>
        </div>
      </main>
      </div>
    </PageTransition>
  )
}
