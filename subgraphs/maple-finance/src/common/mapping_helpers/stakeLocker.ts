import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { _StakeLocker } from "../../../generated/schema";
import { MAPLE_POOL_LIB_ADDRESS, ZERO_ADDRESS, ZERO_BD, ZERO_BI } from "../constants";
import { PoolLib } from "../../../generated/templates/Pool/PoolLib";

import { getOrCreateMarket } from "./market";
import { getOrCreateToken } from "./token";
import { parseUnits } from "../utils";

/**
 * Get the stake locker with stakeLockerAddress, or create it if it doesn't exist
 * @param stakeLockerAddress address of the stake locker
 * @param marketAddress address of the market this belong to, only needed on creation
 * @param stakeTokenAddress address of the stake token this market has, only needed on creation
 * @returns
 */
export function getOrCreateStakeLocker(
    stakeLockerAddress: Address,
    marketAddress: Address = ZERO_ADDRESS,
    stakeTokenAddress: Address = ZERO_ADDRESS,
    creationBlock: BigInt = ZERO_BI
): _StakeLocker {
    let stakeLocker = _StakeLocker.load(stakeLockerAddress.toHexString());

    if (!stakeLocker) {
        stakeLocker = new _StakeLocker(stakeLockerAddress.toHexString());

        stakeLocker.market = marketAddress.toHexString();
        stakeLocker.stakeToken = stakeTokenAddress.toHexString();
        stakeLocker.stakeTokenBalance = ZERO_BI;
        stakeLocker.stakeTokenBalanceInPoolInputTokens = ZERO_BI;
        stakeLocker.stakeTokenPriceUSD = ZERO_BD;
        stakeLocker.priceLastUpdatedBlock = ZERO_BI;
        stakeLocker.cumulativeStakeDefault = ZERO_BI;
        stakeLocker.cumulativeStakeDefaultInPoolInputTokens = ZERO_BI;
        stakeLocker.revenueInPoolInputTokens = ZERO_BI;
        stakeLocker.revenueUSD = ZERO_BD;
        stakeLocker.creationBlock = creationBlock;
        stakeLocker.lastUpdatedBlock = creationBlock;

        if (ZERO_ADDRESS == marketAddress || ZERO_ADDRESS == stakeTokenAddress || ZERO_BI == creationBlock) {
            log.error(
                "Created stake locker with invalid params: marketAddress={}, stakeTokenAddress={}, creationBlock={}",
                [marketAddress.toHexString(), stakeTokenAddress.toHexString(), creationBlock.toString()]
            );
        }
    }

    stakeLocker.save();
    return stakeLocker;
}

/**
 * Function which should get called on every update of the market this belongs to
 * Note: this should be called after the market has updated inputTokenPriceUSD
 */
export function stakeLockerTick(stakeLocker: _StakeLocker, event: ethereum.Event): void {
    // Update only if it hasn't been updated this block
    if (stakeLocker.lastUpdatedBlock != event.block.number) {
        const market = getOrCreateMarket(Address.fromString(stakeLocker.market));
        const marketInputToken = getOrCreateToken(Address.fromString(market.inputToken));

        const poolLibContract = PoolLib.bind(MAPLE_POOL_LIB_ADDRESS);
        const swapOutValueCall = poolLibContract.try_getSwapOutValueLocker(
            Address.fromString(stakeLocker.stakeToken),
            Address.fromString(market.inputToken),
            Address.fromString(stakeLocker.id)
        );

        if (swapOutValueCall.reverted) {
            log.error("swapOutValueCall({}, {}, {}) reverted", [
                stakeLocker.stakeToken,
                market.inputToken,
                stakeLocker.id
            ]);
        } else {
            stakeLocker.cumulativeStakeDefaultInPoolInputTokens = swapOutValueCall.value;
        }

        if (stakeLocker.stakeTokenBalance.notEqual(ZERO_BI)) {
            stakeLocker.stakeTokenPriceUSD = stakeLocker.stakeTokenBalanceInPoolInputTokens
                .toBigDecimal()
                .times(market.inputTokenPriceUSD)
                .div(stakeLocker.stakeTokenBalance.toBigDecimal());
        }

        stakeLocker.revenueUSD = parseUnits(stakeLocker.revenueInPoolInputTokens, marketInputToken.decimals).times(
            market.inputTokenPriceUSD
        );

        stakeLocker.lastUpdatedBlock = event.block.number;
        stakeLocker.save();
    }
}
