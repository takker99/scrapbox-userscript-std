# scrapbox-userscript-std

[![JSR](https://jsr.io/badges/@cosense/std)](https://jsr.io/@cosense/std)
[![test](https://github.com/takker99/scrapbox-userscript-std/workflows/ci/badge.svg)](https://github.com/takker99/scrapbox-userscript-std/actions?query=workflow%3Aci)

UNOFFICIAL standard module for Scrapbox UserScript

## Getting Started

This library serves as an unofficial standard library for developing Scrapbox userscripts. It provides a comprehensive set of utilities for interacting with Scrapbox's features, including REST API operations, browser interactions, and common utilities.

### Installation

1. Bundler Configuration
This library is distributed through JSR (JavaScript Registry) and requires a bundler configuration. Follow these steps:

a. Configure your bundler to use JSR:
- For esbuild: Add JSR to your import map
- For other bundlers: Refer to your bundler's JSR integration documentation

b. Import the library:
```typescript
// Import the entire library
import { ... } from "jsr:@cosense/std";

// Or import specific modules (recommended)
import { getPage, getLines } from "jsr:@cosense/std/rest";
import { getLines, press } from "jsr:@cosense/std/browser/dom";
```

2. Module Organization
The library is organized into the following main modules:

- `rest/`: API operations for Scrapbox REST endpoints
  - Page operations
  - Project management
  - User authentication
- `browser/`: Browser-side operations
  - DOM manipulation
  - WebSocket communication
  - Event handling
- Core utilities:
  - `title`: Title parsing and formatting
  - `parseAbsoluteLink`: External link analysis
  - Additional helper functions

## Examples

### Basic Usage

1. Retrieving Page Information
```typescript
// Get page content and metadata
import { getPage } from "jsr:@cosense/std/rest";

const page = await getPage("projectName", "pageName");
console.log(page.title);        // Access page title
console.log(page.lines);        // Access page content as lines
console.log(page.descriptions); // Access page descriptions
```

2. DOM Operations
```typescript
// Interact with the current page's content
import { getLines, press } from "jsr:@cosense/std/browser/dom";

// Get all lines from the current page
const lines = getLines();
console.log(lines.map(line => line.text));

// Simulate keyboard input
await press("Enter"); // Add a new line
await press("Tab");   // Indent the line
```

3. External Link Analysis
```typescript
// Parse external links (YouTube, Spotify, etc.)
import { parseAbsoluteLink } from "jsr:@cosense/std";
import type { LinkNode } from "@progfay/scrapbox-parser";

const link: LinkNode = {
  type: "link",
  pathType: "absolute",
  href: "https://www.youtube.com/watch?v=xxxxx",
  content: ""
};

// Parse and handle different link types
const parsed = parseAbsoluteLink(link);
if (parsed.type === "youtube") {
  console.log(parsed.videoId);    // YouTube video ID
  console.log(parsed.timestamp);  // Video timestamp (if present)
} else if (parsed.type === "spotify") {
  console.log(parsed.trackId);    // Spotify track ID
}
```

### Important Notes
- This library requires a bundler for use in userscripts
- Full TypeScript support with type definitions included
- Comprehensive error handling with type-safe responses
- For more examples and use cases, see the [Examples](https://github.com/takker99/scrapbox-userscript-std/tree/main/examples) directory

### Additional Resources
- [JSR Package Page](https://jsr.io/@cosense/std)
- [API Documentation](https://jsr.io/@cosense/std/doc)
- [GitHub Repository](https://github.com/takker99/scrapbox-userscript-std)
