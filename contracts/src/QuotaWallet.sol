// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {HegotaSupport, Devnet, Scope, SigParam} from "@forshtat/hegota-support/contracts/HegotaSupport.sol";

interface IQuotaLedger {
    function remaining(address entity) external view returns (uint128);
    function recordSpend(address entity, uint128 amount) external;
}

/// @title QuotaWallet — Frame VERIFY enforces a daily spend quota via foreign storage
/// @notice Empty calldata = clean path (stake / setup). Non-empty calldata = quota path:
///         reads `QuotaLedger.remaining(this)` (foreign SLOAD) then requires headroom.
///         Canonical public mempool rejects the foreign read; staked alt can admit.
contract QuotaWallet is HegotaSupport(Devnet.ERC8421_WORKSHOP) {
    address public immutable owner;
    IQuotaLedger public immutable ledger;

    error BadSigner();
    error OverQuota(uint128 remaining, uint128 requested);

    constructor(address owner_, address ledger_) payable {
        owner = owner_;
        ledger = IQuotaLedger(ledger_);
    }

    fallback() external payable {
        if (address(uint160(sigparam(0, SigParam.RESOLVED_SIGNER))) != owner) {
            revert BadSigner();
        }

        if (msg.data.length > 0) {
            // Decode requested spend from VERIFY data (uint128 big-endian in first 16 bytes,
            // or treat any non-empty data as a 1-wei probe when shorter).
            uint128 requested = 1;
            if (msg.data.length >= 16) {
                requested = uint128(bytes16(msg.data[0:16]));
            }
            // Foreign storage read — FrameCap's differentiator vs the canonical mempool.
            // Spend is recorded in a later SENDER frame (validation state does not persist).
            uint128 left = ledger.remaining(address(this));
            if (requested > left) revert OverQuota(left, requested);
        }

        approve(Scope.EXECUTION_AND_PAYMENT);
    }

    // Intentionally no `receive()`: empty VERIFY calldata must hit `fallback`
    // so APPROVE runs (same pattern as workshop ViolatingWallet).
}
