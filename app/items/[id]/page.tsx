"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Gift,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import PageTransition from "@/components/page-transition";
import { formatISODateDDMMYYYY } from "@/lib/utils";
import { itemsApi, Item as ApiItem } from "@/lib/api";
import { useSession } from "next-auth/react";
import Image from "next/image";

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

// Unified item interface for display
interface DisplayItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  dateFound?: string;
  dateLost?: string;
  images: string[];
  status: "Available" | "Claimed" | "Removed" | "Completed";
  type: "lost" | "found";
  contactInfo: {
    email: string;
    phone?: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
  };
  reward?: number;
  createdAt: string;
  updatedAt: string;
}

interface ContactSectionProps {
  item: DisplayItem;
  onStartChat: () => void;
  onMarkCompleted: () => void;
  isOwner: boolean;
}

function ContactSection({
  item,
  onStartChat,
  onMarkCompleted,
  isOwner,
}: ContactSectionProps) {
  // Clean the contact name to remove any registration details or suffixes
  const cleanContactName = (item.user?.name || "Anonymous")
    .replace(/\s*\([^)]*\)/g, "") // Remove anything in parentheses
    .replace(/\s*\[[^\]]*\]/g, "") // Remove anything in square brackets
    .replace(/\s*-\s*\d{4}$/g, "") // Remove year suffixes like "-2023"
    .replace(/\s*@.*$/g, "") // Remove email suffixes
    .replace(/\s+\d{8}$/g, "") // Remove 8-digit registration numbers like "23BAI0086"
    .replace(/\s+\d{2}[A-Z]{3}\d{4}$/g, "") // Remove registration patterns like "23BAI0086"
    .trim();

  const contactEmail = item.contactInfo?.email || item.user?.email || "";
  const contactPhone = item.contactInfo?.phone || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Contact Information
        </CardTitle>
        <CardDescription>
          {item.type === "found"
            ? "Get in touch with the person who found this item"
            : "Get in touch with the person who lost this item"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{cleanContactName}</div>
              <div className="text-sm text-muted-foreground">VIT Student</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="font-medium truncate" title={contactEmail}>
                      {contactEmail}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="break-words">{contactEmail}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="text-sm text-muted-foreground">Email Address</div>
            </div>
          </div>

          {contactPhone && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{contactPhone}</div>
                <div className="text-sm text-muted-foreground">
                  Phone Number
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          {item.status === "Completed" ? (
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                This item has been{" "}
                {item.type === "lost"
                  ? "returned to its owner"
                  : "claimed by the finder"}
                . Contact is no longer needed.
              </p>
            </div>
          ) : contactPhone ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onStartChat}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <WhatsAppIcon className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                asChild
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                <a href={`tel:${contactPhone}`}>
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              </Button>
            </div>
          ) : (
            <Button
              className="w-full bg-gray-500 text-white cursor-not-allowed"
              disabled
            >
              <WhatsAppIcon className="w-4 h-4 mr-2" />
              Contact not available
            </Button>
          )}

          {item.status !== "Completed" && (
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                asChild
                className="flex items-center gap-2 bg-transparent"
              >
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 min-w-0"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate" title={contactEmail}>
                    Email: {contactEmail}
                  </span>
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Mark as Completed Button - Only for owner */}
        {isOwner && item.status !== "Completed" && (
          <>
            <Separator />
            <div className="space-y-3">
              <Button
                onClick={onMarkCompleted}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {item.type === "lost"
                  ? "Mark as Returned to Owner"
                  : "Mark as Claimed by Finder"}
              </Button>
            </div>
          </>
        )}

        {/* Completed Status Display */}
        {item.status === "Completed" && (
          <>
            <Separator />
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <div className="font-medium text-green-800">
                  {item.type === "lost"
                    ? "✅ Returned to Owner"
                    : "✅ Claimed by Finder"}
                </div>
                <div className="text-sm text-green-600">
                  This item has been completed
                </div>
              </div>
            </div>
          </>
        )}

        {item.reward && item.reward > 0 && (
          <>
            <Separator />
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Gift className="w-4 h-4 text-primary" />
              <div>
                <div className="font-medium text-primary">Reward Offered</div>
                <div className="text-sm text-primary/80">₹{item.reward}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ItemDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = useSession();
  const [item, setItem] = useState<DisplayItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedParams = use(params);

  // Check if current user is the owner of the item
  const isOwner =
    item &&
    session?.user &&
    (session.user as any).id &&
    item.user?._id === (session.user as any).id;

  useEffect(() => {
    const loadItem = async () => {
      setLoading(true);
      setError(null);

      try {
        const itemId = resolvedParams.id;

        // Validate ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(itemId)) {
          setError("Invalid item ID format");
          setLoading(false);
          return;
        }

        // Try to fetch as found item first, then as lost item
        let response = await itemsApi.getFoundItem(itemId);
        let itemType: "lost" | "found" = "found";

        if (!response.success || !response.data) {
          // Try as lost item
          response = await itemsApi.getLostItem(itemId);
          itemType = "lost";
        }

        if (!response.success || !response.data) {
          setError("Item not found");
          setLoading(false);
          return;
        }

        const apiItem = response.data as ApiItem;

        // Transform API data to display format
        const displayItem: DisplayItem = {
          _id: apiItem._id,
          title: apiItem.title || "",
          description: apiItem.description || "",
          category: (apiItem as any).category || "Other",
          location:
            typeof apiItem.location === "string"
              ? apiItem.location
              : (apiItem.location as any)?.text || "",
          dateFound: apiItem.dateFound || "",
          dateLost: apiItem.dateLost || "",
          images: Array.isArray(apiItem.images)
            ? apiItem.images.map((img) =>
                typeof img === "string" ? img : (img as any).url || ""
              )
            : [],
          status: apiItem.status as "Available" | "Claimed" | "Removed",
          type: itemType,
          contactInfo: {
            email:
              apiItem.contactInfo?.email ||
              (apiItem as any).userId?.email ||
              "",
            phone:
              apiItem.contactInfo?.phone ||
              (apiItem as any).userId?.phone ||
              "",
          },
          user: (apiItem as any).userId
            ? {
                _id: (apiItem as any).userId._id || "",
                name: (apiItem as any).userId.name || "Anonymous",
                email: (apiItem as any).userId.email || "",
              }
            : { _id: "", name: "Anonymous", email: "" },
          reward: (apiItem as any).reward,
          createdAt: apiItem.createdAt,
          updatedAt: apiItem.updatedAt,
        };

        setItem(displayItem);
      } catch (err) {
        console.error("Error loading item:", err);
        setError("Failed to load item details");
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [resolvedParams.id]);

  const handleStartChat = () => {
    if (!item || !item.contactInfo?.phone) {
      alert("WhatsApp contact not available for this item.");
      return;
    }

    // Clean the phone number (remove any non-digit characters except +)
    const cleanPhone = item.contactInfo.phone.replace(/[^\d+]/g, "");

    // Format the message for WhatsApp
    const message = encodeURIComponent(
      `Hi! I saw your lost & found posting for "${item.title}". Is it still available?`
    );

    // Create WhatsApp link
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;

    // Open WhatsApp in a new tab/window
    window.open(whatsappUrl, "_blank");
  };

  const handleMarkCompleted = async () => {
    if (!item) return;

    const confirmMessage =
      item.type === "lost"
        ? "Mark this item as returned to owner?"
        : "Mark this item as claimed by finder?";

    if (!confirm(confirmMessage)) return;

    try {
      const response =
        item.type === "lost"
          ? await itemsApi.markLostItemCompleted(item._id)
          : await itemsApi.markFoundItemCompleted(item._id);

      if (response.success) {
        // Update the item status locally
        setItem((prev) => (prev ? { ...prev, status: "Completed" } : null));
        alert(
          item.type === "lost"
            ? "Item marked as returned!"
            : "Item marked as claimed!"
        );
      } else {
        alert("Failed to update item status. Please try again.");
      }
    } catch (error) {
      console.error("Error marking item as completed:", error);
      alert("Failed to update item status. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Item Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || "The item you're looking for doesn't exist."}
          </p>
          <div className="space-x-4">
            <Link href="/browse-found">
              <Button variant="outline">Browse Found Items</Button>
            </Link>
            <Link href="/browse-lost">
              <Button variant="outline">Browse Lost Items</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const backUrl = item.type === "found" ? "/browse-found" : "/browse-lost";
  const dateField = item.type === "found" ? item.dateFound : item.dateLost;
  const dateLabel = item.type === "found" ? "Date Found" : "Date Lost";

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                href={backUrl}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Browse</span>
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
                <span className="font-heading font-bold text-lg">
                  Lost & Found VIT
                </span>
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
                <div className="bg-muted relative rounded-t-lg overflow-hidden">
                  <Image
                    src={
                      Array.isArray(item.images) && item.images.length > 0
                        ? typeof item.images[0] === "string"
                          ? item.images[0]
                          : (item.images[0] as { url: string })?.url ||
                            "/placeholder.svg"
                        : "/placeholder.svg"
                    }
                    alt={item.title}
                    width={800}
                    height={600}
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="w-full h-auto object-contain"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant={
                        item.status === "Available"
                          ? "default"
                          : item.status === "Completed"
                          ? "outline"
                          : "secondary"
                      }
                      className={
                        item.status === "Completed"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : ""
                      }
                    >
                      {item.status === "Available"
                        ? "Available"
                        : item.status === "Completed"
                        ? item.type === "lost"
                          ? "✅ Returned"
                          : "✅ Claimed"
                        : "Claimed"}
                    </Badge>
                  </div>
                  {item.reward && item.reward > 0 && (
                    <div className="absolute top-4 left-4">
                      <Badge
                        variant="outline"
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        <Gift className="w-3 h-3 mr-1" />₹{item.reward}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <CardTitle className="text-2xl">{item.title}</CardTitle>
                  <CardDescription className="text-base">
                    {item.description}
                  </CardDescription>
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
                        <div className="font-medium">Location</div>
                        <div className="text-sm text-muted-foreground">
                          {item.location}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">{dateLabel}</div>
                        <div className="text-sm text-muted-foreground">
                          {dateField
                            ? formatISODateDDMMYYYY(dateField)
                            : "Not specified"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">Category</div>
                        <div className="text-sm text-muted-foreground">
                          {item.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">Type</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {item.type} Item
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">Reporter</div>
                        <div className="text-sm text-muted-foreground">
                          {(item.user?.name || "Anonymous")
                            .replace(/\s*\([^)]*\)/g, "") // Remove anything in parentheses
                            .replace(/\s*\[[^\]]*\]/g, "") // Remove anything in square brackets
                            .replace(/\s*-\s*\d{4}$/g, "") // Remove year suffixes like "-2023"
                            .replace(/\s*@.*$/g, "") // Remove email suffixes
                            .trim()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">Status</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {item.status}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Section */}
            <div className="space-y-6">
              <ContactSection
                item={item}
                onStartChat={handleStartChat}
                onMarkCompleted={handleMarkCompleted}
                isOwner={isOwner}
              />
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
