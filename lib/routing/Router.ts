import { ALBEvent, APIGatewayProxyEventV2 } from "aws-lambda";
import {
  HTTPMethod,
  Route,
  RouteHandler,
  RouteHandlerInput,
  RouteHandlerResponse,
} from "./model";

export class Router {
  //request information
  path: string;
  body?: string;
  requestHeaders: Record<string, string>;
  pathParameters: Record<string, string>;
  queryStringParameters: Record<string, string>;
  httpMethod: HTTPMethod;

  //user defined routes
  routes: Route[];

  constructor(lambdaEvent: ALBEvent | APIGatewayProxyEventV2) {
    const isALBEvent = (
      e: ALBEvent | APIGatewayProxyEventV2
    ): e is ALBEvent => {
      return (e as ALBEvent).path !== undefined;
    };

    const isAPIGatewayEvent = (
      e: ALBEvent | APIGatewayProxyEventV2
    ): e is APIGatewayProxyEventV2 => {
      return (e as APIGatewayProxyEventV2).rawPath !== undefined;
    };

    this.body = lambdaEvent.body || undefined;
    this.requestHeaders = lambdaEvent.headers as Record<string, string>;

    if (isALBEvent(lambdaEvent)) {
      this.path = lambdaEvent.path;
      this.queryStringParameters = (lambdaEvent.queryStringParameters ||
        {}) as Record<string, string>;
      this.httpMethod = lambdaEvent.httpMethod as HTTPMethod;
    } else if (isAPIGatewayEvent(lambdaEvent)) {
      this.path = lambdaEvent.rawPath;
      this.queryStringParameters = (lambdaEvent.queryStringParameters ||
        {}) as Record<string, string>;
      this.httpMethod = lambdaEvent.requestContext.http.method as HTTPMethod;
    } else {
      throw "Unexpected event type passed to Router. Expecting ALBEvent or APIGatewayEvent";
    }

    this.pathParameters = {};
    this.routes = [];
  }

  registerRoute(route: Route): void {
    const _isRouteMatch = (): boolean => {
      // if route doesn't match
      if (route.httpMethod !== this.httpMethod) return false;

      // check path
      if (route.pathPattern.includes(":")) {
        // we have path params
        const { pathPattern } = route;
        const regex = new RegExp(
          "^" + pathPattern.replace(/:\w+/g, "([\\w\\d-\\.]+)") + "$"
        );
        const regexMatch = this.path.match(regex);

        if (regexMatch === null) {
          return false;
        }

        const pathParameterKeys = (
          pathPattern.match(/:\w+/g) || []
        ).map((match) => match.substring(1));
        const pathParameterValues = regexMatch.slice(1);
        const pathParameters: Record<string, string> = pathParameterKeys.reduce(
          (accumulator, key, idx) => {
            accumulator[key] = pathParameterValues[idx];
            return accumulator;
          },
          {} as Record<string, string>
        );

        this.pathParameters = pathParameters;
        return true;
      } else {
        return (
          route.httpMethod === this.httpMethod &&
          route.pathPattern === this.path
        );
      }
    };

    if (_isRouteMatch()) this.routes.push(route);
  }

  get(pathPattern: string, handler: RouteHandler): void {
    this.registerRoute({ httpMethod: "GET", pathPattern, handler });
  }

  post(pathPattern: string, handler: RouteHandler): void {
    this.registerRoute({ httpMethod: "POST", pathPattern, handler });
  }

  put(pathPattern: string, handler: RouteHandler): void {
    this.registerRoute({ httpMethod: "PUT", pathPattern, handler });
  }

  patch(pathPattern: string, handler: RouteHandler): void {
    this.registerRoute({ httpMethod: "PATCH", pathPattern, handler });
  }

  options(pathPattern: string, handler: RouteHandler): void {
    this.registerRoute({ httpMethod: "OPTIONS", pathPattern, handler });
  }

  routeRequest(): Promise<RouteHandlerResponse> {
    const route = this.routes[0];
    if (!route) {
      return Promise.reject({
        statusCode: 404,
        body: {
          error: "No route found",
        },
      });
    }
    const input: RouteHandlerInput = {
      pathParameters: this.pathParameters,
      body: JSON.parse(this.body || "{}"),
      queryStringParameters: this.queryStringParameters,
      headers: this.requestHeaders,
    };

    return route.handler(input);
  }
}
