// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title QuotaLedger — per-entity spend caps (daily / weekly / monthly)
/// @notice Storage lives here (not on the wallet). A VERIFY frame that reads
///         `remaining` therefore touches foreign storage → canonical mempool
///         rejects; a staked alt mempool can admit.
/// @dev `remaining` must not use TIMESTAMP/NUMBER/… — those opcodes are banned
///      in the validation prefix (BannedOpcode). Period rolling happens only in
///      mutating calls that run outside VERIFY.
contract QuotaLedger {
    struct Quota {
        uint128 dailyLimitWei;
        uint128 spentWei; // spent today
        uint64 dayId; // UTC day = block.timestamp / 1 days
        uint128 weeklyLimitWei; // 0 = disabled
        uint128 weeklySpentWei;
        uint64 weekId; // block.timestamp / 7 days
        uint128 monthlyLimitWei; // 0 = disabled
        uint128 monthlySpentWei;
        uint64 monthId; // block.timestamp / 30 days (simple calendar)
    }

    mapping(address entity => Quota) public quotas;
    /// @dev Optional destination allowlist. If count is 0, all destinations are open.
    mapping(address entity => mapping(address dest => bool)) public allowedDest;
    mapping(address entity => uint256) public allowlistCount;

    event QuotaSet(address indexed entity, uint128 dailyLimitWei);
    event WeeklyQuotaSet(address indexed entity, uint128 weeklyLimitWei);
    event MonthlyQuotaSet(address indexed entity, uint128 monthlyLimitWei);
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
        q.spentWei = 0;
        emit QuotaSet(entity, dailyLimitWei);
    }

    /// @notice 0 disables the weekly cap.
    function setWeeklyLimit(address entity, uint128 weeklyLimitWei) external {
        Quota storage q = quotas[entity];
        _roll(q);
        q.weeklyLimitWei = weeklyLimitWei;
        q.weeklySpentWei = 0;
        emit WeeklyQuotaSet(entity, weeklyLimitWei);
    }

    /// @notice 0 disables the monthly cap.
    function setMonthlyLimit(address entity, uint128 monthlyLimitWei) external {
        Quota storage q = quotas[entity];
        _roll(q);
        q.monthlyLimitWei = monthlyLimitWei;
        q.monthlySpentWei = 0;
        emit MonthlyQuotaSet(entity, monthlyLimitWei);
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

    /// @dev Tightest remaining across enabled periods. No environment opcodes.
    function remaining(address entity) external view returns (uint128) {
        Quota storage q = quotas[entity];
        uint128 left = type(uint128).max;

        if (q.dailyLimitWei > 0) {
            uint128 d = q.spentWei >= q.dailyLimitWei ? 0 : q.dailyLimitWei - q.spentWei;
            if (d < left) left = d;
        }
        if (q.weeklyLimitWei > 0) {
            uint128 w = q.weeklySpentWei >= q.weeklyLimitWei
                ? 0
                : q.weeklyLimitWei - q.weeklySpentWei;
            if (w < left) left = w;
        }
        if (q.monthlyLimitWei > 0) {
            uint128 m = q.monthlySpentWei >= q.monthlyLimitWei
                ? 0
                : q.monthlyLimitWei - q.monthlySpentWei;
            if (m < left) left = m;
        }

        // No limits configured → treat as empty budget for safety.
        if (left == type(uint128).max) return 0;
        return left;
    }

    function recordSpend(address entity, uint128 amount) external {
        Quota storage q = quotas[entity];
        _roll(q);
        uint128 left = _remainingFromStorage(q);
        if (amount > left) revert OverQuota(left, amount);
        if (q.dailyLimitWei > 0) q.spentWei += amount;
        if (q.weeklyLimitWei > 0) q.weeklySpentWei += amount;
        if (q.monthlyLimitWei > 0) q.monthlySpentWei += amount;
        emit SpendRecorded(entity, amount, q.spentWei, q.dayId);
    }

    function _remainingFromStorage(Quota storage q) internal view returns (uint128) {
        uint128 left = type(uint128).max;
        if (q.dailyLimitWei > 0) {
            uint128 d = q.spentWei >= q.dailyLimitWei ? 0 : q.dailyLimitWei - q.spentWei;
            if (d < left) left = d;
        }
        if (q.weeklyLimitWei > 0) {
            uint128 w = q.weeklySpentWei >= q.weeklyLimitWei
                ? 0
                : q.weeklyLimitWei - q.weeklySpentWei;
            if (w < left) left = w;
        }
        if (q.monthlyLimitWei > 0) {
            uint128 m = q.monthlySpentWei >= q.monthlyLimitWei
                ? 0
                : q.monthlyLimitWei - q.monthlySpentWei;
            if (m < left) left = m;
        }
        if (left == type(uint128).max) return 0;
        return left;
    }

    function _roll(Quota storage q) internal {
        uint64 today = uint64(block.timestamp / 1 days);
        if (q.dayId != today) {
            q.dayId = today;
            q.spentWei = 0;
        }
        uint64 week = uint64(block.timestamp / 7 days);
        if (q.weekId != week) {
            q.weekId = week;
            q.weeklySpentWei = 0;
        }
        uint64 month = uint64(block.timestamp / 30 days);
        if (q.monthId != month) {
            q.monthId = month;
            q.monthlySpentWei = 0;
        }
    }
}
