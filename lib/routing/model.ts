export interface Route {
  httpMethod: HTTPMethod;
  pathPattern: string;
  handler: RouteHandler;
}

export interface RouteHandlerInput {
  pathParameters: Record<string, string>;
  queryStringParameters: Record<string, string>;
  body: Object | string;
  headers?: Record<string, string>;
}

export type RouteHandler = (
  params: RouteHandlerInput
) => Promise<RouteHandlerResponse>;

export interface RouteHandlerResponse {
  statusCode: number;
  body: Object | string;
  headers?: Record<string, string>;
}

export interface LambdaResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

export type HTTPMethod =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH";
