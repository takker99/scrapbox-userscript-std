import type {
  BadRequestError,
  InvalidURLError,
  NoQueryError,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  NotPrivilegeError,
  SessionError,
} from "@cosense/types/rest";

/**
 * A type-safe response class that extends the web standard Response.
 * It provides status-based type switching and direct access to Response properties.
 */
export class ScrapboxResponse<T = unknown, E = unknown> extends Response {
  error?: E;

  constructor(response: Response) {
    super(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  /**
   * Parse the response body as JSON with type safety based on status code.
   * Returns T for successful responses (2xx) and E for error responses.
   */
  async json(): Promise<T> {
    const data = await super.json();
    return data as T;
  }

  /**
   * Create a new ScrapboxResponse instance from a Response.
   */
  static from<T = unknown, E = unknown>(response: Response): ScrapboxResponse<T, E> {
    if (response instanceof ScrapboxResponse) {
      return response;
    }
    return new ScrapboxResponse<T, E>(response);
  }

  /**
   * Create a new error response with the given error details.
   */
  static error<T = unknown, E = unknown>(
    error: E,
    init?: ResponseInit,
  ): ScrapboxResponse<T, E> {
    const response = new ScrapboxResponse<T, E>(
      new Response(null, {
        status: 400,
        ...init,
      }),
    );
    Object.assign(response, { error });
    return response;
  }

  /**
   * Create a new success response with the given data.
   */
  static success<T = unknown, E = unknown>(
    data: T,
    init?: ResponseInit,
  ): ScrapboxResponse<T, E> {
    return new ScrapboxResponse<T, E>(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        ...init,
      }),
    );
  }

  /**
   * Clone the response while preserving type information and error details.
   */
  clone(): ScrapboxResponse<T, E> {
    const cloned = super.clone();
    const response = new ScrapboxResponse<T, E>(cloned);
    if (this.error) {
      Object.assign(response, { error: this.error });
    }
    return response;
  }
}

export type ScrapboxErrorResponse<E> = ScrapboxResponse<never, E>;
export type ScrapboxSuccessResponse<T> = ScrapboxResponse<T, never>;

export type RESTError =
  | BadRequestError
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | SessionError
  | InvalidURLError
  | NoQueryError
  | NotPrivilegeError;
