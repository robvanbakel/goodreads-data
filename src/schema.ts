import { z } from "zod";

// ---------------------------------------------------------------------------
// Raw RSS schemas — match the JSON produced by fast-xml-parser
// These are internal and not exported.
// ---------------------------------------------------------------------------

const RawBookNodeSchema = z.object({
  num_pages: z.string().optional(),
  _id: z.string(),
});

export const RawItemSchema = z.object({
  guid: z.string(),
  pubDate: z.string(),
  title: z.string(),
  link: z.string(),
  book_id: z.string(),
  book_image_url: z.string().optional(),
  book_small_image_url: z.string().optional(),
  book_medium_image_url: z.string().optional(),
  book_large_image_url: z.string().optional(),
  book_description: z.string().optional(),
  book: RawBookNodeSchema,
  author_name: z.string(),
  isbn: z.string().optional(),
  user_name: z.string(),
  user_rating: z.string(),
  user_read_at: z.string().optional(),
  user_date_added: z.string(),
  user_date_created: z.string().optional(),
  user_shelves: z.string(),
  user_review: z.string().optional(),
  average_rating: z.string(),
  book_published: z.string().optional(),
  description: z.string().optional(),
});

export const RawRssSchema = z.object({
  rss: z.object({
    channel: z.object({
      title: z.string(),
      description: z.string(),
      lastBuildDate: z.string().optional(),
      item: z.array(RawItemSchema).default([]),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Clean public schemas
// ---------------------------------------------------------------------------

export const BookSchema = z.object({
  guid: z.string(),
  title: z.string(),
  link: z.string(),
  bookId: z.string(),
  images: z.object({
    small: z.string(),
    medium: z.string(),
    large: z.string(),
  }),
  description: z.string(),
  numPages: z.number().nullable(),
  authorName: z.string(),
  isbn: z.string(),
  userRating: z.number().min(0).max(5),
  userReadAt: z.string().nullable(),
  userDateAdded: z.string(),
  userShelves: z.array(z.string()),
  userReview: z.string(),
  averageRating: z.number(),
  yearPublished: z.string(),
});

export const GoodreadsDataSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  lastUpdated: z.string(),
  books: z.array(BookSchema),
});

export type Book = z.infer<typeof BookSchema>;
export type GoodreadsData = z.infer<typeof GoodreadsDataSchema>;
export type RawItem = z.infer<typeof RawItemSchema>;
