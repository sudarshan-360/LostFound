"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Search,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle,
  ArrowLeft,
  Mail,
  Phone,
  Eye,
  RefreshCw,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { itemsApi, type Item } from "@/lib/api";
import { getMyReports, type Report } from "@/lib/reports-api";
import { toast } from "@/hooks/use-toast";

// Transform API Item to display format
interface DisplayReport extends Omit<Item, "location" | "user"> {
  itemName: string;
  date: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  type: "lost" | "found";
  reward?: string;
}

export default function MyReports() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<DisplayReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<DisplayReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Available" | "Claimed" | "Removed" | "Completed"
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "lost" | "found">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "lost" | "found";
    name: string;
  } | null>(null);

  // Function to refresh reports
  const refreshReports = async () => {
    if (status !== "authenticated") return;

    try {
      setIsLoading(true);
      setError(null);

      console.log("My Reports - Refreshing user reports...");
      const response = await getMyReports({
        limit: 100, // Get all user reports
      });

      console.log(
        "My Reports - Refresh API Response:",
        JSON.stringify(response, null, 2)
      );

      if (
        response.success &&
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        // Transform API data to display format
        const transformedReports: DisplayReport[] = response.data.items.map(
          (item: Report) => {
            const locationText = item.location?.text || "";

            return {
              _id: item._id,
              title: item.title,
              description: item.description,
              category: item.category,
              status: item.status,
              contactInfo: item.contactInfo,
              images: item.images,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              itemName: item.title || "Untitled",
              date:
                item.createdAt?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              contactName: item.userId?.name || "Anonymous",
              contactEmail: item.contactInfo?.email || item.userId?.email || "",
              contactPhone: item.contactInfo?.phone || item.userId?.phone || "",
              location: locationText,
              type: item.type || "lost",
            };
          }
        );

        console.log(
          "My Reports - Refreshed reports:",
          transformedReports.length
        );
        setReports(transformedReports);
      } else if (response.success && response.data && !response.data.items) {
        // API returned success but no items array - set empty array
        setReports([]);
      } else {
        console.error("Failed to refresh reports:", response);
        const errorMessage =
          response.error || "Failed to load your reports. Please try again.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        setReports([]);
      }
    } catch (err) {
      console.error("Error refreshing reports:", err);
      setError("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication and fetch reports
  useEffect(() => {
    console.log("My Reports - Status:", status);
    console.log("My Reports - Session:", session);

    if (status === "loading") return; // Still loading session

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/myreports");
      return;
    }

    if (status === "authenticated" && session?.user) {
      refreshReports();
    }
  }, [status, router, session]);

  // Refresh reports when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        status === "authenticated"
      ) {
        console.log("Page became visible, refreshing reports...");
        refreshReports();
      }
    };

    const handleReportsRefresh = () => {
      if (status === "authenticated") {
        console.log("Reports refresh event received, refreshing...");
        refreshReports();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("reports-refresh", handleReportsRefresh);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("reports-refresh", handleReportsRefresh);
    };
  }, [status]);

  // Filter reports based on search, status, and type
  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((report) => report.type === typeFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, typeFilter]);

  const handleView = (report: DisplayReport) => {
    // Navigate to the item details page (read-only)
    router.push(`/items/${report._id}`);
  };

  const handleDeleteClick = (
    reportId: string,
    reportType: "lost" | "found",
    itemName: string
  ) => {
    setItemToDelete({ id: reportId, type: reportType, name: itemName });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      let response;
      if (itemToDelete.type === "lost") {
        response = await itemsApi.deleteLostItem(itemToDelete.id);
      } else {
        response = await itemsApi.deleteFoundItem(itemToDelete.id);
      }

      if (response.success) {
        setReports((prev) =>
          prev.filter((report) => report._id !== itemToDelete.id)
        );
        toast({
          title: "Success",
          description: "Report deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleMarkCompleted = async (
    reportId: string,
    reportType: "lost" | "found"
  ) => {
    const confirmMessage =
      reportType === "lost"
        ? "Mark this lost item as returned to owner?"
        : "Mark this found item as claimed by finder?";

    if (!confirm(confirmMessage)) return;

    try {
      let response;
      if (reportType === "lost") {
        response = await itemsApi.markLostItemCompleted(reportId);
      } else {
        response = await itemsApi.markFoundItemCompleted(reportId);
      }

      if (response.success) {
        // Update the report status in the local state
        setReports((prev) =>
          prev.map((report) =>
            report._id === reportId
              ? { ...report, status: "Completed" as const }
              : report
          )
        );
        toast({
          title: "Success",
          description: `Item marked as ${
            reportType === "lost" ? "returned" : "claimed"
          } successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (report: DisplayReport) => {
    router.push(`/items/${report._id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="container mx-auto px-4 py-2">
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
              <span className="font-heading font-bold text-lg text-white">
                Lost & Found VIT
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshReports}
              disabled={isLoading}
              className="ml-auto bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            My Reports
          </h1>
          <p className="text-zinc-400 mb-4">
            Manage all your reported lost and found items
          </p>

          {/* Summary Stats */}
          {reports.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-zinc-900/50 rounded-lg px-4 py-2 border border-zinc-700">
                <span className="text-zinc-400">Total Reports: </span>
                <span className="text-white font-semibold">
                  {reports.length}
                </span>
              </div>
              <div className="bg-zinc-900/50 rounded-lg px-4 py-2 border border-zinc-700">
                <span className="text-zinc-400">Lost Items: </span>
                <span className="text-red-400 font-semibold">
                  {reports.filter((r) => r.type === "lost").length}
                </span>
              </div>
              <div className="bg-zinc-900/50 rounded-lg px-4 py-2 border border-zinc-700">
                <span className="text-zinc-400">Found Items: </span>
                <span className="text-green-400 font-semibold">
                  {reports.filter((r) => r.type === "found").length}
                </span>
              </div>
              <div className="bg-zinc-900/50 rounded-lg px-4 py-2 border border-zinc-700">
                <span className="text-zinc-400">Completed: </span>
                <span className="text-blue-400 font-semibold">
                  {reports.filter((r) => r.status === "Completed").length}
                </span>
              </div>
            </div>
          )}
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
          <Select
            value={typeFilter}
            onValueChange={(value: "all" | "lost" | "found") =>
              setTypeFilter(value)
            }
          >
            <SelectTrigger className="w-full sm:w-32 bg-zinc-900/50 border-zinc-700 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all" className="text-white hover:bg-zinc-800">
                All Types
              </SelectItem>
              <SelectItem value="lost" className="text-white hover:bg-zinc-800">
                Lost Items
              </SelectItem>
              <SelectItem
                value="found"
                className="text-white hover:bg-zinc-800"
              >
                Found Items
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(
              value: "all" | "Available" | "Claimed" | "Removed" | "Completed"
            ) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-32 bg-zinc-900/50 border-zinc-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all" className="text-white hover:bg-zinc-800">
                All Status
              </SelectItem>
              <SelectItem
                value="Available"
                className="text-white hover:bg-zinc-800"
              >
                Available
              </SelectItem>
              <SelectItem
                value="Claimed"
                className="text-white hover:bg-zinc-800"
              >
                Claimed
              </SelectItem>
              <SelectItem
                value="Completed"
                className="text-white hover:bg-zinc-800"
              >
                Completed
              </SelectItem>
              <SelectItem
                value="Removed"
                className="text-white hover:bg-zinc-800"
              >
                Removed
              </SelectItem>
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
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  asChild
                >
                  <Link href="/report-lost">Report Lost Item</Link>
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600 text-white"
                  asChild
                >
                  <Link href="/report-found">Report Found Item</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  asChild
                >
                  <Link href="/browse-found">Browse Found Items</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Link
                key={report._id}
                href={`/items/${report._id}`}
                className="block"
              >
                <Card className="hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-500 bg-zinc-900/50 backdrop-blur-xl border-zinc-800 hover:border-zinc-700 group overflow-hidden rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 hover:-translate-y-2 hover:scale-[1.02] transform cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-heading line-clamp-1 text-white">
                          {report.itemName}
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-sm mt-1">
                          {report.category}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Image Section with Unified Status Badge */}
                  <div className="relative overflow-hidden">
                    {report.images && report.images.length > 0 ? (
                      <Image
                        src={
                          typeof report.images[0] === "string"
                            ? report.images[0]
                            : (report.images[0] as { url: string })?.url ||
                              "/placeholder.jpg"
                        }
                        alt={report.itemName}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-48 bg-zinc-800 flex items-center justify-center">
                        <Package className="w-12 h-12 text-zinc-600" />
                      </div>
                    )}

                    {/* Unified Status Badge */}
                    <div className="absolute top-3 left-3 group-hover:scale-110 transition-transform duration-300">
                      <Badge
                        variant={
                          report.status === "Completed"
                            ? "default"
                            : report.type === "lost"
                            ? "destructive"
                            : "default"
                        }
                        className={
                          report.status === "Completed"
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/30"
                            : report.type === "lost"
                            ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30"
                            : "bg-gradient-to-b from-primary to-primary/80 text-primary-foreground border-primary/50 shadow-lg shadow-blue-900/30"
                        }
                      >
                        {report.status === "Completed"
                          ? "Completed"
                          : report.type === "lost"
                          ? "Lost"
                          : "Found"}
                      </Badge>
                    </div>

                    {/* Reward Badge */}
                    {report.reward && (
                      <div className="absolute top-3 right-3 group-hover:scale-110 transition-transform duration-300">
                        <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-900/30 group-hover:shadow-xl group-hover:shadow-yellow-900/40">
                          <Gift className="w-3 h-3 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                          {report.reward}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {report.description}
                    </p>

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
                        <p className="text-sm font-medium text-green-400">
                          Reward: {report.reward}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3 pt-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-zinc-900/30 hover:scale-105 group-hover:border-zinc-600"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleViewDetails(report);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClick(
                              report._id,
                              report.type,
                              report.itemName
                            );
                          }}
                          className="flex-1 border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-300 hover:shadow-lg hover:shadow-red-900/30 hover:scale-105"
                        >
                          <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          Delete
                        </Button>
                      </div>

                      {/* Mark as Completed button - only show if not already completed */}
                      {report.status !== "Completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-green-900/20 border-green-800 text-green-400 hover:bg-green-900/30 hover:text-green-300 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/30 hover:scale-105"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkCompleted(report._id, report.type);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          {report.type === "lost"
                            ? "Mark as Returned"
                            : "Mark as Claimed"}
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-700">
                      Reported on {formatDate(report.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete report
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Permanently delete{" "}
              <strong className="text-white">'{itemToDelete?.name}'</strong>?
              This action removes the item from the public feed and search, and
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => setDeleteModalOpen(false)}
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
