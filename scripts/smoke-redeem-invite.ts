const baseUrl = (process.env.REDEEM_BASE_URL ?? "https://member.ironvaulttoken.com").replace(/\/$/, "");
const inviteCode = (process.env.REDEEM_INVITE_CODE ?? "AUTOMATION-FUN").trim();
const sessionCookie = process.env.REDEEM_SESSION_COOKIE?.trim();

function fail(message: string): never {
  console.error(`[redeem-smoke] FAIL: ${message}`);
  process.exit(1);
}

async function main() {
  if (!inviteCode) fail("REDEEM_INVITE_CODE is empty");

  if (!sessionCookie) {
    console.error("[redeem-smoke] SKIP: set REDEEM_SESSION_COOKIE to a valid Clerk session cookie before running this smoke test.");
    process.exit(2);
  }

  const response = await fetch(`${baseUrl}/api/access/redeem-invite`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: sessionCookie,
    },
    body: JSON.stringify({ inviteCode }),
  });

  const text = await response.text();
  let json: Record<string, unknown> | null = null;

  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Non-JSON body is still useful for diagnostics.
  }

  const bodyString = json ? JSON.stringify(json) : text;

  if (response.status !== 200) {
    fail(`expected HTTP 200, got ${response.status}. body=${bodyString}`);
  }

  if (bodyString.includes("multiple legacy accounts match this verified Clerk identity")) {
    fail("master-code path still throws legacy ambiguity");
  }

  console.log(`[redeem-smoke] PASS: status=${response.status} body=${bodyString}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(message);
});
