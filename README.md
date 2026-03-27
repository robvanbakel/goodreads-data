# Goodreads Data

Fetch and parse public Goodreads shelf data for any user.

## Installation

```sh
npm install goodreads-data
# or
pnpm add goodreads-data
```

## Usage

```ts
import { getData } from "goodreads-data";

const data = await getData("123456789");

console.log(data);
// {
//   userId: '123456789',
//   userName: 'John Doe',
//   lastUpdated: 'Wed, 25 Mar 2026 12:31:16 -0700',
//   books: [
//     {
//       title: 'A Tale of Two Cities',
//       authorName: 'Charles Dickens',
//       userRating: 5,
//       userShelves: ['currently-reading'],
//       ...
//     }
//   ]
// }
```

### Finding your RSS key

A key is only required if the profile is not fully public. To find yours, navigate to your Goodreads profile, scroll to the bottom, and click the RSS link. Copy the `key` query parameter from the URL:

```
https://www.goodreads.com/review/list_rss/<userId>?key=<your-key>&shelf=#ALL#
```

## API

### `getData(userId, options?): Promise<GoodreadsData>`

| Parameter       | Type        | Description                                                                                                                               |
| --------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `userId`        | `string`    | Your Goodreads user ID                                                                                                                    |
| `options.key`   | `string`    | RSS key from your Goodreads feed URL. Not required for fully public profiles.                                                             |
| `options.shelf` | `ShelfName` | Shelf to fetch (default: `#ALL#`). Suggests `'read'`, `'want-to-read'`, `'currently-reading'`, `'did-not-finish'` but accepts any string. |

Throws if the request fails or the response doesn't match the expected shape.

## Types

```ts
type GoodreadsData = {
  userId: string;
  userName: string;
  lastUpdated: string;
  books: Book[];
};

type Book = {
  guid: string;
  title: string;
  link: string;
  bookId: string;
  images: {
    small: string;
    medium: string;
    large: string;
  };
  description: string; // HTML
  numPages: number | null;
  authorName: string;
  isbn: string;
  userRating: number; // 0–5
  userReadAt: string | null;
  userDateAdded: string;
  userShelves: string[];
  userReview: string;
  averageRating: number;
  yearPublished: string;
};
```

All types are exported directly from the package.

## Versioning

This package uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog management.

```sh
pnpm changeset       # describe a change
pnpm run version     # bump version + update CHANGELOG.md
pnpm run release     # build + publish to npm
```

## Requirements

Node.js 18 or later (uses native `fetch`).

## License

MIT
