import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { Erc20 as ERC20Contract } from "../../generated/Manager/Erc20"
import { Token, YieldAggregator } from "../../generated/schema"
import { BIGINT_ZERO, DEFAULT_DECIMALS, ETH_MAINNET_USDC_ORACLE_ADDRESS, Network, ProtocolType, PROTOCOL_ID, USDC_DENOMINATOR } from "../common/constants"
import { Oracle as OracleContract } from "../../generated/templates/Vault/Oracle"

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
        protocol.name = "Tokemak"
        protocol.slug = "tokemak"
        protocol.network = Network.ETHEREUM
        protocol.type = ProtocolType.YIELD
        protocol.vaults = []
        protocol.save()
    }
}

function getOracleCalculator(): OracleContract {
    return OracleContract.bind(Address.fromString(ETH_MAINNET_USDC_ORACLE_ADDRESS));
}

export function normalizedUsdcPrice(usdcPrice: BigInt): BigDecimal {
    return usdcPrice.toBigDecimal().div(USDC_DENOMINATOR)
}

function getTokenPriceFromOracle(
    tokenAddress: Address,
    tokenAmount: BigInt
): BigInt {
    let calculator = getOracleCalculator()
    if (calculator !== null) {
        let result = calculator.try_getNormalizedValueUsdc(
            tokenAddress,
            tokenAmount
        )

        if (result.reverted === false) {
            return result.value
        }
    }
    return BIGINT_ZERO
}

export function usdcPrice(token: Token, tokenAmount: BigInt): BigInt {
    let tokenAddress = Address.fromString(token.id)
    let decimals = BigInt.fromI32(token.decimals)
    let oracleCalculatorPrice = getTokenPriceFromOracle(
        tokenAddress,
        tokenAmount
    )
    if (oracleCalculatorPrice.notEqual(BIGINT_ZERO)) {
        return oracleCalculatorPrice
    }
    return BIGINT_ZERO
}
