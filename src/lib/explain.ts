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
