# scrapbox-userscript-std

[![JSR](https://jsr.io/badges/@cosense/std)](https://jsr.io/@cosense/std)
[![test](https://github.com/takker99/scrapbox-userscript-std/workflows/ci/badge.svg)](https://github.com/takker99/scrapbox-userscript-std/actions?query=workflow%3Aci)

UNOFFICIAL standard module for Scrapbox UserScript

## Getting Started

このライブラリは、Scrapboxのユーザースクリプト開発のための非公式な標準ライブラリです。

### インストール方法

1. bundlerの設定
このライブラリを使用するには、bundlerの設定が必要です。以下のいずれかの方法で設定してください：

```typescript
// Using JSR
import { ... } from "jsr:@cosense/std";
// または特定の機能のみをインポート
import { ... } from "jsr:@cosense/std/rest";
import { ... } from "jsr:@cosense/std/browser";
```

2. 必要なモジュールのインポート
必要な機能に応じて、以下のモジュールをインポートしてください：
- REST API操作: `rest`モジュール
- ブラウザ操作: `browser`モジュール
- ユーティリティ: `title`, `parseAbsoluteLink`など

## Examples

### 基本的な使用例

1. ページ情報の取得
```typescript
import { getPage } from "jsr:@cosense/std/rest";

const page = await getPage("projectName", "pageName");
console.log(page.title);
```

2. DOMの操作
```typescript
import { getLines } from "jsr:@cosense/std/browser/dom";

const lines = getLines();
console.log(lines.map(line => line.text));
```

3. 外部リンクの解析
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

### 注意点
- このライブラリを使用するには、必ずbundlerを通す必要があります
- TypeScriptの型定義が利用可能です
- より詳細な使用例は[Examples](https://github.com/takker99/scrapbox-userscript-std/tree/main/examples)を参照してください
