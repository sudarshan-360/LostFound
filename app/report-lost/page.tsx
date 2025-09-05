"use client"

import type React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, X, Calendar, Phone, Mail, Camera, Search } from "lucide-react"
import Link from "next/link"
import { DatePicker } from "@/components/ui/date-picker"

interface FoundItem {
  id: string
  itemName: string
  description: string
  category: string
  location: string
  date: string
  status: "found"
  images?: string[]
  contactName: string
  contactEmail: string
  contactPhone: string
  createdAt: string
}

export default function ReportLostItem() {
  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    category: "",
    location: "",
    customLocation: "",
    dateLost: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [matchingItems, setMatchingItems] = useState<FoundItem[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if we're in edit mode and load existing data
  useEffect(() => {
    const isEdit = searchParams.get('edit') === 'true'
    if (isEdit) {
      const editingReport = localStorage.getItem('editingReport')
      if (editingReport) {
        const report = JSON.parse(editingReport)
        setIsEditMode(true)
        setEditingReportId(report.id)
        setFormData({
          itemName: report.itemName || "",
          description: report.description || "",
          category: report.category || "",
          location: report.location || "",
          customLocation: report.customLocation || "",
          dateLost: report.date || "",
          contactName: report.contactName || "",
          contactEmail: report.contactEmail || "",
          contactPhone: report.contactPhone || "",
        })
        if (report.date) {
          setSelectedDate(new Date(report.date))
        }
        // Clear the editing report from localStorage
        localStorage.removeItem('editingReport')
      }
    }
  }, [searchParams])

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length <= 3) {
      setImages((prev) => [...prev, ...files])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Function to find matching found items
  const findMatchingItems = (lostItem: typeof formData): FoundItem[] => {
    const foundItems: FoundItem[] = JSON.parse(localStorage.getItem("userReports") || "[]")
      .filter((item: any) => item.status === "found")
    
    return foundItems.filter((foundItem) => {
      // Match by category
      const categoryMatch = foundItem.category === lostItem.category
      
      // Match by location (same or nearby)
      const locationMatch = foundItem.location === lostItem.location
      
      // Match by item name (partial match)
      const nameMatch = foundItem.itemName.toLowerCase().includes(lostItem.itemName.toLowerCase()) ||
                       lostItem.itemName.toLowerCase().includes(foundItem.itemName.toLowerCase())
      
      // Match by description (partial match)
      const descriptionMatch = foundItem.description.toLowerCase().includes(lostItem.description.toLowerCase()) ||
                              lostItem.description.toLowerCase().includes(foundItem.description.toLowerCase())
      
      // Date proximity (within 7 days)
      const lostDate = new Date(lostItem.dateLost)
      const foundDate = new Date(foundItem.date)
      const daysDifference = Math.abs((foundDate.getTime() - lostDate.getTime()) / (1000 * 60 * 60 * 24))
      const dateMatch = daysDifference <= 7
      
      // Return true if at least 2 criteria match
      const matches = [categoryMatch, locationMatch, nameMatch, descriptionMatch, dateMatch]
      return matches.filter(Boolean).length >= 2
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const reportData = {
      id: isEditMode ? editingReportId : Date.now().toString(),
      ...formData,
      date: formData.dateLost,
      status: "lost" as const,
      images: images.map((img) => img.name), // In real app, would be uploaded URLs
      createdAt: isEditMode ? undefined : new Date().toISOString(),
    }

    // Get existing reports
    const existingReports = JSON.parse(localStorage.getItem("userReports") || "[]")
    
    let updatedReports
    if (isEditMode && editingReportId) {
      // Update existing report
      updatedReports = existingReports.map((report: any) => 
        report.id === editingReportId ? { ...report, ...reportData } : report
      )
    } else {
      // Add new report
      updatedReports = [...existingReports, reportData]
    }
    
    localStorage.setItem("userReports", JSON.stringify(updatedReports))

    setIsSubmitting(false)

    if (isEditMode) {
      // Redirect back to myreports page after editing
      router.push("/myreports")
    } else {
      // Find matching found items for new reports
      const matches = findMatchingItems(formData)
      setMatchingItems(matches)
      
      localStorage.setItem("reportedItem", JSON.stringify(reportData))
      localStorage.setItem("matchingItems", JSON.stringify(matches))
      
      // Redirect to matches page to see potential found items that match this lost item
      router.push("/matches")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 relative">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-400 hover:text-blue-500 transition-colors"
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
      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            {isEditMode ? "Edit Lost Item Report" : "Report Lost Item"}
          </h1>
          <p className="text-zinc-400">
            {isEditMode 
              ? "Update your lost item information" 
              : "Help us find your lost item by providing detailed information"
            }
          </p>
        </div>

        <Card className="shadow-lg bg-zinc-900/50 backdrop-blur-xl border border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Search className="w-5 h-5 text-blue-500" />
              {isEditMode ? "Edit Lost Item Details" : "Lost Item Details"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {isEditMode 
                ? "Update the information about your lost item" 
                : "Provide detailed information to help us match your item with found items"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="itemName" className="text-white">Item Name *</Label>
                <Input
                  id="itemName"
                  placeholder="e.g., iPhone 13, Blue Backpack, Physics Textbook"
                  value={formData.itemName}
                  onChange={(e) => handleInputChange("itemName", e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail (color, brand, distinctive features, etc.)"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                  rows={4}
                  required
                />
              </div>

              {/* Category and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
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
                  <Label htmlFor="location" className="text-white">Last Seen Location *</Label>
                  <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
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

                {/* Custom Location Input - shown when "Other" is selected */}
                {formData.location === "Other" && (
                  <div className="space-y-2">
                    <Label htmlFor="customLocation" className="text-white">Please specify location *</Label>
                    <Input
                      id="customLocation"
                      placeholder="Enter specific location"
                      value={formData.customLocation}
                      onChange={(e) => handleInputChange("customLocation", e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Date Lost */}
              <div className="space-y-2">
                <Label htmlFor="dateLost" className="text-white">Date Lost *</Label>
                <DatePicker
                  date={selectedDate}
                  onDateChange={(date) => {
                    setSelectedDate(date)
                    handleInputChange("dateLost", date ? date.toISOString().split('T')[0] : "")
                  }}
                  placeholder="Select the date when item was lost"
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-white">Your Name *</Label>
                  <Input
                    id="contactName"
                    placeholder="Enter your full name"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-white">Email *</Label>
                    <div className="relative">
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="your.email@vit.ac.in"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                        required
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-white">Phone Number *</Label>
                    <div className="relative">
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                        required
                      />
                      <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500" />
                  <Label className="text-white">Photos of the Item (Optional)</Label>
                </div>
                <p className="text-sm text-zinc-400">Upload up to 3 photos to help identify your item</p>
                
                {images.length < 3 && (
                  <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors bg-zinc-800/30">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                      <p className="text-sm text-zinc-400">Click to upload images</p>
                    </label>
                  </div>
                )}

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-zinc-800 rounded-lg flex items-center justify-center">
                          <Camera className="w-8 h-8 text-zinc-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-zinc-400 mt-1 truncate">{image.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    {isEditMode ? "Updating Report..." : "Submitting Report..."}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    {isEditMode ? "Update Lost Item Report" : "Report Lost Item"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
