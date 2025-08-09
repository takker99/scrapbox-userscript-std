#!/usr/bin/env -S deno run -A

// Alternative npm package creation without dnt dependencies
// This creates a basic npm package structure manually

const version = Deno.args[0] ?? "0.0.0";

console.log(`Creating npm package structure version ${version}...`);

// Create npm directory
try {
  await Deno.remove("./npm", { recursive: true });
} catch {
  // Directory doesn't exist, that's fine
}
await Deno.mkdir("./npm", { recursive: true });

// Read the deno.jsonc to get the exports structure
let denoConfig;
try {
  const denoConfigText = await Deno.readTextFile("./deno.jsonc");
  // Simple JSON parsing (removing comments)
  const cleanJson = denoConfigText.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
  denoConfig = JSON.parse(cleanJson);
} catch (error) {
  console.error("Could not read deno.jsonc:", error.message);
  Deno.exit(1);
}

// Generate exports from deno.jsonc exports
const npmExports: Record<string, any> = {};
for (const [exportPath, filePath] of Object.entries(denoConfig.exports || {})) {
  if (typeof filePath === 'string') {
    const jsPath = filePath.replace('.ts', '.js');
    const dtsPath = filePath.replace('.ts', '.d.ts');
    npmExports[exportPath] = {
      import: jsPath,
      types: dtsPath
    };
  }
}

// Create package.json
const packageJson = {
  name: "@cosense/std",
  version,
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
  keywords: ["scrapbox", "userscript", "typescript", "deno"],
  type: "module",
  main: "./mod.js",
  types: "./mod.d.ts", 
  exports: npmExports,
  files: ["*.js", "*.d.ts", "*/", "README.md", "LICENSE"],
  engines: {
    node: ">=16.0.0",
  },
  dependencies: {
    "option-t": "^51.0.0",
    "socket.io-client": "^4.7.5"
  }
};

await Deno.writeTextFile("./npm/package.json", JSON.stringify(packageJson, null, 2));

// Function to process a TypeScript file to JavaScript
async function processFile(inputPath: string, outputPath: string) {
  try {
    const content = await Deno.readTextFile(inputPath);
    
    // Basic TS to JS conversion
    let jsContent = content
      // Remove type annotations
      .replace(/:\s*[A-Za-z<>[\]|&\s,{}()."'`]+(\s*[=;,)\n{])/g, '$1')
      // Remove type exports and imports
      .replace(/export\s+type\s+.+?;/gs, '')
      .replace(/import\s+type\s+.+?;/gs, '')
      // Update file extensions in imports
      .replace(/from\s+["']([^"']+)\.ts["']/g, 'from "$1.js"')
      .replace(/import\s+["']([^"']+)\.ts["']/g, 'import "$1.js"')
      // Remove Deno-specific imports
      .replace(/import\s+.+?from\s+["']jsr:.+?["'];?\s*/g, '')
      .replace(/import\s+["']jsr:.+?["'];?\s*/g, '');
    
    // Create directory if needed
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    if (dir && dir !== './npm') {
      await Deno.mkdir(`./npm/${dir}`, { recursive: true });
    }
    
    await Deno.writeTextFile(`./npm/${outputPath}`, jsContent);
    
    // Create basic .d.ts file
    let dtsContent = content
      // Keep type definitions but remove implementations
      .replace(/export\s*{[^}]*}/g, '') // Remove re-exports for simplicity
      .replace(/\/\/ @ts-ignore.*/g, ''); // Remove ts-ignore comments
      
    const dtsPath = outputPath.replace('.js', '.d.ts');
    await Deno.writeTextFile(`./npm/${dtsPath}`, dtsContent);
    
    console.log(`✅ Processed ${inputPath} -> ${outputPath} & ${dtsPath}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Could not process ${inputPath}: ${error.message}`);
    return false;
  }
}

// Process all files from deno.jsonc exports
const processedFiles = new Set<string>();
for (const [exportPath, filePath] of Object.entries(denoConfig.exports || {})) {
  if (typeof filePath === 'string' && filePath.endsWith('.ts')) {
    if (!processedFiles.has(filePath)) {
      const jsPath = filePath.replace('.ts', '.js');
      await processFile(filePath, jsPath);
      processedFiles.add(filePath);
    }
  }
}

// Copy additional files
await Deno.copyFile("LICENSE", "npm/LICENSE");
await Deno.copyFile("README.md", "npm/README.md");

console.log("✅ Manual npm package structure created successfully!");
console.log(`📁 Generated ${processedFiles.size} modules from deno.jsonc exports`);
console.log("⚠️  Note: This is a basic conversion. Some advanced TypeScript features may not work correctly.");