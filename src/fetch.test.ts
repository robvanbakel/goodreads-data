import { afterEach, describe, expect, it, vi } from "vitest";
import { getData } from "./fetch.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(xml: string, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      statusText: ok ? "OK" : "Unauthorized",
      text: () => Promise.resolve(xml),
    }),
  );
}

function buildXml(itemXml: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rob's bookshelf: all</title>
    <description><![CDATA[Rob's bookshelf: all]]></description>
    <lastBuildDate>Wed, 25 Mar 2026 12:31:16 -0700</lastBuildDate>
    ${itemXml}
  </channel>
</rss>`;
}

const BASE_ITEM = `
  <item>
    <guid><![CDATA[https://www.goodreads.com/review/show/123]]></guid>
    <pubDate><![CDATA[Wed, 25 Mar 2026 12:31:16 -0700]]></pubDate>
    <title>Keep It in the Family</title>
    <link><![CDATA[https://www.goodreads.com/review/show/123]]></link>
    <book_id>60109530</book_id>
    <book_small_image_url><![CDATA[https://example.com/small.jpg]]></book_small_image_url>
    <book_medium_image_url><![CDATA[https://example.com/medium.jpg]]></book_medium_image_url>
    <book_large_image_url><![CDATA[https://example.com/large.jpg]]></book_large_image_url>
    <book_description><![CDATA[A description.]]></book_description>
    <book id="60109530"><num_pages>380</num_pages></book>
    <author_name>John Marrs</author_name>
    <isbn>1542017289</isbn>
    <user_name>Rob</user_name>
    <user_rating>5</user_rating>
    <user_read_at><![CDATA[Wed, 25 Mar 2026 00:00:00 +0000]]></user_read_at>
    <user_date_added><![CDATA[Wed, 25 Mar 2026 12:31:16 -0700]]></user_date_added>
    <user_shelves></user_shelves>
    <user_review></user_review>
    <average_rating>4.06</average_rating>
    <book_published>2022</book_published>
  </item>`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getData", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns correctly shaped data from valid XML", async () => {
    mockFetch(buildXml(BASE_ITEM));
    const data = await getData("165162328");

    expect(data.userId).toBe("165162328");
    expect(data.userName).toBe("Rob");
    expect(data.lastUpdated).toBe("Wed, 25 Mar 2026 12:31:16 -0700");
    expect(data.books).toHaveLength(1);
  });

  it("correctly maps book fields", async () => {
    mockFetch(buildXml(BASE_ITEM));
    const { books } = await getData("165162328");
    const book = books[0];

    expect(book.title).toBe("Keep It in the Family");
    expect(book.authorName).toBe("John Marrs");
    expect(book.bookId).toBe("60109530");
    expect(book.isbn).toBe("1542017289");
    expect(book.yearPublished).toBe("2022");
    expect(book.images).toEqual({
      small: "https://example.com/small.jpg",
      medium: "https://example.com/medium.jpg",
      large: "https://example.com/large.jpg",
    });
  });

  it("coerces string fields to numbers", async () => {
    mockFetch(buildXml(BASE_ITEM));
    const { books } = await getData("165162328");
    const book = books[0];

    expect(book.userRating).toBe(5);
    expect(book.averageRating).toBe(4.06);
    expect(book.numPages).toBe(380);
  });

  it("splits user_shelves into an array", async () => {
    const item = BASE_ITEM.replace("<user_shelves></user_shelves>", "<user_shelves>read, favorites</user_shelves>");
    mockFetch(buildXml(item));
    const { books } = await getData("165162328");

    expect(books[0].userShelves).toEqual(["read", "favorites"]);
  });

  it("returns empty array for blank user_shelves", async () => {
    mockFetch(buildXml(BASE_ITEM));
    const { books } = await getData("165162328");

    expect(books[0].userShelves).toEqual([]);
  });

  it("returns null for blank user_read_at", async () => {
    const item = BASE_ITEM.replace(
      "<user_read_at><![CDATA[Wed, 25 Mar 2026 00:00:00 +0000]]></user_read_at>",
      "<user_read_at></user_read_at>",
    );
    mockFetch(buildXml(item));
    const { books } = await getData("165162328");

    expect(books[0].userReadAt).toBeNull();
  });

  it("returns null for missing num_pages", async () => {
    const item = BASE_ITEM.replace(
      '<book id="60109530"><num_pages>380</num_pages></book>',
      '<book id="60109530"></book>',
    );
    mockFetch(buildXml(item));
    const { books } = await getData("165162328");

    expect(books[0].numPages).toBeNull();
  });

  it("returns empty books array when channel has no items", async () => {
    mockFetch(buildXml(""));
    const data = await getData("165162328");

    expect(data.books).toEqual([]);
    expect(data.userName).toBe("");
  });

  it("throws on a non-OK HTTP response", async () => {
    mockFetch("", false);

    await expect(getData("165162328")).rejects.toThrow("Failed to fetch Goodreads data for user 165162328");
  });

  it("calls fetch with the correct default URL", async () => {
    mockFetch(buildXml(BASE_ITEM));
    await getData("165162328");

    const calledUrl = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/review/list_rss/165162328");
    expect(calledUrl.searchParams.get("shelf")).toBe("#ALL#");
    expect(calledUrl.searchParams.get("key")).toBeNull();
  });

  it("includes key in the URL when provided", async () => {
    mockFetch(buildXml(BASE_ITEM));
    await getData("165162328", { key: "abc123" });

    const calledUrl = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("key")).toBe("abc123");
  });

  it("uses a custom shelf when provided", async () => {
    mockFetch(buildXml(BASE_ITEM));
    await getData("165162328", { shelf: "read" });

    const calledUrl = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("shelf")).toBe("read");
  });
});
