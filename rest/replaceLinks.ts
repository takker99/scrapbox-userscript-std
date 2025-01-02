import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import type { TargetedResponse } from "./targeted_response.ts";
import {
  type createErrorResponse as _createErrorResponse,
  createSuccessResponse,
  createTargetedResponse,
} from "./utils.ts";
import type { FetchError } from "./robustFetch.ts";
import { type ExtendedOptions, setDefaults } from "./options.ts";

export type ReplaceLinksError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | HTTPError;

/** 指定したproject内の全てのリンクを書き換える
 *
 * リンクと同一のタイトルは書き換わらないので注意
 * - タイトルも書き換えたいときは/browser/mod.tsの`patch()`などで書き換えること
 *
 * @param project これで指定したproject内の全てのリンクが置換対象となる
 * @param from 置換前のリンク
 * @param to 置換後のリンク
 * @param init connect.sidなど
 * @return 置換されたリンクがあったページの数
 */
export const replaceLinks = async (
  project: string,
  from: string,
  to: string,
  init?: ExtendedOptions,
): Promise<
  TargetedResponse<200 | 400 | 404, number | ReplaceLinksError | FetchError>
> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const csrfToken = await getCSRFToken(init);
  if (!csrfToken.ok) return csrfToken;

  const req = new Request(
    `https://${hostName}/api/pages/${project}/replace/links`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": csrfToken.data,
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
      body: JSON.stringify({ from, to }),
    },
  );

  const res = await fetch(req);
  const response = createTargetedResponse<
    200 | 400 | 404,
    number | ReplaceLinksError
  >(res);

  await parseHTTPError(response, [
    "NotFoundError",
    "NotLoggedInError",
    "NotMemberError",
  ]);

  if (response.ok) {
    // The message contains text like "2 pages have been successfully updated!"
    const { message } = await response.json() as { message: string };
    return createSuccessResponse(parseInt(message.match(/\d+/)?.[0] ?? "0"));
  }

  return response;
};
