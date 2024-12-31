# scrapbox-userscript-std

[![JSR](https://jsr.io/badges/@cosense/std)](https://jsr.io/@cosense/std)
[![test](https://github.com/takker99/scrapbox-userscript-std/workflows/ci/badge.svg)](https://github.com/takker99/scrapbox-userscript-std/actions?query=workflow%3Aci)

UNOFFICIAL standard module for Scrapbox UserScript

## Getting Started

This library serves as an unofficial standard library for developing Scrapbox userscripts.

### Installation

1. Bundler Configuration
To use this library, you need to configure a bundler. You can set it up using one of the following methods:

```typescript
// Using JSR
import { ... } from "jsr:@cosense/std";
// Or import specific features
import { ... } from "jsr:@cosense/std/rest";
import { ... } from "jsr:@cosense/std/browser";
```

2. Required Modules
Import the modules based on your needs:
- REST API operations: `rest` module
- Browser operations: `browser` module
- Utilities: `title`, `parseAbsoluteLink`, etc.

## Examples

### Basic Usage

1. Retrieving Page Information
```typescript
import { getPage } from "jsr:@cosense/std/rest";

const page = await getPage("projectName", "pageName");
console.log(page.title);
```

2. DOM Operations
```typescript
import { getLines } from "jsr:@cosense/std/browser/dom";

const lines = getLines();
console.log(lines.map(line => line.text));
```

3. External Link Analysis
```typescript
import { parseAbsoluteLink } from "jsr:@cosense/std";
import type { LinkNode } from "@progfay/scrapbox-parser";

const link: LinkNode = {
  type: "link",
  pathType: "absolute",
  href: "https://www.youtube.com/watch?v=xxxxx",
  content: ""
};
const parsed = parseAbsoluteLink(link);
if (parsed.type === "youtube") {
  console.log(parsed.videoId);
}
```

### Important Notes
- You must use a bundler to use this library
- TypeScript type definitions are available
- For more detailed examples, refer to the [Examples](https://github.com/takker99/scrapbox-userscript-std/tree/main/examples) directory
