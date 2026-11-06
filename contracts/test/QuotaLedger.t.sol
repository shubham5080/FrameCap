// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {QuotaLedger} from "../src/QuotaLedger.sol";

contract QuotaLedgerTest is Test {
    QuotaLedger ledger;
    address entity = address(0xBEEF);

    function setUp() public {
        ledger = new QuotaLedger();
    }

    function test_setAndRemaining() public {
        ledger.setDailyLimit(entity, 1 ether);
        assertEq(ledger.remaining(entity), 1 ether);
    }

    function test_recordSpendAndOverQuota() public {
        ledger.setDailyLimit(entity, 100);
        ledger.recordSpend(entity, 40);
        assertEq(ledger.remaining(entity), 60);
        vm.expectRevert();
        ledger.recordSpend(entity, 61);
    }

    function test_dayRollOnWrite() public {
        ledger.setDailyLimit(entity, 100);
        ledger.recordSpend(entity, 100);
        assertEq(ledger.remaining(entity), 0);
        vm.warp(block.timestamp + 1 days + 1);
        // remaining() does not touch TIMESTAMP; roll happens on the next write.
        assertEq(ledger.remaining(entity), 0);
        ledger.recordSpend(entity, 1); // _roll clears spend, then records 1
        assertEq(ledger.remaining(entity), 99);
    }

    function test_destinationAllowlist() public {
        address okDest = address(0xA11);
        address badDest = address(0xBAD);
        // Empty allowlist → all destinations open
        assertTrue(ledger.isDestinationAllowed(entity, badDest));
        ledger.setDestination(entity, okDest, true);
        assertTrue(ledger.isDestinationAllowed(entity, okDest));
        assertFalse(ledger.isDestinationAllowed(entity, badDest));
        ledger.setDestination(entity, okDest, false);
        assertTrue(ledger.isDestinationAllowed(entity, badDest));
    }
}
