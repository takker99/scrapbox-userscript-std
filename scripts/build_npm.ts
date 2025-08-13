import { build, emptyDir } from "@deno/dnt";
import { parse } from "@std/jsonc";

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
  ).replace(
    "jsr:@cosense/types",
    "npm:@cosense/types",
  ),
);

const config = parse(await Deno.readTextFile("./deno.jsonc")) as {
  exports: Record<string, string>;
};

await build({
  entryPoints: [
    "./mod.ts",
    ...Object.entries(config.exports).flatMap(
      ([name, path]) => name === "." ? [] : [{ name, path }],
    ),
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
  declaration: "inline",
  compilerOptions: {
    lib: ["ESNext", "DOM", "DOM.Iterable"],
    target: "ES2023",
  },
  postBuild: async () => {
    await Deno.copyFile("LICENSE", "npm/LICENSE");
    await Deno.copyFile("README.md", "npm/README.md");

    // ignore snapshot testing & related test files on Node distribution
    const emptyTestFiles = [
      "browser/dom/extractCodeFiles.test.js",
      "parser/anchor-fm.test.js",
      "parser/spotify.test.js",
      "parser/youtube.test.js",
      "rest/getCodeBlocks.test.js",
      "rest/pages.test.js",
      "rest/project.test.js",
      "websocket/_codeBlock.test.js",
      "websocket/diffToChanges.test.js",
    ];
    await Promise.all(
      emptyTestFiles.map((filePath) =>
        Deno.writeTextFile(`npm/esm/${filePath}`, "")
      ),
    );
    await Promise.all(
      emptyTestFiles.map((filePath) =>
        Deno.writeTextFile(`npm/script/${filePath}`, "")
      ),
    );
  },
});
