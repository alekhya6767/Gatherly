import { z } from "zod";

const optionalNonEmptyString = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const trimmed = v.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.toLowerCase() === "all") return undefined;
  return trimmed;
}, z.string().optional());

const dateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

export const discoverSearchParamsSchema = z.object({
  q: optionalNonEmptyString,
  city: optionalNonEmptyString,
  category: optionalNonEmptyString,
  start: dateString.optional(),
  end: dateString.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z
    .enum(["trending", "date", "price"])
    .optional()
    .default("trending"),
});

export type DiscoverSearchParams = z.infer<typeof discoverSearchParamsSchema>;
