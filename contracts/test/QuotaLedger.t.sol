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
        assertEq(ledger.remaining(entity), 0);
        ledger.recordSpend(entity, 1);
        assertEq(ledger.remaining(entity), 99);
    }

    function test_destinationAllowlist() public {
        address okDest = address(0xA11);
        address badDest = address(0xBAD);
        assertTrue(ledger.isDestinationAllowed(entity, badDest));
        ledger.setDestination(entity, okDest, true);
        assertTrue(ledger.isDestinationAllowed(entity, okDest));
        assertFalse(ledger.isDestinationAllowed(entity, badDest));
        ledger.setDestination(entity, okDest, false);
        assertTrue(ledger.isDestinationAllowed(entity, badDest));
    }

    function test_weeklyAndMonthlyTightenRemaining() public {
        ledger.setDailyLimit(entity, 100);
        ledger.setWeeklyLimit(entity, 50);
        ledger.setMonthlyLimit(entity, 80);
        // Tightest is weekly 50
        assertEq(ledger.remaining(entity), 50);
        ledger.recordSpend(entity, 40);
        assertEq(ledger.remaining(entity), 10);
        vm.expectRevert();
        ledger.recordSpend(entity, 11);
    }

    function test_weeklyRoll() public {
        ledger.setDailyLimit(entity, 1000);
        ledger.setWeeklyLimit(entity, 100);
        ledger.recordSpend(entity, 100);
        assertEq(ledger.remaining(entity), 0);
        vm.warp(block.timestamp + 7 days + 1);
        ledger.recordSpend(entity, 1); // rolls week + day
        assertEq(ledger.remaining(entity), 99);
    }
}
