"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MatchResult,
  formatSimilarityScore,
  getSimilarityLabel,
} from "@/lib/similarityClient";
import {
  Eye,
  MapPin,
  Calendar,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";

interface MatchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  matches: MatchResult[];
  totalItems: number;
  itemType: "lost" | "found";
  itemName: string;
  itemCategory?: string;
  onViewDetails?: (itemId: string) => void;
}

export default function MatchResultsModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  matches,
  totalItems,
  itemType,
  itemName,
  itemCategory,
  onViewDetails,
}: MatchResultsModalProps) {
  // Category + lexical relevance helpers
  const normalize = (s: string) => (s || "").toLowerCase().trim();
  const words = normalize(itemName)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const containsAny = (text: string) => {
    const nt = normalize(text);
    return words.length === 0 ? true : words.some((w) => nt.includes(w));
  };

  // Filter and sort
  const displayedMatches = [...matches]
    .filter((m) => m.score >= 0.6)
    .filter((m) => {
      if (itemCategory && m.found_item.category) {
        if (normalize(m.found_item.category) !== normalize(itemCategory)) {
          return false;
        }
      }
      return (
        containsAny(m.found_item.item) || containsAny(m.found_item.description)
      );
    })
    .sort((a, b) => b.score - a.score);

  const getBarColor = (score: number) =>
    score >= 0.8 ? "bg-emerald-600" : score >= 0.6 ? "bg-green-500" : "bg-red-500";

  const getBadgeClasses = (score: number) => {
    if (score >= 0.8) return "bg-emerald-600 text-white";
    if (score >= 0.6) return "bg-green-500 text-white";
    if (score >= 0.4) return "bg-green-600 text-white";
    return "bg-red-600 text-white";
  };

  const getBorderClass = (score: number) => {
    if (score >= 0.8) return "border-l-emerald-600";
    if (score >= 0.6) return "border-l-green-500";
    if (score >= 0.4) return "border-l-green-600";
    return "border-l-red-600";
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  const getModalTitle = () => {
    if (itemType === "lost") {
      return "Found Potential Matches for Your Lost Item";
    } else {
      return "Found Potential Matches for Your Found Item";
    }
  };

  const getModalDescription = () => {
    if (itemType === "lost") {
      return `We found ${displayedMatches.length} potential matches for "${itemName}". These are found items that might be yours.`;
    } else {
      return `We found ${displayedMatches.length} potential matches for "${itemName}". These are lost items that might match what you found.`;
    }
  };

  const getActionButtonText = () => {
    if (itemType === "lost") {
      return "Post Lost Item Anyway";
    } else {
      return "Post Found Item Anyway";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription className="text-base">
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {displayedMatches.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No similar {itemType === "lost" ? "found" : "lost"} items were
                detected. You can proceed to post your {itemType} item.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs dark:text-gray-300">
                  {totalItems} total {itemType === "lost" ? "found" : "lost"} items in database
                </Badge>
              </div>

              <div className="grid gap-4">
                {displayedMatches.map((match) => (
                  <motion.div
                    key={match.found_item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`border-l-4 ${getBorderClass(match.score)} hover:shadow-md transition-shadow`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                              {match.found_item.item}
                            </CardTitle>
                            {match.found_item.category && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {match.found_item.category}
                              </p>
                            )}
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {match.found_item.description}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getBadgeClasses(match.score)}>
                              {formatSimilarityScore(match.score)} match
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {getSimilarityLabel(match.score)} similarity
                            </span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Similarity Bar */}
                          <div className="mt-1">
                            <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-2 ${getBarColor(match.score)}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.round(match.score * 100)}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </div>

                          {/* Basic Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span>{match.found_item.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span>
                                {itemType === "lost" ? "Found" : "Lost"} on {new Date(match.found_item.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Contact Info */}
                          {match.found_item.contact_info && (
                            <div className="space-y-2">
                              {match.found_item.contact_info.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <Mail className="h-4 w-4 text-blue-500" />
                                  <span className="truncate">{match.found_item.contact_info.email}</span>
                                </div>
                              )}
                              {match.found_item.contact_info.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <Phone className="h-4 w-4 text-blue-500" />
                                  <span>{match.found_item.contact_info.phone}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="flex-1" onClick={() => onViewDetails?.(match.found_item.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/items/${match.found_item.id}`}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
            <Button onClick={handleConfirm}>{getActionButtonText()}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
