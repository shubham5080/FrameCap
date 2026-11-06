// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {HegotaSupport, Devnet, Scope, SigParam} from "@forshtat/hegota-support/contracts/HegotaSupport.sol";

interface IQuotaLedger {
    function remaining(address entity) external view returns (uint128);
    function recordSpend(address entity, uint128 amount) external;
    function isDestinationAllowed(address entity, address dest) external view returns (bool);
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
    error DestNotAllowed(address dest);

    constructor(address owner_, address ledger_) payable {
        owner = owner_;
        ledger = IQuotaLedger(ledger_);
    }

    fallback() external payable {
        if (address(uint160(sigparam(0, SigParam.RESOLVED_SIGNER))) != owner) {
            revert BadSigner();
        }

        if (msg.data.length > 0) {
            // VERIFY data layouts:
            // - 36+ bytes: dest (20) || amount (16) — quota + allowlist check
            // - 16+ bytes: amount only (legacy Diff probes)
            // - shorter: 1-wei probe
            uint128 requested = 1;
            address dest = address(0);
            if (msg.data.length >= 36) {
                dest = address(bytes20(msg.data[0:20]));
                requested = uint128(bytes16(msg.data[20:36]));
            } else if (msg.data.length >= 16) {
                requested = uint128(bytes16(msg.data[0:16]));
            }
            // Foreign storage reads — FrameCap's differentiator vs the canonical mempool.
            if (dest != address(0) && !ledger.isDestinationAllowed(address(this), dest)) {
                revert DestNotAllowed(dest);
            }
            uint128 left = ledger.remaining(address(this));
            if (requested > left) revert OverQuota(left, requested);
        }

        approve(Scope.EXECUTION_AND_PAYMENT);
    }

    // Intentionally no `receive()`: empty VERIFY calldata must hit `fallback`
    // so APPROVE runs (same pattern as workshop ViolatingWallet).
}
