import { /*ALBEvent,*/ APIGatewayProxyEventV2 } from "aws-lambda";
import { serializeError } from "serialize-error";
import { LambdaResponse } from "./lib/routing/model";
import { Router } from "./lib/routing/Router";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "*",
  "access-control-allow-headers": "*",
};

export const proxyHandler = async (
  event: APIGatewayProxyEventV2 /*| ALBEvent*/
): Promise<LambdaResponse> => {
  try {
    const router = new Router(event);
    router.get("/", async (requestParameters) => {
      return {
        statusCode: 200,
        body: {
          msg: "Hello from lambda",
          requestParameters,
        },
      };
    });

    const routerResponse = await router.routeRequest();
    return {
      headers: { "content-type": "application/json", ...corsHeaders },
      ...routerResponse,
      body:
        typeof routerResponse.body === "string"
          ? routerResponse.body
          : JSON.stringify(routerResponse.body),
    };
  } catch (error) {
    const e = serializeError(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e,
      }),
    };
  }
};
