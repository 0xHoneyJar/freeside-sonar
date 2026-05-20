import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  verifyBeltConfig,
  extractContractDefinition,
  extractChainContractRef,
  BELT_CONTRACTS,
  BELT_CHAIN_ID,
} from "../scripts/verify-belt-config.js";

// Real configs, loaded once. Mismatch cases mutate copies in memory — no temp
// files, no disk writes.
const beltText = readFileSync("config.mibera.yaml", "utf8");
const monoText = readFileSync("config.yaml", "utf8");

describe("verify-belt-config", () => {
  it("passes against the real config.mibera.yaml (AC-2 / AC-11)", () => {
    const result = verifyBeltConfig({
      beltConfigPath: "config.mibera.yaml",
      monolithConfigPath: "config.yaml",
    });
    expect(result.mismatches).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("scopes verification to exactly the two Mibera belt contracts", () => {
    expect(BELT_CONTRACTS).toEqual(["MiberaLiquidBacking", "MiberaCollection"]);
    expect(BELT_CHAIN_ID).toBe(80094);
  });

  it("fails when a field_selection field is removed — the silent-data-loss case (SDD §5.1)", () => {
    // Drop `value` from MiberaCollection.Transfer — the field mibera-collection.ts
    // reads for MintActivity.amountPaid. Omitting it silently writes 0n, no crash.
    const broken = beltText.replace("            - value\n", "");
    expect(broken).not.toBe(beltText); // injection landed
    const result = verifyBeltConfig({
      beltConfigText: broken,
      monolithConfigText: monoText,
    });
    expect(result.ok).toBe(false);
    expect(result.mismatches.join("\n")).toMatch(/MiberaCollection/);
  });

  it("fails when a MiberaLiquidBacking field_selection field is removed", () => {
    // Drop the first `- from` (LoanReceived needs transaction.from for loan user).
    const broken = beltText.replace("            - from\n", "");
    expect(broken).not.toBe(beltText);
    const result = verifyBeltConfig({
      beltConfigText: broken,
      monolithConfigText: monoText,
    });
    expect(result.ok).toBe(false);
    expect(result.mismatches.join("\n")).toMatch(/MiberaLiquidBacking/);
  });

  it("fails when a start_block is wrong", () => {
    const broken = beltText.replace("start_block: 3971122", "start_block: 9999999");
    expect(broken).not.toBe(beltText);
    const result = verifyBeltConfig({
      beltConfigText: broken,
      monolithConfigText: monoText,
    });
    expect(result.ok).toBe(false);
    expect(result.mismatches.join("\n")).toMatch(/start_block/);
  });

  it("fails when an address is wrong", () => {
    const broken = beltText.replace(
      "0xaa04F13994A7fCd86F3BbbF4054d239b88F2744d",
      "0xaa04F13994A7fCd86F3BbbF4054d239b88F2744e",
    );
    expect(broken).not.toBe(beltText);
    const result = verifyBeltConfig({
      beltConfigText: broken,
      monolithConfigText: monoText,
    });
    expect(result.ok).toBe(false);
    expect(result.mismatches.join("\n")).toMatch(/address/);
  });

  it("fails when a belt contract is missing entirely", () => {
    const result = verifyBeltConfig({
      beltConfigText: "name: empty\n",
      monolithConfigText: monoText,
    });
    expect(result.ok).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
  });

  it("extracts identical contract definitions from belt and monolith", () => {
    for (const name of BELT_CONTRACTS) {
      const beltDef = extractContractDefinition(beltText, name);
      const monoDef = extractContractDefinition(monoText, name);
      expect(beltDef, `${name} present in belt config`).not.toBeNull();
      expect(monoDef, `${name} present in monolith`).not.toBeNull();
      expect(beltDef).toBe(monoDef);
    }
  });

  it("extracts matching chain refs (address + start_block) for both contracts", () => {
    for (const name of BELT_CONTRACTS) {
      const beltRef = extractChainContractRef(beltText, BELT_CHAIN_ID, name);
      const monoRef = extractChainContractRef(monoText, BELT_CHAIN_ID, name);
      expect(beltRef).not.toBeNull();
      expect(monoRef).not.toBeNull();
      expect(beltRef).toEqual(monoRef);
    }
  });
});
