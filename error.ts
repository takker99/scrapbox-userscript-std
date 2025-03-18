export interface TypedError<Name extends string, Cause extends Error = Error>
  extends Error {
  /**
   * The error name
   */
  readonly name: Name;

  /**
   * The error cause
   */
  readonly cause?: Cause;
}

export const makeError = <Name extends string, Cause extends Error = Error>(
  name: Name,
  message?: string,
  cause?: Cause,
): TypedError<Name, Cause> => {
  // from https://stackoverflow.com/a/43001581
  type Writeable<T> = { -readonly [P in keyof T]: T[P] };

  const error = new Error(message, { cause }) as Writeable<
    TypedError<Name, Cause>
  >;
  error.name = name;
  return error;
};

export interface HTTPError<Cause extends Error = Error>
  extends TypedError<"HTTPError", Cause> {
  readonly response: Response;
}

export const makeHTTPError = <Cause extends Error = Error>(
  response: Response,
  message?: string,
  cause?: Cause,
): HTTPError<Cause> => {
  // from https://stackoverflow.com/a/43001581
  type Writeable<T> = { -readonly [P in keyof T]: T[P] };

  const error = new Error(message, { cause }) as Writeable<HTTPError<Cause>>;
  error.name = "HTTPError";
  error.response = response;
  return error;
};
