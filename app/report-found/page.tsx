"use client";

import type React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  X,
  Calendar,
  Phone,
  Mail,
  Camera,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { itemsApi, uploadApi, handleApiError } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MatchResultsModal from "@/components/match-results-modal";
import { MatchResult } from "@/lib/faissClient";

export default function ReportFoundItem() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    category: "",
    location: "",
    customLocation: "",
    dateFound: "",
    finderName: "",
    finderEmail: "",
    finderPhone: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [images, setImages] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<
    { url: string; publicId: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [preCheckMatches, setPreCheckMatches] = useState<MatchResult[]>([]);
  const [preCheckTotalItems, setPreCheckTotalItems] = useState<number>(0);
  const [isCheckingMatches, setIsCheckingMatches] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check authentication status
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/report-found");
    }
  }, [status, router]);

  // Pre-fill contact info from session
  useEffect(() => {
    if (session?.user && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        finderName: session.user.name || "",
        finderEmail: session.user.email || "",
      }));
    }
  }, [session, isEditMode]);

  // Check if we're in edit mode and load existing data
  useEffect(() => {
    const isEdit = searchParams.get("edit") === "true";
    if (isEdit) {
      const editingReport = localStorage.getItem("editingReport");
      if (editingReport) {
        const report = JSON.parse(editingReport);
        setIsEditMode(true);
        setEditingReportId(report.id);
        setFormData({
          itemName: report.itemName || "",
          description: report.description || "",
          category: report.category || "",
          location: report.location || "",
          customLocation: report.customLocation || "",
          dateFound: report.date || "",
          finderName: report.contactName || "",
          finderEmail: report.contactEmail || "",
          finderPhone: report.contactPhone || "",
        });
        if (report.date) {
          setSelectedDate(new Date(report.date));
        }
        if (report.images) {
          setUploadedImages(report.images);
        }
        // Clear the editing report from localStorage
        localStorage.removeItem("editingReport");
      }
    }
  }, [searchParams]);

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
  ];

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
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + images.length + files.length > 3) {
      setError("You can upload a maximum of 3 images");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(async (file) => {
        const result = await uploadApi.uploadImage(file);
        if (result.success && result.data) {
          return { url: result.data.url, publicId: result.data.publicId };
        } else {
          throw new Error(result.error || "Upload failed");
        }
      });

      const uploadedImageData = await Promise.all(uploadPromises);
      setUploadedImages((prev) => [...prev, ...uploadedImageData]);
      setImages((prev) => [...prev, ...files]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to upload images"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to find matching lost items
  const findMatchingItems = (foundItem: typeof formData) => {
    const lostItems = JSON.parse(
      localStorage.getItem("userReports") || "[]"
    ).filter((item: any) => item.status === "lost");

    return lostItems.filter((lostItem: any) => {
      // Match by category
      const categoryMatch = lostItem.category === foundItem.category;

      // Match by location (same or nearby)
      const locationMatch = lostItem.location === foundItem.location;

      // Match by item name (partial match)
      const nameMatch =
        lostItem.itemName
          .toLowerCase()
          .includes(foundItem.itemName.toLowerCase()) ||
        foundItem.itemName
          .toLowerCase()
          .includes(lostItem.itemName.toLowerCase());

      // Match by description (partial match)
      const descriptionMatch =
        lostItem.description
          .toLowerCase()
          .includes(foundItem.description.toLowerCase()) ||
        foundItem.description
          .toLowerCase()
          .includes(lostItem.description.toLowerCase());

      // Date proximity (within 7 days)
      const foundDate = new Date(foundItem.dateFound);
      const lostDate = new Date(lostItem.date || lostItem.dateLost);
      const daysDifference = Math.abs(
        (foundDate.getTime() - lostDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const dateMatch = daysDifference <= 7;

      // Return true if at least 2 criteria match
      const matches = [
        categoryMatch,
        locationMatch,
        nameMatch,
        descriptionMatch,
        dateMatch,
      ];
      return matches.filter(Boolean).length >= 2;
    });
  };

  const checkForMatches = async () => {
    setIsCheckingMatches(true);
    setError(null);

    try {
      const response = await fetch("/api/faiss/check-found-matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item: formData.itemName,
          description: formData.description,
          location:
            formData.location === "Other"
              ? formData.customLocation
              : formData.location,
          date: formData.dateFound,
          contact_info: {
            email: formData.contactEmail,
            phone: formData.contactPhone,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPreCheckMatches(result.data.matches || []);
        setPreCheckTotalItems(result.data.total_found_items || 0);
        setShowMatchModal(true);
      } else {
        console.warn("Failed to check matches:", result.error);
        // Continue with submission even if match check fails
        await submitItem();
      }
    } catch (error) {
      console.warn("Error checking matches:", error);
      // Continue with submission even if match check fails
      await submitItem();
    } finally {
      setIsCheckingMatches(false);
    }
  };

  const submitItem = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.category) {
        setError("Please select a category for your item.");
        setIsSubmitting(false);
        return;
      }

      // Prepare item data
      const itemData = {
        title: formData.itemName,
        description: formData.description,
        category: formData.category,
        location:
          formData.location === "Other"
            ? formData.customLocation
            : formData.location,
        dateFound: formData.dateFound,
        images: uploadedImages,
        contactInfo: {
          email: formData.finderEmail,
          phone: formData.finderPhone,
        },
      };

      let result;
      if (isEditMode && editingReportId) {
        // Update existing item
        result = await itemsApi.updateFoundItem(editingReportId, itemData);
      } else {
        // Create new item
        result = await itemsApi.createFoundItem(itemData);
      }

      if (result.success) {
        setSuccess(
          isEditMode
            ? "Found item updated successfully!"
            : "Found item reported successfully!"
        );

        // Trigger refresh event for My Reports page
        document.dispatchEvent(new CustomEvent("reports-refresh"));

        // Redirect after success
        setTimeout(() => {
          if (isEditMode) {
            router.push("/myreports");
          } else {
            router.push("/browse-found");
          }
        }, 2000);
      } else {
        setError(handleApiError(result.error || "Failed to submit report"));
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for matches first
    await checkForMatches();
  };

  const handleConfirmSubmit = async () => {
    // User confirmed to submit despite matches
    await submitItem();
  };

  const handleCancelSubmit = () => {
    // User cancelled submission
    setShowMatchModal(false);
    setPreCheckMatches([]);
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800 relative">
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
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-lg text-white">
                Lost & Found VIT
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            {isEditMode ? "Edit Found Item Report" : "Report Found Item"}
          </h1>
          <p className="text-zinc-400">
            {isEditMode
              ? "Update the details of your found item report"
              : "Help reunite someone with their lost item by reporting what you found"}
          </p>
        </div>

        <Card className="shadow-lg bg-zinc-900/50 backdrop-blur-xl border border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              {isEditMode ? "Edit Found Item Details" : "Found Item Details"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {isEditMode
                ? "Update the information about the item you found"
                : "Provide detailed information to help the owner identify their item"}
            </CardDescription>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Match Results Modal */}
            <MatchResultsModal
              isOpen={showMatchModal}
              onClose={() => setShowMatchModal(false)}
              onConfirm={handleConfirmSubmit}
              onCancel={handleCancelSubmit}
              matches={preCheckMatches}
              totalItems={preCheckTotalItems}
              itemType="found"
              itemName={formData.itemName}
              onViewDetails={(itemId) => router.push(`/items/${itemId}`)}
            />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="itemName" className="text-white">
                  Item Name *
                </Label>
                <Input
                  id="itemName"
                  placeholder="e.g., iPhone 13, Blue Backpack, Physics Textbook"
                  value={formData.itemName}
                  onChange={(e) =>
                    handleInputChange("itemName", e.target.value)
                  }
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Category and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                    required
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
                  <Label htmlFor="location" className="text-white">
                    Found Location *
                  </Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      handleInputChange("location", value)
                    }
                  >
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
                    <Label htmlFor="customLocation" className="text-white">
                      Please specify location *
                    </Label>
                    <Input
                      id="customLocation"
                      placeholder="Enter specific location"
                      value={formData.customLocation}
                      onChange={(e) =>
                        handleInputChange("customLocation", e.target.value)
                      }
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Date Found */}
              <div className="space-y-2">
                <Label
                  htmlFor="dateFound"
                  className="flex items-center gap-2 text-white"
                >
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Date Found *
                </Label>
                <DatePicker
                  date={selectedDate}
                  onDateChange={(date) => {
                    setSelectedDate(date);
                    handleInputChange(
                      "dateFound",
                      date ? date.toISOString().split("T")[0] : ""
                    );
                  }}
                  placeholder="Select the date when item was found"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Detailed Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the item in detail - color, size, brand, unique features, condition, etc."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                  rows={4}
                  required
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-white">
                  <Camera className="w-4 h-4 text-blue-500" />
                  Photos (Optional, max 3)
                </Label>
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center bg-zinc-800/30">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={isUploading || uploadedImages.length >= 3}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer ${
                      isUploading || uploadedImages.length >= 3
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="text-sm text-zinc-400">
                      {isUploading
                        ? "Uploading..."
                        : "Click to upload images or drag and drop"}
                    </p>
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {uploadedImages.map((imageData, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageData.url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isUploading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-4 border-t border-zinc-700 pt-6">
                <h3 className="font-heading font-semibold flex items-center gap-2 text-white">
                  <Phone className="w-4 h-4 text-blue-500" />
                  Your Contact Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="finderName" className="text-white">
                    Your Name *
                  </Label>
                  <Input
                    id="finderName"
                    placeholder="Full name"
                    value={formData.finderName}
                    onChange={(e) =>
                      handleInputChange("finderName", e.target.value)
                    }
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="finderEmail"
                    className="flex items-center gap-2 text-white"
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    VIT Email *
                  </Label>
                  <Input
                    id="finderEmail"
                    type="email"
                    placeholder="your.name@vitstudent.ac.in"
                    value={formData.finderEmail}
                    onChange={(e) =>
                      handleInputChange("finderEmail", e.target.value)
                    }
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finderPhone" className="text-white">
                    Phone Number *
                  </Label>
                  <Input
                    id="finderPhone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.finderPhone}
                    onChange={(e) =>
                      handleInputChange("finderPhone", e.target.value)
                    }
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="lg"
                disabled={
                  isSubmitting ||
                  isUploading ||
                  isCheckingMatches ||
                  status === "loading"
                }
              >
                {isCheckingMatches ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Checking for matches...
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    {isEditMode ? "Updating Report..." : "Submitting Report..."}
                  </>
                ) : isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading Images...
                  </>
                ) : (
                  <>{isEditMode ? "Update Report" : "Report Found Item"}</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-zinc-400">
          <p>
            Your report will be visible to all VIT students. The owner can
            contact you directly!
          </p>
        </div>
      </main>
    </div>
  );
}
