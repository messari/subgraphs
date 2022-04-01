import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Token, YieldAggregator, UsageMetricsDailySnapshot, FinancialsDailySnapshot } from "../../generated/schema"
import { ERC20 as ERC20Contract } from '../../generated/Controller/ERC20'
import { CalculationsCurve } from '../../generated/templates/Vault/CalculationsCurve'
import { CalculationsSushi } from '../../generated/templates/Vault/CalculationsSushi'
import { 
    PROTOCOL_ID, 
    Network, 
    ProtocolType, 
    DEFAULT_DECIMALS, 
    BIGINT_ZERO, 
    ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS, 
    ETH_MAINNET_CALCULATIONS_SUSHI_ADDRESS, 
    USDC_DENOMINATOR,
    SECONDS_PER_DAY,
    BIGDECIMAL_ZERO
} from "./constants"

export function getOrCreateToken(address: Address): Token {
    let id = address.toHexString();
    let token = Token.load(id);
    if (!token) {
      token = new Token(id);
      let erc20Contract = ERC20Contract.bind(address);

      let decimals = erc20Contract.try_decimals();
      token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;

      let name = erc20Contract.try_name();
      token.name = name.reverted ? '' : name.value;

      let symbol = erc20Contract.try_symbol();
      token.symbol = symbol.reverted ? '' : symbol.value;

      token.save();
    }

    return token as Token;
}

export function createProtocol(): void {
    let protocol = YieldAggregator.load(PROTOCOL_ID)
    if (!protocol) {
        protocol = new YieldAggregator(PROTOCOL_ID)
        protocol.name = "harvest"
        protocol.slug = "harvest"
        protocol.network = Network.ETHEREUM
        protocol.type = ProtocolType.YIELD
        protocol.vaults = []
        protocol.save()
    }
}

export function getUsdPriceOfToken(
    tokenAddress: Address
): BigDecimal {
    const curveContract = CalculationsCurve.bind(
        Address.fromString(ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS)
    )
    let tokenPrice = BIGINT_ZERO
    let try_isLpToken = curveContract.try_isCurveLpToken(tokenAddress)

    let isLpToken = try_isLpToken.reverted ? false : try_isLpToken.value

    if (isLpToken) {
        let try_tokenPrice = curveContract.try_getCurvePriceUsdc(tokenAddress)

        tokenPrice = try_tokenPrice.reverted
            ? BIGINT_ZERO
            : try_tokenPrice.value
    } else {
        const sushiContract = CalculationsSushi.bind(
            Address.fromString(ETH_MAINNET_CALCULATIONS_SUSHI_ADDRESS)
        )

        let try_getPriceUsdc = sushiContract.try_getPriceUsdc(tokenAddress)

        tokenPrice = try_getPriceUsdc.reverted
            ? BIGINT_ZERO
            : try_getPriceUsdc.value
    }

    return tokenPrice.toBigDecimal().div(USDC_DENOMINATOR.toBigDecimal())
}

export function getOrCreateUsageMetricSnapshot(blockTimestamp: BigInt): UsageMetricsDailySnapshot {
    let id: i64 = blockTimestamp.toI64() / SECONDS_PER_DAY;
  
    let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());
  
    if (!usageMetrics) {
      usageMetrics = new UsageMetricsDailySnapshot(id.toString());
      usageMetrics.protocol = PROTOCOL_ID;
  
      usageMetrics.activeUsers = 0;
      usageMetrics.totalUniqueUsers = 0;
      usageMetrics.dailyTransactionCount = 0;
      usageMetrics.save();
    }
  
    return usageMetrics;
}

export function getOrCreateFinancialSnapshots(
    financialSnapshotId: string
  ): FinancialsDailySnapshot {
    let financialMetrics = FinancialsDailySnapshot.load(financialSnapshotId);
  
    if (!financialMetrics) {
      financialMetrics = new FinancialsDailySnapshot(financialSnapshotId);
      financialMetrics.protocol = PROTOCOL_ID;
  
      financialMetrics.feesUSD = BIGDECIMAL_ZERO;
      financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
      financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
      financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
      financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    }
  
    return financialMetrics;
  }


