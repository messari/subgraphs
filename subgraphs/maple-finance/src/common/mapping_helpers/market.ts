import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Market, _PoolFactory, _StakeLocker } from "../../../generated/schema";
import { PROTOCOL_ID, UNPROVIDED_NAME, ZERO_ADDRESS, ZERO_BD, ZERO_BI } from "../constants";

/**
 * Get the market at marketAddress, or create it if it doesn't exist
 * Only marketAddresss is required for get, everything should be set for create
 */
export function getOrCreateMarket(
    marketAddress: Address,
    marketName: string = UNPROVIDED_NAME,
    poolFactoryAddress: Address = ZERO_ADDRESS,
    delegateAddress: Address = ZERO_ADDRESS,
    stakeLockerAddress: Address = ZERO_ADDRESS,
    inputTokenAddress: Address = ZERO_ADDRESS,
    outputTokenAddress: Address = ZERO_ADDRESS,
    creationTimestamp: BigInt = ZERO_BI,
    creationBlockNumber: BigInt = ZERO_BI
): Market {
    let market = Market.load(marketAddress.toHexString());

    if (!market) {
        market = new Market(marketAddress.toHexString());

        market.protocol = PROTOCOL_ID;
        market.name = marketName;
        market.isActive = false;
        market.canUseAsCollateral = false;
        market.canBorrowFrom = false;
        market.maximumLTV = ZERO_BD;
        market.liquidationThreshold = ZERO_BD;
        market.liquidationPenalty = ZERO_BD;
        market.inputToken = inputTokenAddress.toHexString();
        market.outputToken = outputTokenAddress.toHexString();
        market.rewardTokens = [];
        market.rates = [];
        market.totalValueLockedUSD = ZERO_BD;
        market.totalDepositBalanceUSD = ZERO_BD;
        market.cumulativeDepositUSD = ZERO_BD;
        market.totalBorrowBalanceUSD = ZERO_BD;
        market.cumulativeBorrowUSD = ZERO_BD;
        market.cumulativeLiquidateUSD = ZERO_BD;
        market.inputTokenBalance = ZERO_BI;
        market.inputTokenPriceUSD = ZERO_BD;
        market.outputTokenSupply = ZERO_BI;
        market.outputTokenPriceUSD = ZERO_BD;
        market.exchangeRate = ZERO_BD;
        market.rewardTokenEmissionsAmount = [];
        market.rewardTokenEmissionsUSD = [];
        market.createdTimestamp = creationTimestamp;
        market.createdBlockNumber = creationBlockNumber;
        market._poolFactory = poolFactoryAddress.toHexString();
        market._delegateAddress = delegateAddress.toHexString();
        market._stakeLocker = stakeLockerAddress.toHexString();
        market._cumulativeDeposit = ZERO_BI;
        market._totalBorrowBalance = ZERO_BI;
        market._cumulativeBorrow = ZERO_BI;
        market._cumulativePoolDefault = ZERO_BI;
        market._cumulativeCollatoralLiquidationInPoolInputTokens = ZERO_BI;
        market._poolDelegateRevenue = ZERO_BI;
        market._poolDelegateRevenueUSD = ZERO_BD;
        market._treasuryRevenue = ZERO_BI;
        market._treasuryRevenueUSD = ZERO_BD;
        market._supplierRevenue = ZERO_BI;
        market._supplierRevenueUSD = ZERO_BD;
        market._protocolSideRevenueUSD = ZERO_BD;
        market._totalRevenueUSD = ZERO_BD;

        // No maple rewards pools to begin with, they get added on MplRewards.sol->MplRewardsCreated
        market._mplRewardsMplLp = null;
        market._mplRewardsMplStake = null;

        if (
            UNPROVIDED_NAME == marketName ||
            ZERO_ADDRESS == poolFactoryAddress ||
            ZERO_ADDRESS == delegateAddress ||
            ZERO_ADDRESS == stakeLockerAddress ||
            ZERO_ADDRESS == inputTokenAddress ||
            ZERO_ADDRESS == outputTokenAddress ||
            ZERO_BI == creationTimestamp ||
            ZERO_BI == creationBlockNumber
        ) {
            log.error(
                "Created market invalid params: marketName={}, poolFactoryAddress={}, delegateAddress={}, stakeLockerAddress={}, inputTokenAddress={}, outputTokenAddress={}, creationTimestamp={}, creationBlockNumber={{",
                [
                    marketName,
                    poolFactoryAddress.toHexString(),
                    delegateAddress.toHexString(),
                    stakeLockerAddress.toHexString(),
                    inputTokenAddress.toHexString(),
                    outputTokenAddress.toHexString(),
                    creationTimestamp.toString(),
                    creationBlockNumber.toString()
                ]
            );
        }
    }

    market.save();
    return market;
}
