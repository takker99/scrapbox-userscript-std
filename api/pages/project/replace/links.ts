import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import type { ResponseOfEndpoint } from "../../../../targeted_response.ts";
import { type ExtendedOptions, setDefaults } from "../../../../util.ts";
import { cookie } from "../../../../rest/auth.ts";
import { get } from "../../../users/me.ts";

/** Constructs a request for the `/api/pages/:project/replace/links` endpoint
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project - The project name where all links will be replaced
 * @param from - The original link text to be replaced
 * @param to - The new link text to replace with
 * @param init - Additional configuration options
 * @returns A {@linkcode Request} object for replacing links in `project`
 */
export const makePostRequest = <R extends Response | undefined>(
  project: string,
  from: string,
  to: string,
  init?: ExtendedOptions<R>,
): Request => {
  const { sid, baseURL, csrf } = setDefaults(init ?? {});

  return new Request(
    `${baseURL}api/pages/${project}/replace/links`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": csrf ?? "",
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
      body: JSON.stringify({ from, to }),
    },
  );
};

/** Retrieves JSON data for a specified page
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project - The project name where all links will be replaced
 * @param from - The original link text to be replaced
 * @param to - The new link text to replace with
 * @param init - Additional configuration options
 * @returns A {@linkcode Result}<{@linkcode unknown}, {@linkcode Error}> containing:
 *          - Success: The page data in JSON format
 *          - Error: One of several possible errors:
 *            - {@linkcode NotFoundError}: Page not found
 *            - {@linkcode NotLoggedInError}: Authentication required
 *            - {@linkcode NotMemberError}: User lacks access
 */
export const post = async <R extends Response | undefined = Response>(
  project: string,
  from: string,
  to: string,
  init?: ExtendedOptions<R>,
): Promise<
  ResponseOfEndpoint<{
    200: string;
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
  }, R>
> => {
  let { csrf, fetch, ...init2 } = setDefaults(init ?? {});

  if (!csrf) {
    const res = await get(init2);
    if (!res.ok) return res;
    csrf = (await res.json()).csrfToken;
  }

  return fetch(
    makePostRequest(project, from, to, { csrf, ...init2 }),
  ) as Promise<
    ResponseOfEndpoint<{
      200: string;
      404: NotFoundError;
      401: NotLoggedInError;
      403: NotMemberError;
    }, R>
  >;
};
