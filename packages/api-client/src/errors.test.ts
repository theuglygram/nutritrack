import { AuthApiError, type PostgrestError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { fromAuthError, fromPostgrestError } from "./errors.ts";

function pgError(fields: Partial<PostgrestError>): PostgrestError {
  return {
    name: "PostgrestError",
    message: "x",
    details: "",
    hint: "",
    code: "",
    ...fields,
  } as PostgrestError;
}

describe("error mapping", () => {
  it("maps known auth error codes to stable codes and friendly messages", () => {
    const e = fromAuthError(
      new AuthApiError("Invalid login credentials", 400, "invalid_credentials"),
    );
    expect(e.code).toBe("invalid_credentials");
    expect(e.message).toBe("Email or password is incorrect.");
    expect(fromAuthError(new AuthApiError("x", 403, "otp_expired")).code).toBe("invalid_code");
  });

  it("never leaks raw server messages for unknown errors", () => {
    const e = fromAuthError(
      new AuthApiError("internal: stack trace here", 500, "unexpected_failure"),
    );
    expect(e.code).toBe("unknown");
    expect(e.message).not.toContain("stack trace");
  });

  it("maps our database hints", () => {
    expect(fromPostgrestError(pgError({ code: "23514", hint: "calorie_floor" })).code).toBe(
      "calorie_floor",
    );
    expect(fromPostgrestError(pgError({ code: "23514", hint: "underage" })).code).toBe("underage");
    expect(fromPostgrestError(pgError({ code: "42501" })).code).toBe("not_signed_in");
    expect(fromPostgrestError(pgError({ code: "23514" })).code).toBe("validation");
  });
});
