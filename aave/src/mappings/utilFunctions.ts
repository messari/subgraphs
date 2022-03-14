import {
    Address,
    BigDecimal,
    BigInt,
    dataSource,
    ethereum
} from "@graphprotocol/graph-ts";
  
import {
    Token,
    Market,
    RewardToken
} from "../../generated/schema";
  
import { IERC20 } from "../../generated/templates/LendingPool/IERC20";

export const zeroAddr = "0x0000000000000000000000000000000000000000";

export function createMarket(
    event: ethereum.Event,
    id: string,
    protocolName: string,
    inputTokens: Token[],
    outputToken: Token,
    rewardTokens: Token[]
  ): Market {
    // Check if a Market entity implementation has already been created with the provided lending pool address/id
    let market = Market.load(id);
    if (market === null) {
        // If the market entity has not been created yet, create the instance
        // Populate fields with data that has been passed to the function
        // Other data fields are initialized as 0/[]/false
        let inputTokenBalances: BigDecimal[] = [];
        for (let i = 0; i < inputTokens.length; i++) {
            inputTokenBalances.push(new BigDecimal(new BigInt(0)));
        }
    
        market = new Market(id);
        market.protocol = protocolName;
        market.inputTokens = inputTokens.map<string>((t) => t.id);
        market.outputToken = outputToken.id;
        market.rewardTokens = rewardTokens.map<string>((t) => t.id);
        market.inputTokenBalances = inputTokenBalances;
        market.outputTokenSupply = new BigDecimal(new BigInt(0));
        market.outputTokenPriceUSD = new BigDecimal(new BigInt(0));
        market.createdBlockNumber = event.block.number;
        market.createdTimestamp = event.block.timestamp;
        market.snapshots = [];
        market.name = "";
        market.isActive = false;
        market.canBorrowFrom = false;
        market.canUseAsCollateral = false;
        market.maximumLTV = new BigDecimal(BigInt.fromI32(0));
        market.liquidationPenalty = new BigDecimal(BigInt.fromI32(0));
        market.liquidationThreshold = new BigDecimal(BigInt.fromI32(0));
        market.depositRate = new BigDecimal(BigInt.fromI32(0));
        market.stableBorrowRate = new BigDecimal(BigInt.fromI32(0));
        market.variableBorrowRate = new BigDecimal(BigInt.fromI32(0));
        market.totalValueLockedUSD = new BigDecimal(BigInt.fromI32(0));
        market.totalVolumeUSD = new BigDecimal(BigInt.fromI32(0));
        market.deposits = [];
        market.withdraws = [];
        market.borrows = [];
        market.repays = [];
        market.liquidations = [];
        market.save();
    }
    return market as Market;
  }

  export function initToken(assetAddr: Address): Token {
    // In the schema Token and RewardToken entities, the id is said to be " Smart contract address of the market ". 
    // How would this work if there are multiple tokens that make up part of a market? ie a token being an input token and the corresponding aToken being the output token
    // For now, the token id is set as the asset address

    // Check if a token entity implementation has already been created with the provided asset address
    let asset = Token.load(assetAddr.toHex());
    if (asset === null) {
      // Create a new Token implementation
      asset = new Token(assetAddr.toHex());
      // Instantiate the Token with the IERC20 interface in order to access contract read methods
      let tokenInstance = IERC20.bind(assetAddr);
      // Attempt to pull the token name from the contract
      let name = tokenInstance.try_name();
      if (!name.reverted) {
          asset.name = name.value;
      }
      // Attempt to pull the token symbol from the contract
      let symbol = tokenInstance.try_symbol();
      if (!symbol.reverted) {
          asset.symbol = symbol.value;
      }
      // Attempt to pull the token decimals from the contract
      let decimals = tokenInstance.try_decimals();
      if (!decimals.reverted) {
          asset.decimals = decimals.value;
      }
      asset.save();
    }
    return asset as Token;
}


// WILL COMBINE THIS WITH THE initToken FUNCTION INTO ONE DUAL-PURPOSE FUNCTION
// HOW WOULD ONE GET THE TOKEN TYPE(DEPOSIT/BORROW)? SEE aToken.ts
export function initRewardToken(assetAddr: Address): RewardToken {
    // See initToken() function above
    let asset = RewardToken.load(assetAddr.toHex());
    if (asset === null) {
      asset = new RewardToken(assetAddr.toHex());
      let tokenInstance = IERC20.bind(assetAddr);
      let name = tokenInstance.try_name();
      if (!name.reverted) {
          asset.name = name.value;
      }
      let symbol = tokenInstance.try_symbol();
      if (!symbol.reverted) {
          asset.symbol = symbol.value;
      }
      let decimals = tokenInstance.try_decimals();
      if (!decimals.reverted) {
          asset.decimals = decimals.value;
      }
      let type = "DEPOSIT"
      asset.type = type;
      asset.save();
    }
    return asset as RewardToken;
}

export function getLendingPoolFromCtx(): string {
    // Get the lending pool/market address with context
    // Need to verify that context is available here, not just the lendingPoolConfigurator.ts script
    let context = dataSource.context();
    return context.getString("lendingPool");
}

// Conversion function for RAY units

export function rayDivision(a: BigInt, b: BigInt): BigInt {
  let halfB = b.div(BigInt.fromI32(2));
  let result = a.times(BigInt.fromI32(10).pow(27));
  result = result.plus(halfB);
  let division = result.div(b);
  return division;
}

export function rayMultiplication(a: BigInt, b: BigInt): BigInt {
  let result = a.times(b);
  result = result.plus((BigInt.fromI32(10).pow(27)).div(BigInt.fromI32(2)));
  let mult = result.div(BigInt.fromI32(10).pow(27));
  return mult;
}

