/** Stream link data from a project with pagination
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name to list pages from
 * @param options Additional configuration options for the request
 * @yields {@linkcode Result}<{@linkcode SearchedTitle}, {@linkcode HTTPError} | {@linkcode TypedError}<"NotLoggedInError" | "NotMemberError" | "NotFoundError" | "InvalidFollowingIdError">>
 */

import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  SearchedTitle,
} from "@cosense/types/rest";
import {
  createErr,
  createOk,
  isErr,
  type Result,
  unwrapErr,
  unwrapOk,
} from "option-t/plain_result";
import {
  type HTTPError,
  makeError,
  makeHTTPError,
  type TypedError,
} from "../error.ts";
import type { ResponseOfEndpoint } from "../targeted_response.ts";
import {
  getLinks,
  type GetLinksOptions,
} from "../api/pages/project/search/titles.ts";

const toResult = async (
  response: ResponseOfEndpoint<{
    200: SearchedTitle[];
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
    422: { message: string };
  }, Response>,
): Promise<
  Result<
    Response,
    | TypedError<
      "NotLoggedInError" | "NotMemberError" | "NotFoundError" |
        "InvalidFollowingIdError"
    >
    | HTTPError
  >
> => {
  switch (response.status) {
    case 200:
      return createOk(response);
    case 401:
    case 403:
    case 404: {
      const error = await response.json();
      return createErr(
        makeError(
          error.name,
          error.message,
        ) as TypedError<
          "NotLoggedInError" | "NotMemberError" | "NotFoundError"
        >,
      );
    }
    case 422:
      return createErr(
        makeError(
          "InvalidFollowingIdError",
          (await response.json()).message,
        ) as TypedError<"InvalidFollowingIdError">,
      );
    default:
      return createErr(makeHTTPError(response));
  }
};

/** Retrieve all link data from a specified project one by one
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name to list pages from
 * @param options Additional configuration options for the request
 * @returns An async generator that yields each link data
 */
export async function* getLinksStream(
  project: string,
  options?: GetLinksOptions<Response>,
): AsyncGenerator<
  Result<
    SearchedTitle,
    | HTTPError
    | TypedError<
      "NotLoggedInError" | "NotMemberError" | "NotFoundError" |
        "InvalidFollowingIdError"
    >
  >,
  void,
  unknown
> {
  let followingId = options?.followingId ?? "";
  do {
    const result = await toResult(
      await getLinks(project, { ...options, followingId }),
    );
    if (isErr(result)) {
      yield createErr(unwrapErr(result));
      return;
    }
    const response = unwrapOk(result);
    const titles: SearchedTitle[] = await response.json();
    for (const title of titles) {
      yield createOk(title);
    }
    followingId = response.headers.get("X-following-id") ?? "";
  } while (followingId);
}
