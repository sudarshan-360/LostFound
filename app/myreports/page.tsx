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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <Package className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg">Lost & Found VIT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">My Reports</h1>
          <p className="text-muted-foreground">Manage all your reported lost and found items</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by item name, category, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: "all" | "lost" | "found") => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="lost">Lost Items</SelectItem>
              <SelectItem value="found">Found Items</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-heading font-semibold mb-2">
              {reports.length === 0 ? "No Reports Yet" : "No Matching Reports"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {reports.length === 0
                ? "You haven't reported any items yet. Start by reporting a lost or found item."
                : "Try adjusting your search or filter criteria."}
            </p>
            {reports.length === 0 && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/report">Report Lost Item</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/browse-found">Browse Found Items</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-heading line-clamp-1">{report.itemName}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant={report.status === "lost" ? "destructive" : "default"}>
                          {report.status === "lost" ? "Lost" : "Found"}
                        </Badge>
                        <span className="text-sm">{report.category}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{report.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(report.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{report.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{report.contactPhone}</span>
                    </div>
                  </div>

                  {report.reward && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <p className="text-sm font-medium text-primary">Reward: {report.reward}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 bg-transparent"
                      onClick={() => handleEdit(report)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t">
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
