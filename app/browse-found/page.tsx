"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Search,
  Filter,
  MapPin,
  Calendar,
  Mail,
  Gift,
  Upload,
  Plus,
  X,
  Phone,
  Package,
  Eye,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import PageTransition from "@/components/page-transition";
import { itemsApi, uploadApi, Item } from "@/lib/api";
import { useSession } from "next-auth/react";

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);
import Image from "next/image";

// Interface for found items display
interface FoundItemDisplay {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  location: string;
  images: string[];
  status: "active" | "resolved" | "completed";
  type: "lost" | "found";
  userId: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  category?: string;
  finderName?: string;
  finderEmail?: string;
  finderPhone?: string;
  reward?: string;
  itemName: string;
  dateFound?: string;
}

// API may return location as string or { text }
type ApiItem = Omit<
  Item,
  "location" | "status" | "user" | "userId" | "contactInfo"
> & {
  location?: string | { text?: string };
  status?: "Available" | "Claimed" | "Removed" | "Completed" | string;
  userId?: { name?: string; email?: string };
  user?: { name?: string; email?: string };
  contactInfo?: { email?: string; phone?: string };
};

// Mock data for found items (keeping for fallback)
const mockFoundItems = [
  {
    id: 1,
    itemName: "iPhone 13 Pro",
    description:
      "Black iPhone 13 Pro with a cracked screen protector. Found near the library entrance.",
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
    description:
      "Navy blue Wildcraft backpack with laptop compartment. Contains some notebooks.",
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
    description:
      "VIT student ID card belonging to Amit Kumar, Computer Science, 3rd year.",
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
    description:
      "White Apple AirPods Pro with charging case. Found in the sports complex.",
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
    description:
      "Resnick Halliday Krane Physics textbook, 5th edition. Has some notes written inside.",
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
    description:
      "Casio silver digital watch with metal strap. Battery seems to be working fine.",
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
];

// Helper function to clean contact names by removing registration numbers
const cleanContactName = (name: string) => {
  return name
    .replace(/\s*\([^)]*\)/g, "") // Remove anything in parentheses
    .replace(/\s*\[[^\]]*\]/g, "") // Remove anything in square brackets
    .replace(/\s*-\s*\d{4}$/g, "") // Remove year suffixes like "-2023"
    .replace(/\s*@.*$/g, "") // Remove email suffixes
    .replace(/\s+\d{8}$/g, "") // Remove 8-digit registration numbers like "23BAI0086"
    .replace(/\s+\d{2}[A-Z]{3}\d{4}$/g, "") // Remove registration patterns like "23BAI0086"
    .trim();
};

export default function BrowseFoundItems() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [foundItems, setFoundItems] = useState<FoundItemDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load found items from API
  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await itemsApi.getFoundItems();

        if (response.success && response.data) {
          // Transform API data to display format
          const transformedItems: FoundItemDisplay[] = response.data.items.map(
            (item: ApiItem) => {
              const locationText =
                typeof item.location === "string"
                  ? item.location
                  : item.location?.text ?? "";
              const normalizedStatus: "active" | "resolved" | "completed" =
                item.status === "Completed"
                  ? "completed"
                  : item.status === "Available"
                  ? "active"
                  : item.status === "Claimed"
                  ? "resolved"
                  : "active";
              const fallbackName = (
                item.contactInfo?.email ||
                item.user?.email ||
                ""
              )
                .split("@")[0]
                .replace(/[._-]+/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());

              // Extract images properly
              const imageUrls = Array.isArray(item.images)
                ? item.images.map((img) =>
                    typeof img === "string" ? img : img.url || ""
                  )
                : [];

              return {
                _id: item._id || "",
                title: item.title || "",
                description: item.description || "",
                tags: [],
                location: locationText,
                images: imageUrls,
                status: normalizedStatus,
                type: "found" as const,
                userId:
                  typeof (item as any).userId === "object" &&
                  ((item as any).userId as any)?._id
                    ? ((item as any).userId as any)._id
                    : "",
                user: (item as any).userId
                  ? {
                      _id: ((item as any).userId as any)._id || "",
                      name: (item as any).userId.name || "",
                      email: (item as any).userId.email || "",
                    }
                  : null,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt),
                isDeleted: false,
                category: item.category || "",
                finderName: cleanContactName(
                  (item as any).userId?.name || fallbackName || "Anonymous"
                ),
                finderEmail:
                  item.contactInfo?.email || (item as any).userId?.email || "",
                finderPhone:
                  item.contactInfo?.phone || (item as any).userId?.phone || "",
                reward: "",
                itemName: item.title || "Found Item",
                dateFound: item.dateFound || "",
              };
            }
          );
          setFoundItems(transformedItems);
        } else {
          setError("Failed to load found items");
          // Fallback to mock data
          const transformedMockItems: FoundItemDisplay[] = mockFoundItems.map(
            (item) => ({
              _id: item.id.toString(),
              title: item.itemName,
              description: item.description,
              tags: [],
              location: item.location,
              images: [item.image],
              status: item.status === "available" ? "active" : "resolved",
              type: "found" as const,
              userId: "",
              user: {
                _id: "",
                name: item.finderName,
                email: item.finderEmail,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              isDeleted: false,
              category: item.category,
              finderName: item.finderName,
              finderEmail: item.finderEmail,
              finderPhone: item.finderPhone,
              reward: item.reward,
              itemName: item.itemName,
              dateFound: item.dateFound,
            })
          );
          setFoundItems(transformedMockItems);
        }
      } catch (err) {
        console.error("Error fetching found items:", err);
        setError("Failed to load found items");
        // Fallback to mock data
        const transformedMockItems: FoundItemDisplay[] = mockFoundItems.map(
          (item) => ({
            _id: item.id.toString(),
            title: item.itemName,
            description: item.description,
            tags: [],
            location: item.location,
            images: [item.image],
            status: item.status === "available" ? "active" : "resolved",
            type: "found" as const,
            userId: "",
            user: {
              _id: "",
              name: item.finderName,
              email: item.finderEmail,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
            category: item.category,
            finderName: item.finderName,
            finderEmail: item.finderEmail,
            finderPhone: item.finderPhone,
            reward: item.reward,
            itemName: item.itemName,
            dateFound: item.dateFound,
          })
        );
        setFoundItems(transformedMockItems);
      } finally {
        setLoading(false);
      }
    };

    fetchFoundItems();
  }, []);
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    location: "",
    dateFound: "",
    image: null as File | null,
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + files.length > 3) {
      setError(
        `You can only upload up to 3 images. Currently have ${uploadedImages.length} images.`
      );
      return;
    }

    setIsUploading(true);
    setError(null);
    const newUploadedImages: string[] = [];
    let hasErrors = false;

    try {
      for (const file of files) {
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          setError(`File ${file.name} is too large. Maximum size is 5MB.`);
          hasErrors = true;
          continue;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          setError(`File ${file.name} is not a valid image.`);
          hasErrors = true;
          continue;
        }

        const result = await uploadApi.uploadImage(file);
        if (result.success && result.data) {
          newUploadedImages.push(result.data.url);
        } else {
          console.error("Upload failed:", result.error);
          setError(
            `Failed to upload ${file.name}: ${result.error || "Unknown error"}`
          );
          hasErrors = true;
        }
      }

      if (newUploadedImages.length > 0) {
        setUploadedImages((prev) => [...prev, ...newUploadedImages]);
        setFormData({ ...formData, image: files[0] });
        if (!hasErrors) {
          // Clear any previous errors if all uploads succeeded
          setError(null);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(
        "Failed to upload images. Please check your connection and try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitFoundItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      alert("Please sign in to report a found item");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const itemData = {
        title: formData.itemName,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        dateFound: formData.dateFound,
        contactInfo: {
          email: session.user?.email || "",
          phone: "+91 9876543216", // Default phone
        },
        images: uploadedImages,
      };

      const response = await itemsApi.createFoundItem(itemData);

      if (response.success && response.data) {
        // Add new item to the list
        const apiItem = response.data as Item;
        const newItem: FoundItemDisplay = {
          _id: apiItem._id || "",
          title: apiItem.title || "",
          description: apiItem.description || "",
          tags: [],
          location:
            (typeof apiItem.location === "string"
              ? apiItem.location
              : apiItem.location?.text) || "",
          images: Array.isArray(apiItem.images)
            ? apiItem.images.map((img) =>
                typeof img === "string" ? img : img.url || ""
              )
            : [],
          status: "active",
          type: "found" as const,
          userId:
            typeof (apiItem as any).userId === "object" &&
            ((apiItem as any).userId as any)?._id
              ? ((apiItem as any).userId as any)._id
              : "",
          user: (apiItem as any).userId
            ? {
                _id: ((apiItem as any).userId as any)._id || "",
                name: (apiItem as any).userId.name || "",
                email: (apiItem as any).userId.email || "",
              }
            : null,
          createdAt: new Date(apiItem.createdAt),
          updatedAt: new Date(apiItem.updatedAt),
          isDeleted: false,
          category: apiItem.category || "",
          finderName: cleanContactName(
            (apiItem as any).userId?.name || session?.user?.name || "Anonymous"
          ),
          finderEmail:
            apiItem.contactInfo?.email ||
            (apiItem as any).userId?.email ||
            session?.user?.email ||
            "",
          finderPhone:
            apiItem.contactInfo?.phone || (apiItem as any).userId?.phone || "",
          reward: "",
          itemName: apiItem.title || "Found Item",
          dateFound: apiItem.dateFound || "",
        };

        setFoundItems([newItem, ...foundItems]);

        // Reset form
        setFormData({
          itemName: "",
          category: "",
          description: "",
          location: "",
          dateFound: "",
          image: null,
        });
        setShowReportForm(false);

        alert("Found item reported successfully!");
      } else {
        setError(response.error || "Failed to report found item");
      }
    } catch (err) {
      console.error("Error submitting found item:", err);
      setError("Failed to report found item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    const filtered = foundItems.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const locationText =
        typeof item.location === "string" ? item.location : "";
      const matchesLocation =
        selectedLocation === "all" || locationText === selectedLocation;
      const matchesStatus =
        selectedStatus === "all" || item.status === selectedStatus;

      return (
        matchesSearch && matchesCategory && matchesLocation && matchesStatus
      );
    });

    // Sort items: active and resolved first, completed items at the bottom
    return filtered.sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return 0;
    });
  }, [
    searchTerm,
    selectedCategory,
    selectedLocation,
    selectedStatus,
    foundItems,
  ]);

  // Removed unused handleContactFinder to satisfy lint

  return (
    <PageTransition>
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

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
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <span className="font-heading font-bold text-lg text-white">
                  Lost & Found VIT
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 relative">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-white mb-2">
              Browse Found Items
            </h1>
            <p className="text-zinc-400">
              Search through items found by your fellow VIT students
            </p>
          </div>

          <div className="mb-8">
            {!showReportForm ? (
              <Card className="border-dashed border-2 border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2 text-white">
                      Found an item?
                    </h3>
                    <p className="text-zinc-400 mb-4">
                      Help a fellow student by reporting what you found
                    </p>
                    <Button
                      asChild
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Link href="/report-found">Report Found Item</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">
                      Report Found Item
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Fill in the details of the item you found
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReportForm(false)}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitFoundItem} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-18">
                        <Label htmlFor="itemName" className="text-zinc-300">
                          Item Name *
                        </Label>
                        <Input
                          id="itemName"
                          value={formData.itemName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              itemName: e.target.value,
                            })
                          }
                          placeholder="e.g., iPhone 13, Blue Backpack"
                          className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-zinc-300">
                          Category *
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white focus:border-blue-500">
                            <SelectValue
                              placeholder="Select category"
                              className="text-zinc-500"
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {categories.map((category) => (
                              <SelectItem
                                key={category}
                                value={category}
                                className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                              >
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-zinc-300">
                          Location Found *
                        </Label>
                        <Select
                          value={formData.location}
                          onValueChange={(value) =>
                            setFormData({ ...formData, location: value })
                          }
                        >
                          <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white focus:border-blue-500">
                            <SelectValue
                              placeholder="Where did you find it?"
                              className="text-zinc-500"
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {locations.map((location) => (
                              <SelectItem
                                key={location}
                                value={location}
                                className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                              >
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateFound" className="text-zinc-300">
                          Date Found *
                        </Label>
                        <Input
                          id="dateFound"
                          type="date"
                          value={formData.dateFound}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dateFound: e.target.value,
                            })
                          }
                          max={new Date().toISOString().split("T")[0]}
                          className="bg-zinc-900/50 border-zinc-700 text-white focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-zinc-300">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe the item in detail (color, brand, condition, etc.)"
                        className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image" className="text-zinc-300">
                        Upload Images (Max 3)
                      </Label>
                      <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center bg-zinc-900/30">
                        <input
                          id="image"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading || uploadedImages.length >= 3}
                        />
                        <label htmlFor="image" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                          <p className="text-sm text-zinc-400">
                            {isUploading
                              ? "Uploading..."
                              : uploadedImages.length >= 3
                              ? "Maximum 3 images uploaded"
                              : "Click to upload images"}
                          </p>
                        </label>
                      </div>
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {uploadedImages.map((url, index) => (
                            <div key={index} className="relative">
                              <Image
                                src={url}
                                alt={`Upload ${index + 1}`}
                                width={100}
                                height={100}
                                className="w-full h-20 object-cover rounded border border-zinc-700"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Report Found Item"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReportForm(false)}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="mb-8 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search for items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <div className="text-sm text-zinc-400">
                {filteredItems.length} items found
              </div>
            </div>

            {showFilters && (
              <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-700">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Category</Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem
                            value="all"
                            className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            All Categories
                          </SelectItem>
                          {categories.map((category) => (
                            <SelectItem
                              key={category}
                              value={category}
                              className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                            >
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Location</Label>
                      <Select
                        value={selectedLocation}
                        onValueChange={setSelectedLocation}
                      >
                        <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem
                            value="all"
                            className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            All Locations
                          </SelectItem>
                          {locations.map((location) => (
                            <SelectItem
                              key={location}
                              value={location}
                              className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                            >
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Status</Label>
                      <Select
                        value={selectedStatus}
                        onValueChange={setSelectedStatus}
                      >
                        <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem
                            value="all"
                            className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            All Status
                          </SelectItem>
                          <SelectItem
                            value="available"
                            className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            Available
                          </SelectItem>
                          <SelectItem
                            value="claimed"
                            className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            Claimed
                          </SelectItem>
                          <SelectItem
                            value="completed"
                            className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            ✅ Claimed by Owner
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Search className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2 text-white">
                Loading found items...
              </h3>
              <p className="text-zinc-400">
                Please wait while we fetch the latest items
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2 text-white">
                No items found
              </h3>
              <p className="text-zinc-400">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Link
                  key={item._id}
                  href={`/items/${item._id}`}
                  className="block"
                >
                  <Card className="bg-zinc-900/50 backdrop-blur-xl border-zinc-800 hover:border-zinc-700 transition-all duration-500 group overflow-hidden rounded-xl shadow-lg shadow-green-900/20 hover:shadow-xl hover:shadow-green-900/30 hover:-translate-y-2 hover:scale-[1.02] transform cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-heading line-clamp-1 text-white">
                            {item.itemName}
                          </CardTitle>
                          <CardDescription className="text-zinc-400 text-sm mt-1">
                            {item.category || "General"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Image Section with Unified Status Badge */}
                    <div className="relative overflow-hidden">
                      {Array.isArray(item.images) && item.images.length > 0 ? (
                        <Image
                          src={
                            typeof item.images[0] === "string"
                              ? item.images[0]
                              : (item.images[0] as { url: string })?.url ||
                                "/placeholder.jpg"
                          }
                          alt={item.itemName || item.title || "Found item"}
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
                            item.status === "completed" ? "default" : "default"
                          }
                          className={
                            item.status === "completed"
                              ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/30"
                              : "bg-gradient-to-b from-primary to-primary/80 text-primary-foreground border-primary/50 shadow-lg shadow-blue-900/30"
                          }
                        >
                          {item.status === "completed" ? "Completed" : "Found"}
                        </Badge>
                      </div>

                      {/* Reward Badge */}
                      {item.reward && (
                        <div className="absolute top-3 right-3 group-hover:scale-110 transition-transform duration-300">
                          <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-900/30 group-hover:shadow-xl group-hover:shadow-yellow-900/40">
                            <Gift className="w-3 h-3 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                            {item.reward}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span>
                            {typeof item.location === "string"
                              ? item.location
                              : (item.location as unknown as { text?: string })
                                  ?.text || ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>
                            Found on{" "}
                            {formatISODate(item.createdAt?.toString() || "")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="truncate">
                            {item.finderEmail || "No email"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Phone className="w-4 h-4 text-blue-500" />
                          <span>{item.finderPhone || "No phone"}</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-zinc-900/30 hover:scale-105 group-hover:border-zinc-600"
                          onClick={() =>
                            (window.location.href = `/items/${item._id}`)
                          }
                        >
                          <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          View Details
                        </Button>

                        {item.finderPhone && item.status !== "resolved" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/30 hover:scale-105"
                              onClick={() => {
                                if (!item.finderPhone) return;
                                const cleanPhone = item.finderPhone.replace(
                                  /[^\d+]/g,
                                  ""
                                );
                                const message = encodeURIComponent(
                                  `Hi! I saw your lost & found posting for "${item.title}". Is it still available?`
                                );
                                const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
                                window.open(whatsappUrl, "_blank");
                              }}
                            >
                              <WhatsAppIcon className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                              WhatsApp
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-zinc-900/30 hover:scale-105"
                              onClick={() => {
                                if (!item.finderPhone) return;
                                const cleanPhone = item.finderPhone.replace(
                                  /[^\d+]/g,
                                  ""
                                );
                                window.open(`tel:${cleanPhone}`, "_self");
                              }}
                            >
                              <Phone className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                              Call
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-700">
                        Reported on{" "}
                        {formatISODate(item.createdAt?.toString() || "")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 rounded-lg p-6">
              <h3 className="font-heading font-semibold text-lg mb-2 text-white">
                Can&apos;t find your item?
              </h3>
              <p className="text-zinc-400 mb-4">
                Report your lost item so others can help you find it
              </p>
              <Link href="/report-lost">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
                  Report Lost Item
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

// Deterministic date formatter to avoid SSR/CSR locale differences
const formatISODate = (iso: string) => {
  if (!iso) return "";

  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};
