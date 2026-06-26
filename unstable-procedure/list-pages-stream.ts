/** Stream paginated pages from a project
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name to list pages from
 * @param options Configuration options for pagination and sorting
 * @yields {@linkcode Result}<{@linkcode PageSummary}, {@linkcode HTTPError} | {@linkcode TypedError}<"NotFoundError" | "NotLoggedInError" | "NotMemberError">>
 */

import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  PageList,
  PageSummary,
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
import { pooledMap } from "@std/async/pool";
import { range } from "@core/iterutil/range";
import { flatten } from "@core/iterutil/async/flatten";
import { listPages, type ListPagesOption } from "../api/pages/project.ts";

/** Options for {@linkcode listPagesStream}
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface ListPagesStreamOption<R extends Response | undefined>
  extends ListPagesOption<R> {
  /** The number of requests to make concurrently
   *
   * @default {3}
   */
  poolLimit?: number;
}

const toResult = async (
  response: ResponseOfEndpoint<{
    200: PageList;
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
  }, Response>,
): Promise<
  Result<
    PageList,
    TypedError<"NotFoundError" | "NotLoggedInError" | "NotMemberError"> |
      HTTPError
  >
> => {
  switch (response.status) {
    case 200:
      return createOk(await response.json());
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
    default:
      return createErr(makeHTTPError(response));
  }
};

/** Lists pages from a given `project` with pagination
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name to list pages from
 * @param options Configuration options for pagination and sorting
 */
export async function* listPagesStream(
  project: string,
  options?: ListPagesStreamOption<Response>,
): AsyncGenerator<
  Result<
    PageSummary,
    HTTPError | TypedError<
      "NotFoundError" | "NotLoggedInError" | "NotMemberError"
    >
  >,
  void,
  unknown
> {
  const props = {
    ...(options ?? {}),
    skip: options?.skip ?? 0,
    limit: options?.limit ?? 100,
  };
  const result = await toResult(await listPages(project, props));
  if (isErr(result)) {
    yield createErr(unwrapErr(result));
    return;
  }
  const list = unwrapOk(result);
  for (const page of list.pages) {
    yield createOk(page);
  }

  const limit = list.limit;
  const skip = list.skip + limit;
  const times = Math.ceil((list.count - skip) / limit);

  yield* flatten(
    pooledMap(
      options?.poolLimit ?? 3,
      range(0, times - 1),
      async (
        i,
      ): Promise<
        Result<
          PageSummary,
          HTTPError | TypedError<
            "NotFoundError" | "NotLoggedInError" | "NotMemberError"
          >
        >[]
      > => {
        const result = await toResult(
          await listPages(project, {
            ...props,
            skip: skip + i * limit,
            limit,
          }),
        );
        if (isErr(result)) {
          return [createErr(unwrapErr(result))];
        }
        const list = unwrapOk(result);
        return list.pages.map((page) => createOk(page));
      },
    ),
  );
}
