import { XMLParser } from "fast-xml-parser";
import { GoodreadsDataSchema, RawRssSchema, type Book, type GoodreadsData, type RawItem } from "./schema.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "_",
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => name === "item",
});

function buildUrl(userId: string, options: GetDataOptions): string {
  const params = new URLSearchParams({
    shelf: options.shelf ?? "#ALL#",
  });
  if (options.key) params.set("key", options.key);
  return `https://www.goodreads.com/review/list_rss/${userId}?${params}`;
}

function transformItem(item: RawItem): Book {
  return {
    guid: item.guid,
    title: item.title,
    link: item.link,
    bookId: item.book_id,
    images: {
      small: item.book_small_image_url ?? "",
      medium: item.book_medium_image_url ?? "",
      large: item.book_large_image_url ?? "",
    },
    description: item.book_description ?? "",
    numPages: item.book.num_pages ? parseInt(item.book.num_pages, 10) || null : null,
    authorName: item.author_name,
    isbn: item.isbn ?? "",
    userRating: parseInt(item.user_rating, 10) || 0,
    userReadAt: item.user_read_at || null,
    userDateAdded: item.user_date_added,
    userShelves: item.user_shelves
      ? item.user_shelves
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    userReview: item.user_review ?? "",
    averageRating: parseFloat(item.average_rating) || 0,
    yearPublished: item.book_published ?? "",
  };
}

export type ShelfName = "want-to-read" | "currently-reading" | "read" | "did-not-finish" | (string & {});

export type GetDataOptions = {
  key?: string;
  shelf?: ShelfName;
};

export async function getData(userId: string, options: GetDataOptions = {}): Promise<GoodreadsData> {
  const url = buildUrl(userId, options);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch Goodreads data for user ${userId}: ${response.statusText}`);
  }

  const xml = await response.text();
  const raw: unknown = parser.parse(xml);
  const { rss } = RawRssSchema.parse(raw);
  const { channel } = rss;

  const userName = channel.item[0]?.user_name ?? "";

  return GoodreadsDataSchema.parse({
    userId,
    userName,
    lastUpdated: channel.lastBuildDate ?? "",
    books: channel.item.map(transformItem),
  });
}
