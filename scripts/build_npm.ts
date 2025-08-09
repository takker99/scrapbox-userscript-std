#!/usr/bin/env -S deno run -A

import { build, emptyDir } from "https://deno.land/x/dnt@0.40.0/mod.ts";

await emptyDir("./npm");

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
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "@cosense/std",
    version: Deno.args[0] ?? "0.0.0",
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
      "deno"
    ],
    engines: {
      node: ">=16.0.0",
    },
  },
  // Don't use import map for npm build to avoid JSR dependency conflicts
  // importMap: "./deno.jsonc",
  
  // Disable tests for npm build as they're Deno-specific
  test: false,
  // Don't run type checking during build to avoid JSR dependency issues
  typeCheck: false,
  declaration: "inline",
  scriptModule: "cjs",
  compilerOptions: {
    lib: ["esnext", "dom", "dom.iterable"],
    target: "ES2020",
  },
});

// Copy additional files
await Deno.copyFile("LICENSE", "npm/LICENSE");
await Deno.copyFile("README.md", "npm/README.md");

console.log("npm package built successfully!");