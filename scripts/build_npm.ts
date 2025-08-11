import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

// Replace jsr packages with corresponding npm packages
await Deno.copyFile("./deno.jsonc", "./deno_node.jsonc");
await using stack = new AsyncDisposableStack();
stack.defer(() => Deno.remove("./deno_node.jsonc").catch(() => {}));

await Deno.writeTextFile(
  "./deno_node.jsonc",
  (await Deno.readTextFile("./deno.jsonc")).replace(
    "jsr:@progfay/scrapbox-parser",
    "npm:@progfay/scrapbox-parser",
  ),
);

await build({
  entryPoints: [
    "./mod.ts",
    {
      name: "./browser",
      path: "./browser/mod.ts",
    },
    {
      name: "./browser/dom",
      path: "./browser/dom/mod.ts",
    },
    {
      name: "./browser/websocket",
      path: "./websocket/mod.ts",
    },
    {
      name: "./parseAbsoluteLink",
      path: "./parseAbsoluteLink.ts",
    },
    {
      name: "./rest",
      path: "./rest/mod.ts",
    },
    {
      name: "./text",
      path: "./text.ts",
    },
    {
      name: "./title",
      path: "./title.ts",
    },
    {
      name: "./websocket",
      path: "./websocket/mod.ts",
    },
    {
      name: "./unstable-api",
      path: "./api.ts",
    },
    {
      name: "./unstable-api/pages",
      path: "./api/pages.ts",
    },
    {
      name: "./unstable-api/pages/project",
      path: "./api/pages/project.ts",
    },
    {
      name: "./unstable-api/pages/project/replace",
      path: "./api/pages/project/replace.ts",
    },
    {
      name: "./unstable-api/pages/project/replace/links",
      path: "./api/pages/project/replace/links.ts",
    },
    {
      name: "./unstable-api/pages/project/search",
      path: "./api/pages/project/search.ts",
    },
    {
      name: "./unstable-api/pages/project/search/query",
      path: "./api/pages/project/search/query.ts",
    },
    {
      name: "./unstable-api/pages/project/search/titles",
      path: "./api/pages/project/search/titles.ts",
    },
    {
      name: "./unstable-api/pages/project/title",
      path: "./api/pages/project/title.ts",
    },
    {
      name: "./unstable-api/pages/projects",
      path: "./api/projects.ts",
    },
    {
      name: "./unstable-api/pages/projects/project",
      path: "./api/projects/project.ts",
    },
    {
      name: "./unstable-api/pages/project/title/text",
      path: "./api/pages/project/title/text.ts",
    },
    {
      name: "./unstable-api/pages/project/title/icon",
      path: "./api/pages/project/title/icon.ts",
    },
    {
      name: "./unstable-api/users",
      path: "./api/users.ts",
    },
    {
      name: "./unstable-api/users/me",
      path: "./api/users/me.ts",
    },
  ],
  outDir: "./npm",
  shims: { deno: "dev" },
  package: {
    // package.json properties
    name: "@cosense/std",
    version: Deno.env.get("VERSION") ?? "0.0.0",
    description: "UNOFFICIAL standard module for Scrapbox UserScript",
    author: "takker99",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/takker99/scrapbox-userscript-std.git",
    },
    homepage: "https://github.com/takker99/scrapbox-userscript-std#readme",
    bugs: {
      url: "https://github.com/takker99/scrapbox-userscript-std/issues",
    },
    keywords: [
      "scrapbox",
      "userscript",
      "typescript",
      "deno",
    ],
    engines: {
      node: ">=16.0.0",
    },
  },
  configFile: new URL("../deno_node.jsonc", import.meta.url).href,
  // Don't run type checking during build to avoid Node.js compatibility issues
  typeCheck: false,
  declaration: "separate",
  scriptModule: false,
  compilerOptions: {
    lib: ["ESNext", "DOM", "DOM.Iterable"],
    target: "ES2023",
  },
  postBuild: async () => {
    await Deno.copyFile("LICENSE", "npm/LICENSE");
    await Deno.copyFile("README.md", "npm/README.md");

    // ignore snapshot testing & related test files on Node distribution
    const emptyTestFiles = [
      "npm/esm/browser/dom/extractCodeFiles.test.js",
      "npm/esm/parser/anchor-fm.test.js",
      "npm/esm/parser/spotify.test.js",
      "npm/esm/parser/youtube.test.js",
      "npm/esm/rest/getCodeBlocks.test.js",
      "npm/esm/rest/pages.test.js",
      "npm/esm/rest/project.test.js",
      "npm/esm/websocket/_codeBlock.test.js",
      "npm/esm/websocket/diffToChanges.test.js",
    ];
    await Promise.all(
      emptyTestFiles.map((filePath) => Deno.writeTextFile(filePath, "")),
    );
  },
});
