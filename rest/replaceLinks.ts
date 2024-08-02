import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  orElseAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import { toResultOkFromMaybe } from "option-t/maybe";
import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { AbortError, NetworkError } from "./robustFetch.ts";
import { type ExtendedOptions, setDefaults } from "./util.ts";

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
  Result<
    number,
    | NotFoundError
    | NotLoggedInError
    | NotMemberError
    | NetworkError
    | AbortError
    | HTTPError
  >
> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});

  const csrfResult = await orElseAsyncForResult(
    toResultOkFromMaybe(csrf),
    () => getCSRFToken(init),
  );
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
      // messageには"2 pages have been successfully updated!"というような文字列が入っているはず
      const { message } = (await res.json()) as { message: string };
      return parseInt(message.match(/\d+/)?.[0] ?? "0");
    },
  );
};
