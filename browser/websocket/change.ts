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
  | TitleChange;
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
  /** file id */
  files: string[];
}
export interface HelpFeelsChange {
  /** Helpfeel記法の先頭の`? `をとったもの */
  helpfeels: string[];
}
export interface infoboxDefinitionChange {
  /** `table:infobox`または`table:cosense`の各行をtrimしたもの */
  infoboxDefinition: string[];
}
export interface PinChange {
  pin: number;
}
export interface DeletePageChange {
  deleted: true;
  merged?: true;
}
