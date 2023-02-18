import { SimpleCodeFile } from "./updateCodeFile.ts";

/** objectがSimpleCodeFile型かどうかを判別する */
export function isSimpleCodeFile(obj: unknown): obj is SimpleCodeFile {
  if (Array.isArray(obj) || !(obj instanceof Object)) return false;
  const code = obj as SimpleCodeFile;
  const { filename, content, lang } = code;
  return (
    typeof filename == "string" &&
    (typeof content == "string" ||
      (Array.isArray(content) &&
        (content.length == 0 || typeof content[0] == "string"))) &&
    (typeof lang == "string" || lang === undefined)
  );
}