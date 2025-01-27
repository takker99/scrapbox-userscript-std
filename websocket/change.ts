export type Change =
  | InsertChange
  | UpdateChange
  | DeleteChange
  | LinksChange
  | ProjectLinksChange
  | IconsChange
  | DescriptionsChange
  | ImageChange
  | FilesChange
  | HelpFeelsChange
  | infoboxDefinitionChange
  | TitleChange
  | PinChange;
export interface InsertChange {
  _insert: string;
  lines: {
    id: string;
    text: string;
  };
}
export interface UpdateChange {
  _update: string;
  lines: {
    text: string;
  };
  noTimestampUpdate?: unknown;
}
export interface DeleteChange {
  _delete: string;
  lines: -1;
}
export interface LinksChange {
  links: string[];
}
export interface ProjectLinksChange {
  projectLinks: string[];
}
export interface IconsChange {
  icons: string[];
}
export interface DescriptionsChange {
  descriptions: string[];
}
export interface ImageChange {
  image: string | null;
}
export interface TitleChange {
  title: string;
}
export interface FilesChange {
  /** Array of file IDs
   *
   * These IDs reference files that have been uploaded to the page.
   * Files can include images, documents, or other attachments.
   */
  files: string[];
}
export interface HelpFeelsChange {
  /** Array of Helpfeel entries without the leading "? " prefix
   *
   * Helpfeel is a Scrapbox notation for creating help/documentation entries.
   * Example: "? How to use" becomes "How to use" in this array.
   * These entries are used to build the page's help documentation.
   */
  helpfeels: string[];
}
export interface infoboxDefinitionChange {
  /** Array of trimmed lines from infobox tables
   *
   * Contains lines from tables marked with either `table:infobox` or `table:cosense`
   */
  infoboxDefinition: string[];
}
export interface PinChange {
  pin: number;
}
export interface DeletePageChange {
  deleted: true;
  merged?: true;
}
