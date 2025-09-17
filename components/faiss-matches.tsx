"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import Link from "next/link";

interface FaissMatchesProps {
  matches: MatchResult[];
  totalFoundItems: number;
  onViewDetails?: (itemId: string) => void;
}

export default function FaissMatches({
  matches,
  totalFoundItems,
  onViewDetails,
}: FaissMatchesProps) {
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  if (!matches || matches.length === 0) {
    return (
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No similar found items were detected. We'll notify you if any matches
          are found later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-green-600">
          Found {matches.length} potential match
          {matches.length !== 1 ? "es" : ""}
        </h3>
        <Badge variant="outline" className="text-xs">
          {totalFoundItems} total found items
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
                      Found on{" "}
                      {new Date(match.found_item.date).toLocaleDateString()}
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
                        <span>{match.found_item.contact_info.phone}</span>
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
                      setExpandedMatch(expandedMatch === index ? null : index)
                    }
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {expandedMatch === index ? "Hide" : "Show"} similarity
                    details
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
                              match.similarity_details.location_similarity
                            )} font-medium`}
                          >
                            {formatSimilarityScore(
                              match.similarity_details.location_similarity
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
          These matches are based on AI similarity analysis. Please verify
          details before contacting the finder.
        </AlertDescription>
      </Alert>
    </div>
  );
}
