"use client";

import React from "react";
import {
  MatchResult,
  formatSimilarityScore,
  getSimilarityColor,
  getSimilarityLabel,
} from "@/lib/similarityClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  matches: MatchResult[];
};

export default function FaissMatches({ matches }: Props) {
  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Potential Matches</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((m, idx) => {
          const scoreText = formatSimilarityScore(m.score);
          const scoreColor = getSimilarityColor(m.score);
          const scoreLabel = getSimilarityLabel(m.score);
          const fi = m.found_item;

          return (
            <Card key={`${fi.id}-${idx}`} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{fi.item || "Untitled"}</div>
                <Badge variant="secondary" className={scoreColor}>
                  {scoreLabel} • {scoreText}
                </Badge>
              </div>

              {fi.description && (
                <p className="text-sm text-muted-foreground">{fi.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Location</div>
                  <div>{fi.location || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Date</div>
                  <div>{new Date(fi.date).toLocaleDateString()}</div>
                </div>
              </div>

              {fi.contact_info && (fi.contact_info.email || fi.contact_info.phone) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {fi.contact_info.email && (
                    <div>
                      <div className="text-muted-foreground">Email</div>
                      <div>{fi.contact_info.email}</div>
                    </div>
                  )}
                  {fi.contact_info.phone && (
                    <div>
                      <div className="text-muted-foreground">Phone</div>
                      <div>{fi.contact_info.phone}</div>
                    </div>
                  )}
                </div>
              )}

              {/* CLIP-only: remove per-field similarity breakdown */}
              {/* Showing only the combined CLIP similarity via badge above */}
            </Card>
          );
        })}
      </div>
    </div>
  );
}