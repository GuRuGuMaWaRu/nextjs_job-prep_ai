jest.mock("@arcjet/next", () => {
  const mockProtect = jest.fn();

  return {
    __esModule: true,
    default: jest.fn(() => ({ protect: mockProtect })),
    detectBot: jest.fn((config) => config),
    mockProtect,
    shield: jest.fn((config) => config),
    slidingWindow: jest.fn((config) => config),
  };
});

jest.mock("@/core/data/env/server", () => ({
  env: { ARCJET_KEY: "test-arcjet-key" },
}));

import { NextRequest } from "next/server";

import { routes } from "@/core/data/routes";
import { SESSION_COOKIE_NAME } from "@/core/features/auth/constants";
import middleware, { config } from "./proxy";

type ArcjetDecision = { isDenied: () => boolean };
type ArcjetMockModule = {
  mockProtect: jest.Mock<Promise<ArcjetDecision>, [NextRequest]>;
};

const { mockProtect } = jest.requireMock("@arcjet/next") as ArcjetMockModule;

const allowDecision = { isDenied: () => false };
const denyDecision = { isDenied: () => true };
const requestOrigin = "http://localhost:3000";

function buildRequest(
  pathname: string,
  options?: { sessionToken?: string },
): NextRequest {
  const url = `${requestOrigin}${pathname}`;
  const headers = new Headers();

  if (options?.sessionToken) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${options.sessionToken}`);
  }

  return new NextRequest(url, { headers });
}

function expectNext(response: Response): void {
  expect(response.status).toBe(200);
  expect(response.headers.get("x-middleware-next")).toBe("1");
}

function expectRedirect(response: Response, location: string): void {
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(location);
}

async function expectForbidden(response: Response): Promise<void> {
  expect(response.status).toBe(403);
  await expect(response.text()).resolves.toBe("");
}

describe("proxy middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProtect.mockResolvedValue(allowDecision);
  });

  describe("bypass routes", () => {
    it("continues Stripe webhooks without Arcjet or auth", async () => {
      const request = buildRequest("/api/stripe/webhooks");

      const response = await middleware(request);

      expectNext(response);
      expect(mockProtect).not.toHaveBeenCalled();
    });

    it("continues cron routes without Arcjet or auth", async () => {
      const request = buildRequest("/api/cron/sync-stripe-subscriptions");

      const response = await middleware(request);

      expectNext(response);
      expect(mockProtect).not.toHaveBeenCalled();
    });
  });

  describe("Arcjet protection", () => {
    it("runs Arcjet for API requests before redirecting unauthenticated users", async () => {
      const request = buildRequest(routes.api.aiQuestionGeneration);

      const response = await middleware(request);

      expect(mockProtect).toHaveBeenCalledWith(request);
      expectRedirect(response, `${requestOrigin}${routes.signIn}`);
    });

    it("returns forbidden when Arcjet denies an API request", async () => {
      mockProtect.mockResolvedValue(denyDecision);
      const request = buildRequest(routes.api.aiQuestionGeneration);

      const response = await middleware(request);

      expect(mockProtect).toHaveBeenCalledWith(request);
      await expectForbidden(response);
    });

    it("skips Arcjet for Stripe API routes", async () => {
      mockProtect.mockResolvedValue(denyDecision);
      const request = buildRequest("/api/stripe/create-checkout-session", {
        sessionToken: "test-session-token",
      });

      const response = await middleware(request);

      expectNext(response);
      expect(mockProtect).not.toHaveBeenCalled();
    });

    it("skips Arcjet for non-API pages", async () => {
      const request = buildRequest(routes.newJobInfo, {
        sessionToken: "test-session-token",
      });

      const response = await middleware(request);

      expectNext(response);
      expect(mockProtect).not.toHaveBeenCalled();
    });
  });

  describe("public route auth", () => {
    it("continues the landing route without a session cookie", async () => {
      const request = buildRequest(routes.landing);

      const response = await middleware(request);

      expectNext(response);
    });

    it("redirects the landing route with a session cookie to session validation", async () => {
      const request = buildRequest(routes.landing, {
        sessionToken: "test-session-token",
      });

      const response = await middleware(request);

      expectRedirect(response, `${requestOrigin}${routes.api.validateSession}`);
    });

    it("continues sign-in without a session cookie", async () => {
      const request = buildRequest(routes.signIn);

      const response = await middleware(request);

      expectNext(response);
    });

    it("continues sign-up without a session cookie", async () => {
      const request = buildRequest(routes.signUp);

      const response = await middleware(request);

      expectNext(response);
    });

    it("continues nested OAuth routes without a session cookie", async () => {
      const request = buildRequest("/api/oauth/google");

      const response = await middleware(request);

      expectNext(response);
    });

    it("continues nested sign-in routes without a session cookie", async () => {
      const request = buildRequest("/sign-in/callback");

      const response = await middleware(request);

      expectNext(response);
    });
  });

  describe("protected route auth", () => {
    it("redirects app routes without a session cookie to sign-in", async () => {
      const request = buildRequest(routes.app);

      const response = await middleware(request);

      expectRedirect(response, `${requestOrigin}${routes.signIn}`);
    });

    it("continues app job info routes with a session cookie", async () => {
      const request = buildRequest(routes.jobInfo("abc"), {
        sessionToken: "test-session-token",
      });

      const response = await middleware(request);

      expectNext(response);
    });

    it("redirects validate-session API requests without a session cookie to sign-in", async () => {
      const request = buildRequest(routes.api.validateSession);

      const response = await middleware(request);

      expect(mockProtect).toHaveBeenCalledWith(request);
      expectRedirect(response, `${requestOrigin}${routes.signIn}`);
    });
  });

  describe("config", () => {
    it("matches app and API routes", () => {
      expect(config.matcher).toEqual([
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
      ]);
    });
  });
});
