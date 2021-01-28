import { ALBEvent, APIGatewayProxyEventV2 } from "aws-lambda";
import { Router } from "./Router";

const albEvent: ALBEvent = {
  requestContext: {
    elb: {
      targetGroupArn:
        "arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/lambda-279XGJDqGZ5rsrHC2Fjr/49e9d65c45c6791a",
    },
  },
  httpMethod: "GET",
  path: "/lambda",
  queryStringParameters: {
    query: "1234ABCD",
  },
  headers: {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "accept-encoding": "gzip",
    "accept-language": "en-US,en;q=0.9",
    connection: "keep-alive",
    host: "lambda-alb-123578498.us-east-2.elb.amazonaws.com",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
    "x-amzn-trace-id": "Root=1-5c536348-3d683b8b04734faae651f476",
    "x-forwarded-for": "72.12.164.125",
    "x-forwarded-port": "80",
    "x-forwarded-proto": "http",
    "x-imforwards": "20",
  },
  body: "",
  isBase64Encoded: false,
};

test("Test ALBEvent Parsing", () => {
  const router = new Router(albEvent);

  expect(router.path).toBe("/lambda");
  expect(router.httpMethod).toBe("GET");
  expect(router.queryStringParameters).toMatchObject({ query: "1234ABCD" });
  expect(router.requestHeaders["accept"]).toBeDefined();
});

const apiGatewayEvent: APIGatewayProxyEventV2 = {
  version: "2.0",
  routeKey: "$default",
  rawPath: "/my/path",
  rawQueryString: "parameter1=value1&parameter1=value2&parameter2=value",
  cookies: ["cookie1", "cookie2"],
  headers: {
    Header1: "value1",
    Header2: "value1,value2",
  },
  queryStringParameters: {
    parameter1: "value1,value2",
    parameter2: "value",
  },
  requestContext: {
    accountId: "123456789012",
    apiId: "api-id",
    authorizer: {
      jwt: {
        claims: {
          claim1: "value1",
          claim2: "value2",
        },
        scopes: ["scope1", "scope2"],
      },
    },
    domainName: "id.execute-api.us-east-1.amazonaws.com",
    domainPrefix: "id",
    http: {
      method: "POST",
      path: "/my/path",
      protocol: "HTTP/1.1",
      sourceIp: "IP",
      userAgent: "agent",
    },
    requestId: "id",
    routeKey: "$default",
    stage: "$default",
    time: "12/Mar/2020:19:03:58 +0000",
    timeEpoch: 1583348638390,
  },
  body: "Hello from Lambda",
  pathParameters: {},
  isBase64Encoded: false,
  stageVariables: {
    stageVariable1: "value1",
    stageVariable2: "value2",
  },
};

test("Test APIGatewayProxyEvent Parsing", () => {
  const router = new Router(apiGatewayEvent);

  expect(router.path).toBe("/my/path");
  expect(router.httpMethod).toBe("POST");
  expect(router.queryStringParameters.parameter2).toBeDefined();
  expect(router.requestHeaders["Header1"]).toBeDefined();
});

const apiGatewayEventPostEvent: APIGatewayProxyEventV2 = {
  version: "2.0",
  routeKey: "$default",
  rawPath: "/jobs",
  rawQueryString: "parameter1=value1&parameter1=value2&parameter2=value",
  cookies: ["cookie1", "cookie2"],
  headers: {
    Header1: "value1",
    Header2: "value1,value2",
  },
  queryStringParameters: {
    parameter1: "value1,value2",
    parameter2: "value",
  },
  requestContext: {
    accountId: "123456789012",
    apiId: "api-id",
    authorizer: {
      jwt: {
        claims: {
          claim1: "value1",
          claim2: "value2",
        },
        scopes: ["scope1", "scope2"],
      },
    },
    domainName: "id.execute-api.us-east-1.amazonaws.com",
    domainPrefix: "id",
    http: {
      method: "POST",
      path: "/jobs",
      protocol: "HTTP/1.1",
      sourceIp: "IP",
      userAgent: "agent",
    },
    requestId: "id",
    routeKey: "$default",
    stage: "$default",
    time: "12/Mar/2020:19:03:58 +0000",
    timeEpoch: 1583348638390,
  },
  body: "{}",
  pathParameters: {},
  isBase64Encoded: false,
  stageVariables: {
    stageVariable1: "value1",
    stageVariable2: "value2",
  },
};

test("Empty Router returns 404", async () => {
  const router = new Router(apiGatewayEventPostEvent);
  await expect(router.routeRequest()).rejects.toHaveProperty("statusCode", 404);
});

test("Router with incorrect path returns 404", async () => {
  const event = {
    ...apiGatewayEventPostEvent,
    rawPath: "/jobs",
  };
  // match the second in the list
  const router = new Router(event);
  router.post("/users", () => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        type: "POST",
      },
    });
  });
  await expect(router.routeRequest()).rejects.toHaveProperty("statusCode", 404);
});

test("Match route by method", async () => {
  const event = {
    ...apiGatewayEventPostEvent,
    rawPath: "/jobs",
  };
  // match the second item in the list
  const router = new Router(event);
  router.post("/users", () => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        type: "POST",
      },
    });
  });
  router.post("/jobs", () => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        type: "POST",
      },
    });
  });
  router.get("/jobs", () => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        type: "GET",
      },
    });
  });

  await expect(router.routeRequest()).resolves.toHaveProperty(
    "body.type",
    "POST"
  );
});

test("Match with path parameters", async () => {
  const event: ALBEvent = {
    ...albEvent,
    path: "/jobs/1234/csv",
    httpMethod: "GET",
  };
  // match the second in the list
  const router = new Router(event);
  router.post("/jobs/:jobId", (params) => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        pathParameters: params.pathParameters,
      },
    });
  });

  router.get("/jobs/:jobId/csv", (params) => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        pathParameters: params.pathParameters,
        action: "CSV",
      },
    });
  });

  router.get("/jobs/:jobId/json", (params) => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        pathParameters: params.pathParameters,
        action: "JSON",
      },
    });
  });

  await expect(router.routeRequest()).resolves.toHaveProperty(
    "body.action",
    "CSV"
  );
});

test("Match with multiple parameters", async () => {
  const event: ALBEvent = {
    ...albEvent,
    path: "/users/1234/connections/5678",
    httpMethod: "GET",
  };
  // match the second in the list
  const router = new Router(event);
  router.get("/users", (params) => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        pathParameters: params.pathParameters,
        action: "LIST_USERS",
      },
    });
  });

  router.get("/users/:userId", (params) => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        pathParameters: params.pathParameters,
        action: "GET_USER",
      },
    });
  });

  router.get("/users/:userId/connections", (params) => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        pathParameters: params.pathParameters,
        action: "LIST_USER_CONNECTIONS",
      },
    });
  });

  router.get("/users/:userId/connections/:connectionId", (params) => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        pathParameters: params.pathParameters,
        action: "GET_USER_CONNECTION",
      },
    });
  });

  await expect(router.routeRequest()).resolves.toHaveProperty(
    "body.action",
    "GET_USER_CONNECTION"
  );
  await expect(router.routeRequest()).resolves.toHaveProperty(
    "body.pathParameters.connectionId",
    "5678"
  );
});
