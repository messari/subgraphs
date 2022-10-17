import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { YieldAggregator } from '../../generated/schema';
import { YakStrategyV2 } from '../../generated/YakStrategyV2/YakStrategyV2';
import { DEFUALT_AMOUNT, DEFUALT_DECIMALS, YAK_STRATEGY_MANAGER_ADDRESS, ZERO_ADDRESS, ZERO_BIGDECIMAL } from './constants';
import { Token } from '../../generated/schema';
import { WAVAX_CONTRACT_ADDRESS } from './constants';
import { YakERC20 } from '../../generated/YakERC20/YakERC20';
import { calculatePriceInUSD } from '../helpers/calculators';

export function defineProtocol(contractAddress: Address): YieldAggregator {
    let dexStrategyV4Contract = YakStrategyV2.bind(contractAddress);
    let ownerAddress: Address;
    if (dexStrategyV4Contract.try_owner().reverted) {
      ownerAddress = YAK_STRATEGY_MANAGER_ADDRESS;
    } else {
      ownerAddress = dexStrategyV4Contract.owner();
    }
    let protocol = YieldAggregator.load(ownerAddress.toHexString());
    if (protocol == null) {
      protocol = new YieldAggregator(ownerAddress.toHexString());
      protocol.name = "Yield Yak";
      protocol.slug = "yak";
      protocol.schemaVersion = "1.2.0";
      protocol.subgraphVersion = "1.0.0";
      protocol.methodologyVersion = "1.0.0";
      protocol.network = "AVALANCHE";
      protocol.type = "YIELD";
      protocol.protocolControlledValueUSD = ZERO_BIGDECIMAL;
    }
    protocol.save();
    return protocol;
}

export function defineInputToken(tokenAddress: Address, blockNumber: BigInt): Token {
  if (tokenAddress == ZERO_ADDRESS) {
    tokenAddress = WAVAX_CONTRACT_ADDRESS;
  }

  let tokenContract = YakERC20.bind(tokenAddress);
  let token = Token.load(tokenAddress.toHexString());
  if (token == null) {
    token = new Token(tokenAddress.toHexString());
    if (tokenContract.try_name().reverted) {
      token.name = "";
    } else {
      token.name = tokenContract.name();
    }
    if (tokenContract.try_symbol().reverted) {
      token.symbol = "";
    } else {
      token.symbol = tokenContract.symbol();
    }
    if (tokenContract.try_decimals().reverted) {
      token.decimals = DEFUALT_DECIMALS.toI32();
    } else {
      token.decimals = tokenContract.decimals();
    }
  }
  token.lastPriceUSD = calculatePriceInUSD(tokenAddress, DEFUALT_AMOUNT);
  token.lastPriceBlockNumber = blockNumber;

  token.save();

  return token;
}