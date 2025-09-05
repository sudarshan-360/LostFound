"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, MapPin, Calendar, Phone, Mail, Package, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Report {
  id: string
  itemName: string
  category: string
  description: string
  location: string
  date: string
  contactName: string
  contactEmail: string
  contactPhone: string
  reward?: string
  status: "lost" | "found"
  images?: string[]
  createdAt: string
}

export default function MyReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "lost" | "found">("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load reports from localStorage
    const loadReports = () => {
      try {
        const storedReports = localStorage.getItem("userReports")
        if (storedReports) {
          const parsedReports = JSON.parse(storedReports)
          setReports(parsedReports)
          setFilteredReports(parsedReports)
        }
      } catch (error) {
        console.error("Error loading reports:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [])

  useEffect(() => {
    // Filter reports based on search and status
    let filtered = reports

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter)
    }

    setFilteredReports(filtered)
  }, [reports, searchTerm, statusFilter])

  const handleEdit = (report: Report) => {
    // Store the report data for editing
    localStorage.setItem("editingReport", JSON.stringify(report))
    // Navigate to the appropriate edit page based on report type
    if (report.status === "lost") {
      window.location.href = "/report-lost?edit=true"
    } else {
      window.location.href = "/report-found?edit=true"
    }
  }

  const handleDelete = (reportId: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      const updatedReports = reports.filter((report) => report.id !== reportId)
      setReports(updatedReports)
      localStorage.setItem("userReports", JSON.stringify(updatedReports))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading your reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
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
                <Package className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-lg text-white">Lost & Found VIT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">My Reports</h1>
          <p className="text-zinc-400">Manage all your reported lost and found items</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <Input
              placeholder="Search by item name, category, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: "all" | "lost" | "found") => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48 bg-zinc-900/50 border-zinc-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all" className="text-white hover:bg-zinc-800">All Reports</SelectItem>
              <SelectItem value="lost" className="text-white hover:bg-zinc-800">Lost Items</SelectItem>
              <SelectItem value="found" className="text-white hover:bg-zinc-800">Found Items</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-semibold mb-2 text-white">
              {reports.length === 0 ? "No Reports Yet" : "No Matching Reports"}
            </h3>
            <p className="text-zinc-400 mb-6">
              {reports.length === 0
                ? "You haven't reported any items yet. Start by reporting a lost or found item."
                : "Try adjusting your search or filter criteria."}
            </p>
            {reports.length === 0 && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" asChild>
                  <Link href="/report">Report Lost Item</Link>
                </Button>
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" asChild>
                  <Link href="/browse-found">Browse Found Items</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow bg-zinc-900/50 backdrop-blur-xl border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-heading line-clamp-1 text-white">{report.itemName}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant={report.status === "lost" ? "destructive" : "default"} className={report.status === "lost" ? "bg-red-900/30 text-red-400 border-red-800" : "bg-gradient-to-b from-primary to-primary/80 text-primary-foreground border-primary/50"}>
                          {report.status === "lost" ? "Lost" : "Found"}
                        </Badge>
                        <span className="text-sm text-zinc-400">{report.category}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-zinc-400 line-clamp-2">{report.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span>{report.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>{formatDate(report.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="truncate">{report.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span>{report.contactPhone}</span>
                    </div>
                  </div>

                  {report.reward && (
                    <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-400">Reward: {report.reward}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      onClick={() => handleEdit(report)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      className="border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-700">
                    Reported on {formatDate(report.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
