"use client"

import { List, Grid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ViewToggleProps {
  view: "list" | "grid"
  onViewChange: (view: "list" | "grid") => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(value) => {
        if (value === "list" || value === "grid") {
          onViewChange(value)
        }
      }}
      className="glass-card p-1"
    >
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <Grid className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}