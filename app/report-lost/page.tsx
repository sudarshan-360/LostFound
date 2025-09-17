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
import {
  ArrowLeft,
  Upload,
  X,
  Phone,
  Mail,
  Camera,
  Search,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { itemsApi, uploadApi, handleApiError } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import FaissMatches from "@/components/faiss-matches";
import MatchResultsModal from "@/components/match-results-modal";
import { MatchResult } from "@/lib/faissClient";

// Removed unused FoundItem interface to satisfy lint

export default function ReportLostItem() {
  const { data: session, status } = useSession();
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
  const [faissMatches, setFaissMatches] = useState<MatchResult[] | null>(null);
  const [totalFoundItems, setTotalFoundItems] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [preCheckMatches, setPreCheckMatches] = useState<MatchResult[]>([]);
  const [preCheckTotalItems, setPreCheckTotalItems] = useState<number>(0);
  const [isCheckingMatches, setIsCheckingMatches] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check authentication status
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/report-lost");
    }
  }, [status, router]);

  // Pre-fill contact info from session
  useEffect(() => {
    if (session?.user && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        contactName: session.user.name || "",
        contactEmail: session.user.email || "",
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
          dateLost: report.date || "",
          contactName: report.contactName || "",
          contactEmail: report.contactEmail || "",
          contactPhone: report.contactPhone || "",
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload images";
      setError(errorMessage);

      // If upload service is unavailable, allow continuing without images
      if (errorMessage.includes("temporarily unavailable")) {
        console.log(
          "Image upload temporarily unavailable, continuing without images"
        );
        // Don't block the form submission for service unavailability
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Removed unused findMatchingItems helper

  const checkForMatches = async () => {
    setIsCheckingMatches(true);
    setError(null);

    try {
      const response = await fetch("/api/faiss/check-lost-matches", {
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
          date: formData.dateLost,
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
        dateLost: formData.dateLost,
        images: uploadedImages,
        contactInfo: {
          email: formData.contactEmail,
          phone: formData.contactPhone,
        },
      };

      let result;
      if (isEditMode && editingReportId) {
        // Update existing item
        result = await itemsApi.updateLostItem(editingReportId, itemData);
      } else {
        // Create new item
        result = await itemsApi.createLostItem(itemData);
      }

      if (result.success) {
        setSuccess(
          isEditMode
            ? "Lost item updated successfully!"
            : "Lost item reported successfully!"
        );

        // Handle FAISS matches if available
        if (result.data?.faiss_matches) {
          setFaissMatches(result.data.faiss_matches.matches || []);
          setTotalFoundItems(result.data.faiss_matches.total_found_items || 0);
        }

        // Trigger refresh event for My Reports page
        document.dispatchEvent(new CustomEvent("reports-refresh"));

        // Only redirect if not in edit mode and no matches found
        if (
          !isEditMode &&
          (!result.data?.faiss_matches ||
            result.data.faiss_matches.matches.length === 0)
        ) {
          setTimeout(() => {
            router.push("/browse-lost");
          }, 2000);
        }
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
            {isEditMode ? "Edit Lost Item Report" : "Report Lost Item"}
          </h1>
          <p className="text-zinc-400">
            {isEditMode
              ? "Update your lost item information"
              : "Help us find your lost item by providing detailed information"}
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
                : "Provide detailed information to help us match your item with found items"}
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

            {/* FAISS Matches */}
            {faissMatches && (
              <FaissMatches
                matches={faissMatches}
                totalFoundItems={totalFoundItems}
                onViewDetails={(itemId) => router.push(`/items/${itemId}`)}
              />
            )}

            {/* Match Results Modal */}
            <MatchResultsModal
              isOpen={showMatchModal}
              onClose={() => setShowMatchModal(false)}
              onConfirm={handleConfirmSubmit}
              onCancel={handleCancelSubmit}
              matches={preCheckMatches}
              totalItems={preCheckTotalItems}
              itemType="lost"
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail (color, brand, distinctive features, etc.)"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                  rows={4}
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
                    Last Seen Location *
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

              {/* Date Lost */}
              <div className="space-y-2">
                <Label htmlFor="dateLost" className="text-white">
                  Date Lost *
                </Label>
                <DatePicker
                  date={selectedDate}
                  onDateChange={(date) => {
                    setSelectedDate(date);
                    handleInputChange(
                      "dateLost",
                      date ? date.toISOString().split("T")[0] : ""
                    );
                  }}
                  placeholder="Select the date when item was lost"
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Contact Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-white">
                    Your Name *
                  </Label>
                  <Input
                    id="contactName"
                    placeholder="Enter your full name"
                    value={formData.contactName}
                    onChange={(e) =>
                      handleInputChange("contactName", e.target.value)
                    }
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-white">
                      Email *
                    </Label>
                    <div className="relative">
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="your.email@vit.ac.in"
                        value={formData.contactEmail}
                        onChange={(e) =>
                          handleInputChange("contactEmail", e.target.value)
                        }
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                        required
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-white">
                      Phone Number *
                    </Label>
                    <div className="relative">
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={formData.contactPhone}
                        onChange={(e) =>
                          handleInputChange("contactPhone", e.target.value)
                        }
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
                  <Label className="text-white">
                    Photos of the Item (Optional)
                  </Label>
                </div>
                <p className="text-sm text-zinc-400">
                  Upload up to 3 photos to help identify your item
                </p>
                {error && error.includes("temporarily unavailable") && (
                  <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                    ⚠️ Image upload is temporarily unavailable, but you can
                    still submit your report without photos.
                  </div>
                )}

                {uploadedImages.length < 3 && (
                  <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors bg-zinc-800/30">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={isUploading}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                      <p className="text-sm text-zinc-400">
                        {isUploading
                          ? "Uploading..."
                          : "Click to upload images"}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        JPEG, PNG, WebP • Max 5MB per image
                      </p>
                    </label>
                  </div>
                )}

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((imageData, index) => (
                      <div key={index} className="relative group aspect-square">
                        <Image
                          src={imageData.url}
                          alt={`Upload ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    {isEditMode
                      ? "Update Lost Item Report"
                      : "Report Lost Item"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
