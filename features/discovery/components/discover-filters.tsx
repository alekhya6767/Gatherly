"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventCategory } from "@/types/event";

const categories: EventCategory[] = [
  "Food & Drink",
  "Music",
  "Arts",
  "Nightlife",
  "Outdoors",
  "Wellness",
  "Tech",
  "Community",
];

const cities = ["San Jose", "San Francisco", "Oakland", "Palo Alto", "Santa Cruz"];

export function DiscoverFilters({
  initialQ,
  initialCity,
  initialCategory,
  initialSort,
}: {
  initialQ: string;
  initialCity: string;
  initialCategory: string;
  initialSort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive current values from URL (back/forward nav syncs automatically)
  const q = searchParams.get("q") ?? initialQ;
  const city = searchParams.get("city") ?? initialCity;
  const category = searchParams.get("category") ?? initialCategory;
  const sort = searchParams.get("sort") ?? initialSort;

  // Local text input state only (avoids needless re-navigation on every keystroke)
  const [inputQ, setInputQ] = React.useState(q);

  function buildUrl(overrides: Partial<Record<string, string>>) {
    const merged = { q: inputQ, city, category, sort, ...overrides };
    const sp = new URLSearchParams();
    if (merged.q?.trim()) sp.set("q", merged.q.trim());
    if (merged.city && merged.city !== "all") sp.set("city", merged.city);
    if (merged.category && merged.category !== "all") sp.set("category", merged.category);
    if (merged.sort && merged.sort !== "trending") sp.set("sort", merged.sort);
    const s = sp.toString();
    return `/discover${s ? `?${s}` : ""}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ q: inputQ }));
  }

  function handleSelectChange(field: "city" | "category" | "sort", value: string) {
    router.push(buildUrl({ [field]: value }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 md:grid-cols-12"
      role="search"
      aria-label="Filter events"
    >
      <div className="md:col-span-5">
        <Label htmlFor="q" className="sr-only">
          Search events
        </Label>
        <Input
          id="q"
          name="q"
          value={inputQ}
          onChange={(e) => setInputQ(e.target.value)}
          placeholder="Search (e.g., jazz, ramen, museum)"
        />
      </div>

      <div className="md:col-span-2">
        <Label className="sr-only" htmlFor="city-select">
          City
        </Label>
        <Select value={city} onValueChange={(v) => handleSelectChange("city", v)}>
          <SelectTrigger id="city-select" aria-label="Filter by city">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any city</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-3">
        <Label className="sr-only" htmlFor="category-select">
          Category
        </Label>
        <Select value={category} onValueChange={(v) => handleSelectChange("category", v)}>
          <SelectTrigger id="category-select" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any category</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-2">
        <Label className="sr-only" htmlFor="sort-select">
          Sort
        </Label>
        <Select value={sort} onValueChange={(v) => handleSelectChange("sort", v)}>
          <SelectTrigger id="sort-select" aria-label="Sort events">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="price">Price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:col-span-12">
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setInputQ("");
            router.push("/discover");
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
