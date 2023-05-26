import {
  Address,
  BigDecimal,
  BigInt,
  ByteArray,
  Bytes,
  dataSource,
  log,
  crypto,
  ethereum,
} from "@graphprotocol/graph-ts";

import { BridgeConfig } from "../sdk/protocols/bridge/config";
import { NetworkConfigs } from "../../configurations/configure";

import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";

import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { TokenPricer } from "../sdk/protocols/config";
import { Token } from "../../generated/schema";
import { SDK } from "../sdk/protocols/bridge";
import { CustomEventType } from "../sdk/util/events";
import { Pool } from "../sdk/protocols/bridge/pool";
import { Versions } from "../versions";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { TokenInitializer, TokenParams } from "../sdk/protocols/bridge/tokens";
import { _ERC20 } from "../../generated/Vault/_ERC20";
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";
import { ERC20NameBytes } from "../../generated/Vault/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/Vault/ERC20SymbolBytes";
import { BIGINT_ZERO, getNetworkSpecificConstant } from "../sdk/util/constants";
import {
  Deposit, Withdraw
} from "../../generated/Vault/Vault";
import { Swap, SwapRequest} from "../../generated/Minter/Minter";
import { fetchTokenDecimals } from "../common/tokens";

const taxReceiver = "0xE9f3604B85c9672728eEecf689cf1F0cF7Dd03F2";

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    const decimalsResult = erc20.try_decimals();
    let decimals: i32 = 18;
    if (!decimalsResult.reverted) {
      decimals = decimalsResult.value.toI32();
    } else {
      log.warning(
        "[getTokenParams]token {} decimals() call reverted; default to 18 decimals",
        [address.toHexString()]
      );
    }

    let name = "Unknown Token";
    const nameResult = erc20.try_name();
    if (!nameResult.reverted) {
      name = nameResult.value;
    } else {
      const erc20name = ERC20NameBytes.bind(address);
      const nameResult = erc20name.try_name();
      if (!nameResult.reverted) {
        name = nameResult.value.toString();
      } else {
        log.warning(
          "[getTokenParams]Fail to get name for token {}; default to 'Unknown Token'",
          [address.toHexString()]
        );
      }
    }

    let symbol = "Unknown";
    const symbolResult = erc20.try_symbol();
    if (!symbolResult.reverted) {
      symbol = symbolResult.value;
    } else {
      const erc20symbol = ERC20SymbolBytes.bind(address);
      const symbolResult = erc20symbol.try_symbol();
      if (!symbolResult.reverted) {
        symbol = symbolResult.value.toString();
      } else {
        log.warning(
          "[getTokenParams]Fail to get symbol for token {}; default to 'Unknown'",
          [address.toHexString()]
        );
      }
    }

    return {
      name,
      symbol,
      decimals,
    };
  }
}

function _getSDK(
  event: ethereum.Event | null = null,
  call: ethereum.Call | null = null
): SDK | null {
  let customEvent: CustomEventType;
  if (event) {
    customEvent = CustomEventType.initialize(
      event.block,
      event.transaction,
      event.transactionLogIndex,
      event
    );
  } else if (call) {
    customEvent = CustomEventType.initialize(
      call.block,
      call.transaction,
      call.transaction.index
    );
  } else {
    log.error("[_getSDK]either event or call needs to be specified", []);
    return null;
  }

  const conf = new BridgeConfig(
    NetworkConfigs.getFactoryAddress(),
    NetworkConfigs.getProtocolName(),
    NetworkConfigs.getProtocolSlug(),
    BridgePermissionType.PRIVATE,
    Versions
  );

  return new SDK(conf, new Pricer(), new TokenInit(), customEvent);
}


export function onCreatePool(
  // eslint-disable-next-line no-unused-vars
  event: CustomEventType,
  pool: Pool,
  // eslint-disable-next-line no-unused-vars
  sdk: SDK,
  aux1: BridgePoolType | null = null,
  aux2: string | null = null
): void {
  if (aux1 && aux2) {
    const token = sdk.Tokens.getOrCreateToken(Address.fromString(aux2));
    pool.initialize(
      `Pool-based Bridge: ${token.name}`,
      token.name,
      aux1,
      token
    );
  }
}

// Bridge via the Original Token Vault
export function handleLockIn(event: Deposit): void {
  
  const poolId = event.address.concat(event.params.token)
  const networkConstants = getNetworkSpecificConstant(dataSource.network());
  const dstPoolId = networkConstants.getpeggedTokenBridgeForChain(event.params.toChain);
  _handleTransferOut(
    event.params.token,
    event.params.fromAddr,
    event.params.toAddr,
    event.params.amount,
    event.params.toChain,
    poolId,
    BridgePoolType.LOCK_RELEASE,
    CrosschainTokenType.WRAPPED,
    event,
    event.params.depositId,
    dstPoolId,
  );
}

// Withdraw from the Original Token Vault
export function handleOTVWithdraw(event: Withdraw): void {

  const tokenAddress = Address.fromBytes(event.params.token)
  const poolId = event.address.concat(tokenAddress);
  const networkConstants = getNetworkSpecificConstant(dataSource.network());
  const srcPoolId = networkConstants.getpeggedTokenBridgeForChain(event.params.fromChain);
  _handleTransferIn(
    tokenAddress,
    event.params.fromAddr,
    event.params.toAddr,
    event.params.uints[0],
    event.params.fromChain,
    poolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event,
    srcPoolId,
  );
}

// Mint on Pegged Token Minter
export function handleMint(event: Swap): void {
  const poolId = event.address.concat(event.params.tokenAddress);
  const networkConstants = getNetworkSpecificConstant(event.params.fromChain);
  const srcPoolId = networkConstants.getOriginalTokenVaultAddress();
  _handleTransferIn(
    event.params.tokenAddress,
    event.params.fromAddr,
    event.params.toAddr,
    event.params.uints[0],
    event.params.fromChain,
    poolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event,
    srcPoolId,
  );
}

// Burn on Pegged Token Minter
export function handleBurn(event: SwapRequest): void {
  const poolId = event.address.concat(event.params.tokenAddress);
  const networkConstants = getNetworkSpecificConstant(event.params.toChain);
  const dstPoolId = networkConstants.getOriginalTokenVaultAddress();
  _handleTransferOut(
    event.params.tokenAddress,
    event.params.fromAddr,
    event.params.toAddr,
    event.params.amount,
    event.params.toChain,
    poolId,
    BridgePoolType.BURN_MINT,
    CrosschainTokenType.WRAPPED,
    event,
    event.params.depositId,
    dstPoolId,
  );
}


function _handleTransferIn(
  token: Address,
  sender: Bytes,
  receiver: Bytes,
  amount: BigInt,
  srcChain: string,
  poolId: Bytes,
  bridgePoolType: BridgePoolType,
  crosschainTokenType: CrosschainTokenType,
  event: ethereum.Event,
  srcPoolId: Address | null = null,
): void {
  if (!srcPoolId) {
    log.warning("srcPoolId is null for srcChain: {}", [srcChain]);
    return;
  }
  const sdk = _getSDK(event)!;
  const pool = sdk.Pools.loadPool(
    poolId,
    onCreatePool,
    bridgePoolType,
    token.toHexString()
  );

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(srcChain),
    srcPoolId,
    crosschainTokenType,
    token
  );
  pool.addDestinationToken(crossToken);
  const account = sdk.Accounts.loadAccount(Address.fromBytes(receiver))
  account.transferIn(pool, pool.getDestinationTokenRoute(crossToken)!, Address.fromBytes(sender), amount);
}

function _handleTransferOut(
  token: Address,
  sender: Bytes,
  receiver: Bytes,
  amount: BigInt,
  toChain: string,
  poolId: Bytes,
  bridgePoolType: BridgePoolType,
  crosschainTokenType: CrosschainTokenType,
  event: ethereum.Event,
  refId: BigInt,
  dstPoolId: Address | null = null,
): void {
  if (!dstPoolId) {
    log.warning("dstPoolId is null for transaction: {}", [event.transaction.hash.toHexString()]);
    return;
  }
  log.debug("Made it here 1.5: {}", [event.transaction.hash.toHexString()]);
  const sdk = _getSDK(event)!;
  const pool = sdk.Pools.loadPool(
    poolId,
    onCreatePool,
    bridgePoolType,
    token.toHexString()
  );

  log.debug("Made it here 2: {}", [event.transaction.hash.toHexString()]);
  const context = dataSource.context();
  log.debug("Made it here abc: {}", [event.transaction.hash.toHexString()]);
  // // If Receiver is taxReceiver, this is the tax fee
  if (Address.fromBytes(receiver) == Address.fromString(taxReceiver)) {
    log.debug("Made it here 3: {}", [event.transaction.hash.toHexString()]);
    pool.addRevenueNative(amount, BIGINT_ZERO);
    return;
  }

  log.debug("Made it here 4: {}", [event.transaction.hash.toHexString()]);
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(toChain),
    dstPoolId,
    crosschainTokenType,
    token
  );
  log.debug("Made it here 5: {}", [event.transaction.hash.toHexString()]);
  pool.addDestinationToken(crossToken);
  const account = sdk.Accounts.loadAccount(Address.fromBytes(sender))
  account.transferOut(pool, pool.getDestinationTokenRoute(crossToken)!, Address.fromBytes(receiver), amount);
  log.debug("Made it here 6: {}", [event.transaction.hash.toHexString()]);
}


// export function handleLockIn(event: Deposit): void {
//   log.warning("transaction hash: {} Block number: {}", [
//     event.transaction.hash.toHexString(),
//     event.block.number.toString(),
//   ]);

//   new Pricer();
// }


