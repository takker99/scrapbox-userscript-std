export class UnexpectedResponseError extends Error {
  name = "UnexpectedResponseError";
  status: number;
  statusText: string;
  body: string;
  path: URL;

  constructor(
    init: { status: number; statusText: string; body: string; path: URL },
  ) {
    super(
      `${init.status} ${init.statusText} when fetching ${init.path.toString()}`,
    );

    this.status = init.status;
    this.statusText = init.statusText;
    this.body = init.body;
    this.path = init.path;

    // @ts-ignore only available on V8
    if (Error.captureStackTrace) {
      // @ts-ignore only available on V8
      Error.captureStackTrace(this, UnexpectedResponseError);
    }
  }
}
