// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title QuotaLedger — per-entity spend caps
/// @notice Storage lives here (not on the wallet). A VERIFY frame that reads
///         `remaining` therefore touches foreign storage → canonical mempool
///         rejects; a staked alt mempool can admit.
/// @dev `remaining` must not use TIMESTAMP/NUMBER/… — those opcodes are banned
///      in the validation prefix (BannedOpcode). Day rolling happens only in
///      mutating calls that run outside VERIFY.
contract QuotaLedger {
    struct Quota {
        uint128 dailyLimitWei;
        uint128 spentWei;
        uint64 dayId; // UTC day = block.timestamp / 1 days (updated on writes)
    }

    mapping(address entity => Quota) public quotas;
    /// @dev Optional destination allowlist. If count is 0, all destinations are open.
    mapping(address entity => mapping(address dest => bool)) public allowedDest;
    mapping(address entity => uint256) public allowlistCount;

    event QuotaSet(address indexed entity, uint128 dailyLimitWei);
    event SpendRecorded(address indexed entity, uint128 amount, uint128 spentWei, uint64 dayId);
    event DestinationSet(address indexed entity, address indexed dest, bool allowed);

    error LimitZero();
    error OverQuota(uint128 remaining, uint128 requested);
    error ZeroDestination();

    function setDailyLimit(address entity, uint128 dailyLimitWei) external {
        if (dailyLimitWei == 0) revert LimitZero();
        Quota storage q = quotas[entity];
        _roll(q);
        q.dailyLimitWei = dailyLimitWei;
        // Fresh limit: clear spend so the demo starts with a full budget.
        q.spentWei = 0;
        emit QuotaSet(entity, dailyLimitWei);
    }

    function setDestination(address entity, address dest, bool allowed) external {
        if (dest == address(0)) revert ZeroDestination();
        bool prev = allowedDest[entity][dest];
        if (prev == allowed) return;
        allowedDest[entity][dest] = allowed;
        if (allowed) allowlistCount[entity] += 1;
        else allowlistCount[entity] -= 1;
        emit DestinationSet(entity, dest, allowed);
    }

    /// @dev Pure storage reads — safe for VERIFY. Empty allowlist = all dests open.
    function isDestinationAllowed(address entity, address dest) external view returns (bool) {
        if (allowlistCount[entity] == 0) return true;
        return allowedDest[entity][dest];
    }

    /// @dev Pure storage math — no environment opcodes. Must return the value
    ///      so the optimizer cannot delete the SLOAD (otherwise VERIFY would
    ///      not actually violate the foreign-storage rule).
    function remaining(address entity) external view returns (uint128) {
        Quota storage q = quotas[entity];
        if (q.spentWei >= q.dailyLimitWei) return 0;
        return q.dailyLimitWei - q.spentWei;
    }

    function recordSpend(address entity, uint128 amount) external {
        Quota storage q = quotas[entity];
        _roll(q);
        uint128 left = q.dailyLimitWei > q.spentWei ? q.dailyLimitWei - q.spentWei : 0;
        if (amount > left) revert OverQuota(left, amount);
        q.spentWei += amount;
        emit SpendRecorded(entity, amount, q.spentWei, q.dayId);
    }

    function _roll(Quota storage q) internal {
        uint64 today = uint64(block.timestamp / 1 days);
        if (q.dayId != today) {
            q.dayId = today;
            q.spentWei = 0;
        }
    }
}
