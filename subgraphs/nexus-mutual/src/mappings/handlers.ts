import {
  Address,
  BigDecimal,
  BigInt,
  ByteArray,
  crypto,
  ethereum,
} from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_TWO,
  INT_ZERO,
} from "../sdk/util/constants";

import { ContractUpgraded, NXMaster } from "../../generated/NXMaster/NXMaster";
import { CoverEdited } from "../../generated/NXMaster/Cover";
import { Pool } from "../../generated/NXMaster/Pool";
import { Cover as CoverTemplate } from "../../generated/templates";
import { _ERC20 } from "../../generated/NXMaster/_ERC20";
import { _Deployments, Token } from "../../generated/schema";
import { addToArrayAtIndex } from "../sdk/util/arrays";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    let returnPrice = BIGDECIMAL_ZERO;
    let tokenAddr = Address.fromBytes(token.id);

    if (
      tokenAddr ==
      Address.fromString("0xd7c49cee7e9188cca6ad8ff264c1da2e69d4cf3b")
    ) {
      tokenAddr = Address.fromString(
        "0x0d438f3b5175bebc262bf23753c1e53d03432bde"
      );
    }

    const customPrice = getUsdPricePerToken(tokenAddr);
    returnPrice = customPrice.usdPrice;
    return returnPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    let returnPrice = BIGDECIMAL_ZERO;
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    returnPrice = this.getTokenPrice(token);
    return returnPrice.times(_amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const erc20 = _ERC20.bind(address);
      name = erc20.name();
      symbol = erc20.symbol();
      decimals = erc20.decimals().toI32();
    }
    return new TokenParams(name, symbol, decimals);
  }
}

const TREASURY = "0x586b9b2f8010b284a0197f392156f1a7eb5e86e9";

export function handleContractUpgraded(event: ContractUpgraded): void {
  const id = event.params.code.toHexString();
  let deployment = _Deployments.load(id);
  if (!deployment) {
    deployment = new _Deployments(id);
    deployment.allAddr = [];
  }
  deployment.addr = event.params.newAddress.toHexString();
  deployment.allAddr = addToArrayAtIndex(deployment.allAddr, deployment.addr);

  const contract = NXMaster.bind(event.address);
  const proxy = contract.getLatestAddress(event.params.code);

  deployment.proxy = proxy.toHexString();
  deployment.save();

  if (event.params.code.toHexString() == "0x434f") {
    CoverTemplate.create(proxy);
  }
}

export function handleCoverEdited(event: CoverEdited): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  let balance = BIGINT_ZERO;
  const poolDeployment = _Deployments.load("0x5031");
  if (poolDeployment) {
    const poolContract = Pool.bind(Address.fromString(poolDeployment.addr));
    balance = poolContract.getPoolValueInEth();
    pool.setInputTokenBalances([balance], true);
  }

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();

  const receipt = event.receipt;
  if (!receipt) return;
  const logs = event.receipt!.logs;
  if (!logs) return;

  const transfer_signature = crypto.keccak256(
    ByteArray.fromUTF8("Transfer(address,address,uint256)")
  );
  const safe_signature = crypto.keccak256(
    ByteArray.fromUTF8("SafeReceived(address,uint256)")
  );

  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs.at(i);
    const topic_signature = thisLog.topics.at(INT_ZERO);

    if (topic_signature.equals(transfer_signature)) {
      const topic_target = ethereum
        .decode("address", thisLog.topics.at(INT_TWO))!
        .toAddress();
      if (topic_target.equals(Address.fromString(TREASURY))) {
        const feeToken = sdk.Tokens.getOrCreateToken(thisLog.address);
        const value = ethereum.decode("uint256", thisLog.data)!.toBigInt();
        pool.addRevenueNative(feeToken, BIGINT_ZERO, value);
      }
    }

    if (topic_signature.equals(safe_signature)) {
      const topic_target = thisLog.address;
      if (topic_target.equals(Address.fromString(TREASURY))) {
        const value = ethereum.decode("uint256", thisLog.data)!.toBigInt();
        pool.addRevenueNative(token, BIGINT_ZERO, value);
      }
    }
  }
}
