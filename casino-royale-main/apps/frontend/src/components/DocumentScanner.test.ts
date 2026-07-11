import { describe, expect, it } from "vitest";
import { parseScannedIdentity } from "./DocumentScanner";

describe("parseScannedIdentity", () => {
  it("parses the Panama demo identity payload", () => {
    const result = parseScannedIdentity(
      "8-958-2038|Jack Robert|Garcia Gonzalez||M|PANAMÁ|20000720|PANAMEÑA|20230421|20380421|A01161427"
    );

    expect(result.documentNumber).toBe("8-958-2038");
    expect(result.fullName).toBe("Jack Robert Garcia Gonzalez");
    expect(result.sex).toBe("M");
    expect(result.country).toBe("PANAMÁ");
    expect(result.birthDate).toBe("2000-07-20");
    expect(result.nationality).toBe("PANAMEÑA");
    expect(result.documentIssuedAt).toBe("2023-04-21");
    expect(result.documentExpiresAt).toBe("2038-04-21");
  });
});
