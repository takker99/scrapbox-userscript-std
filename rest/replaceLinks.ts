import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { FetchError } from "./robustFetch.ts";
import { type ExtendedOptions, setDefaults } from "./options.ts";

export type ReplaceLinksError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | HTTPError;

/** Replaces all links within the specified project
 *
 * > [!IMPORTANT]
 * > This function only replaces links, not page titles.
 * > If you need to replace page titles as well, use {@linkcode patch}
 *
 * @param project The project name where all links will be replaced
 * @param from The original link text to be replaced
 * @param to The new link text to replace with
 * @param init Options including `connect.sid` (session ID) and other configuration
 * @return The number of pages where links were replaced
 */
export const replaceLinks = async (
  project: string,
  from: string,
  to: string,
  init?: ExtendedOptions,
): Promise<Result<number, ReplaceLinksError | FetchError>> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const csrfResult = await getCSRFToken(init);
  if (isErr(csrfResult)) return csrfResult;

  const req = new Request(
    `https://${hostName}/api/pages/${project}/replace/links`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": unwrapOk(csrfResult),
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
      body: JSON.stringify({ from, to }),
    },
  );

  const resResult = await fetch(req);
  if (isErr(resResult)) return resResult;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(resResult)),
      async (error) =>
        (await parseHTTPError(error, [
          "NotFoundError",
          "NotLoggedInError",
          "NotMemberError",
        ])) ?? error,
    ),
    async (res) => {
      // message should contain a string like "2 pages have been successfully updated!"
      const { message } = (await res.json()) as { message: string };
      return parseInt(message.match(/\d+/)?.[0] ?? "0");
    },
  );
};
