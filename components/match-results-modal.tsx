"use client";

import { useState } from "react";
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
  getSimilarityColor,
  getSimilarityLabel,
} from "@/lib/faissClient";
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
  onViewDetails,
}: MatchResultsModalProps) {
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

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
      return `We found ${matches.length} potential matches for "${itemName}". These are found items that might be yours.`;
    } else {
      return `We found ${matches.length} potential matches for "${itemName}". These are lost items that might match what you found.`;
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
          {matches.length === 0 ? (
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
                <Badge variant="outline" className="text-xs">
                  {totalItems} total {itemType === "lost" ? "found" : "lost"}{" "}
                  items in database
                </Badge>
              </div>

              <div className="grid gap-4">
                {matches.map((match, index) => (
                  <Card
                    key={match.found_item.id}
                    className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900">
                            {match.found_item.item}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {match.found_item.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            className={`${getSimilarityColor(
                              match.score
                            )} bg-opacity-10 border-current`}
                          >
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
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span>{match.found_item.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>
                              {itemType === "lost" ? "Found" : "Lost"} on{" "}
                              {new Date(
                                match.found_item.date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Contact Info */}
                        {match.found_item.contact_info && (
                          <div className="space-y-2">
                            {match.found_item.contact_info.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4 text-blue-500" />
                                <span className="truncate">
                                  {match.found_item.contact_info.email}
                                </span>
                              </div>
                            )}
                            {match.found_item.contact_info.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4 text-blue-500" />
                                <span>
                                  {match.found_item.contact_info.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Detailed Similarity Breakdown */}
                        <div className="border-t pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedMatch(
                                expandedMatch === index ? null : index
                              )
                            }
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            {expandedMatch === index ? "Hide" : "Show"}{" "}
                            similarity details
                          </Button>

                          {expandedMatch === index && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Text Similarity:
                                  </span>
                                  <div
                                    className={`${getSimilarityColor(
                                      match.similarity_details.text_similarity
                                    )} font-medium`}
                                  >
                                    {formatSimilarityScore(
                                      match.similarity_details.text_similarity
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Location Match:
                                  </span>
                                  <div
                                    className={`${getSimilarityColor(
                                      match.similarity_details
                                        .location_similarity
                                    )} font-medium`}
                                  >
                                    {formatSimilarityScore(
                                      match.similarity_details
                                        .location_similarity
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Date Proximity:
                                  </span>
                                  <div
                                    className={`${getSimilarityColor(
                                      match.similarity_details.date_similarity
                                    )} font-medium`}
                                  >
                                    {formatSimilarityScore(
                                      match.similarity_details.date_similarity
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => onViewDetails?.(match.found_item.id)}
                          >
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
                ))}
              </div>

              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  These matches are based on AI similarity analysis. Please
                  verify details before contacting the{" "}
                  {itemType === "lost" ? "finder" : "owner"}.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {getActionButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
