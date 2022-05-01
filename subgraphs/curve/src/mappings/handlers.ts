import { log } from "@graphprotocol/graph-ts";
import { createDeposit, createWithdraw, createSwapHandleVolumeAndFees, createLiquidityPool } from "./helpers";
import { updateFinancials, updateUsageMetrics, updatePoolMetrics } from "../common/metrics";
import { getOrCreateDexAmm } from "../common/getters";
import { getRewardsPerDay, RewardIntervalType } from "../common/rewards";
import { AddressModified, NewAddressIdentifier } from "../../generated/AddressProvider/AddressProvider";
// To improve readability and consistency, it is recommended that you put all
// handlers in this file, and create helper functions to handle specific events

export function handleAddressModified(event: AddressModified): void {}

export function handleNewAddressIdentifier(event: NewAddressIdentifier): void {}
