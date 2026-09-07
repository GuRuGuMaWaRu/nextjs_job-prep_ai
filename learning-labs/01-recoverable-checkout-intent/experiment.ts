type CheckoutSession = {
  id: string;
  idempotencyKey: string;
};

type CreateResult = {
  session: CheckoutSession;
  reusedExistingSession: boolean;
};

class LostResponseError extends Error {
  constructor() {
    super("The caller did not receive the provider response.");
    this.name = "LostResponseError";
  }
}

class FakeCheckoutProvider {
  private readonly sessions: CheckoutSession[] = [];
  private readonly sessionsByKey = new Map<string, CheckoutSession>();

  createSession(idempotencyKey: string, loseResponse: boolean): CreateResult {
    const existingSession = this.sessionsByKey.get(idempotencyKey);
    const session = existingSession ?? this.createNewSession(idempotencyKey);

    if (loseResponse) {
      throw new LostResponseError();
    }

    return {
      session,
      reusedExistingSession: existingSession != null,
    };
  }

  listSessions(): readonly CheckoutSession[] {
    return this.sessions;
  }

  private createNewSession(idempotencyKey: string): CheckoutSession {
    const session = {
      id: `cs_fake_${this.sessions.length + 1}`,
      idempotencyKey,
    };

    this.sessions.push(session);
    this.sessionsByKey.set(idempotencyKey, session);

    return session;
  }
}

function callProvider(
  provider: FakeCheckoutProvider,
  idempotencyKey: string,
  loseResponse: boolean,
): string {
  try {
    const result = provider.createSession(idempotencyKey, loseResponse);
    const reuseDescription = result.reusedExistingSession
      ? "reused an existing session"
      : "created a new session";

    return `received ${result.session.id}; provider ${reuseDescription}`;
  } catch (error) {
    if (error instanceof LostResponseError) {
      return "received no response; provider outcome is unknown to this caller";
    }

    throw error;
  }
}

const provider = new FakeCheckoutProvider();

// Petro-owned identity lines: these two values express whether the calls are
// two attempts at one logical operation or two unrelated operations.
const firstAttemptKey = "subscribe-intent-request-A";
const retryAttemptKey = firstAttemptKey;

const callerAObservation = callProvider(provider, firstAttemptKey, true);
const callerBObservation = callProvider(provider, retryAttemptKey, false);

console.log("Caller A:", callerAObservation);
console.log("Caller B:", callerBObservation);
console.table(provider.listSessions());
console.log("Provider session count:", provider.listSessions().length);
