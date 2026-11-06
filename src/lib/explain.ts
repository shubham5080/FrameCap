/** Map Diff / gateway failures to plain-language copy. */
export function humanFailure(message: string | undefined): {
  title: string;
  detail: string;
} | null {
  const m = message ?? "";
  if (/faucet is empty|Faucet refused/i.test(m)) {
    return {
      title: "Test faucet is empty",
      detail:
        "The workshop faucet ran out of ETH, so a new demo wallet couldn’t be funded. Wait a bit, skip the optional test send, then Try again. For mentors, use the saved explorer proof links.",
    };
  }
  if (/rate limit|429/i.test(m)) {
    return {
      title: "Too many faucet requests",
      detail: "Wait a few minutes, then Try again once.",
    };
  }
  return null;
}

/** Map gateway / ethrex rejection text to judge-readable copy. */
export function humanRejection(message: string | undefined): {
  rule: string;
  title: string;
  detail: string;
} {
  const m = message ?? "";
  if (/StorageReadNonSender/i.test(m)) {
    return {
      rule: "STO",
      title: "Canonical rejects foreign storage",
      detail:
        "VERIFY read QuotaLedger (not the sender). Public Frame mempool forbids that.",
    };
  }
  if (/OverQuota|0xf11d2a44/i.test(m)) {
    return {
      rule: "QUOTA",
      title: "Over daily quota",
      detail: "Remaining budget is below the requested spend in VERIFY data.",
    };
  }
  if (/DestNotAllowed/i.test(m)) {
    return {
      rule: "ALLOW",
      title: "Destination not allowlisted",
      detail: "This wallet may only send to addresses on its allowlist.",
    };
  }
  if (/NotGuardian/i.test(m)) {
    return {
      rule: "GUARD",
      title: "Only the guardian can edit policy",
      detail:
        "Limits and allowlist changes must come from the guardian address, not the spender.",
    };
  }
  if (/BannedOpcode/i.test(m)) {
    return {
      rule: "OP-011",
      title: "Banned opcode in validation",
      detail: "Validation prefix cannot use TIMESTAMP/NUMBER/… environment ops.",
    };
  }
  if (/unstaked/i.test(m)) {
    return {
      rule: "STO",
      title: "Unstaked entity accessed foreign storage",
      detail: "Stake the wallet on the registry, then retry on alt.",
    };
  }
  if (/MAX_VERIFY_GAS/i.test(m)) {
    return {
      rule: "GAS",
      title: "VERIFY gas over budget",
      detail: "Devnet MAX_VERIFY_GAS is 100k including signature cost.",
    };
  }
  return {
    rule: "UNKNOWN",
    title: "Rejected",
    detail: m || "No error text from node.",
  };
}
