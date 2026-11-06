import fs from "node:fs";
import path from "node:path";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getBalance } from "./chain";

const BANK_PATH = path.join(process.cwd(), ".data", "wallet-bank.json");

type BankFile = {
  keys: Hex[];
};

function readBank(): BankFile {
  try {
    if (!fs.existsSync(BANK_PATH)) return { keys: [] };
    const raw = JSON.parse(fs.readFileSync(BANK_PATH, "utf8")) as BankFile;
    return { keys: Array.isArray(raw.keys) ? raw.keys : [] };
  } catch {
    return { keys: [] };
  }
}

function writeBank(bank: BankFile) {
  fs.mkdirSync(path.dirname(BANK_PATH), { recursive: true });
  fs.writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2));
}

/** Remember a funded key so later Diff runs can reuse it if the faucet is dry. */
export function rememberFundedKey(privateKey: Hex) {
  const bank = readBank();
  if (!bank.keys.includes(privateKey)) {
    bank.keys.unshift(privateKey);
    bank.keys = bank.keys.slice(0, 8);
    writeBank(bank);
  }
}

/** Find a remembered key that still holds at least `minWei`. */
export async function findFundedKey(minWei: bigint): Promise<Hex | null> {
  const bank = readBank();
  for (const key of bank.keys) {
    try {
      const account = privateKeyToAccount(key);
      const bal = await getBalance(account.address);
      if (bal >= minWei) return key;
    } catch {
      // skip bad key
    }
  }
  return null;
}
