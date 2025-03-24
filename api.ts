export * as pages from "./api/pages.ts";
export * as projects from "./api/projects.ts";
export * as users from "./api/users.ts";

export {
  get as listPages,
  list as listPagesStream,
  type ListPagesOption,
  type ListPagesStreamOption,
  makeGetRequest as makeListPagesRequest,
} from "./api/pages/project.ts";
export {
  makePostRequest as makeReplaceLinksRequest,
  post as replaceLinks,
} from "./api/pages/project/replace/links.ts";
export {
  get as searchForPages,
  makeGetRequest as makeSearchForPagesRequest,
} from "./api/pages/project/search/query.ts";
export {
  get as getLinks,
  type GetLinksOptions,
  list as readLinks,
  makeGetRequest as makeGetLinksRequest,
} from "./api/pages/project/search/titles.ts";
export {
  get as getPage,
  type GetPageOption,
  makeGetRequest as makeGetPageRequest,
} from "./api/pages/project/title.ts";
export {
  get as getText,
  type GetTextOption,
  makeGetRequest as makeGetTextRequest,
} from "./api/pages/project/title/text.ts";
export {
  get as getIcon,
  type GetIconOption,
  makeGetRequest as makeGetIconRequest,
} from "./api/pages/project/title/icon.ts";
export {
  get as getProject,
  makeGetRequest as makeGetProjectRequest,
} from "./api/projects/project.ts";
export {
  get as getUser,
  makeGetRequest as makeGetUserRequest,
} from "./api/users/me.ts";
