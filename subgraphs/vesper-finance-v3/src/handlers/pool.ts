import {
  ethereum,
  log,
  dataSource,
  Address,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { AddressList } from "../../generated/poolV3_vaUSDC/AddressList";
import {
  PoolV3,
  Transfer,
  Withdraw,
  Deposit,
  TransferCall,
  DepositCall,
  WithdrawCall,
} from "../../generated/poolV3_vaUSDC/PoolV3";
import { Erc20Token } from "../../generated/poolV3_vaUSDC/Erc20Token";
import { VesperPool } from "../../generated/schema";
import {
  toUsd,
  hasStrategy,
  getShareToTokenRateV3,
  getDecimalDivisor,
  getPoolV3,
} from "../peer";
import { ZERO_ADDRESS, VVSP_ADDRESS_HEX } from "../constant";

import {
  getOrCreateYieldAggregator,
  getOrCreateVault,
  getOrCreateTransfer,
  getOrCreateWithdraw,
  getOrCreateDeposit,
} from "../entities";
import { updateAllSnapshots } from "../snapshots";

class Revenue {
  protocolRevenue: BigDecimal;
  protocolRevenueUsd: BigDecimal;
  supplySideRevenue: BigDecimal;
  supplySideRevenueUsd: BigDecimal;
  constructor(
    _protocolRevenue: BigDecimal,
    _supplySideRevenue: BigDecimal,
    shareToTokenRate: BigDecimal,
    tokenAddress: Address
  ) {
    let tokenDecimals = Erc20Token.bind(tokenAddress).decimals();
    let protocolRevenue = _protocolRevenue.times(shareToTokenRate);
    this.protocolRevenue = protocolRevenue;
    this.protocolRevenueUsd = toUsd(
      protocolRevenue,
      tokenDecimals,
      tokenAddress
    );
    let supplySideRevenue = _supplySideRevenue.times(shareToTokenRate);
    this.supplySideRevenue = supplySideRevenue;
    this.supplySideRevenueUsd = toUsd(
      supplySideRevenue,
      tokenDecimals,
      tokenAddress
    );
  }
}

function calculateRevenue(
  interest: BigDecimal,
  shareToTokenRate: BigDecimal,
  tokenAddress: Address
): Revenue {
  // 95% of the fees go to the protocol revenue
  let protocolRevenue = interest.times(BigDecimal.fromString("0.95"));
  // 5% of the fees go to the supply-side revenue
  let supplySideRevenue = interest.times(BigDecimal.fromString("0.05"));
  return new Revenue(
    protocolRevenue,
    supplySideRevenue,
    shareToTokenRate,
    tokenAddress
  );
}

function saveRevenue(pool: VesperPool, revenue: Revenue): void {
  pool.protocolRevenue = pool.protocolRevenue.plus(revenue.protocolRevenue);
  pool.protocolRevenueUsd = pool.protocolRevenueUsd.plus(
    revenue.protocolRevenueUsd
  );
  pool.supplySideRevenue = pool.supplySideRevenue.plus(
    revenue.supplySideRevenue
  );
  pool.supplySideRevenueUsd = pool.supplySideRevenueUsd.plus(
    revenue.supplySideRevenueUsd
  );
  pool.totalRevenue = pool.totalRevenue
    .plus(pool.supplySideRevenue)
    .plus(pool.protocolRevenue);
  pool.totalRevenueUsd = pool.totalRevenueUsd
    .plus(pool.supplySideRevenueUsd)
    .plus(pool.protocolRevenueUsd);
  pool.save();
}

function handleTotalSupply(
  blockNumber: BigInt,
  totalSupplyCall: ethereum.CallResult<BigInt>,
  pool: VesperPool,
  tokenAddress: Address,
  shareToTokenRate: BigDecimal
): void {
  if (totalSupplyCall.reverted) {
    log.warning("TotalSupply call reverted for pool={} in blockNumber={}", [
      dataSource.address().toHexString(),
      blockNumber.toString(),
    ]);
    return;
  }
  pool.totalSupply = totalSupplyCall.value;
  pool.totalSupplyUsd = toUsd(
    pool.totalSupply
      .toBigDecimal()
      .times(shareToTokenRate)
      .div(getDecimalDivisor(pool.poolTokenDecimals)),
    pool.collateralTokenDecimals,
    tokenAddress
  );
}

function handleWithdrawFee(
  pool: VesperPool,
  event: Withdraw,
  feeWhiteList: Address,
  withdrawFee: BigDecimal,
  shareToTokenRate: BigDecimal,
  tokenAddress: Address,
  vTokenDecimals: i32
): void {
  let poolAddress = dataSource.address();
  let poolAddressHex = poolAddress.toHexString();
  let withdrawerAddress = event.params.owner;
  let withdrawerAddressHex = withdrawerAddress.toHexString();
  let txHash = event.transaction.hash.toHexString();
  log.info(
    "Entered handleWithdrawFee for pool {}, withdraw made by {} in tx {}",
    [poolAddressHex, withdrawerAddressHex, txHash]
  );
  if (poolAddressHex === VVSP_ADDRESS_HEX) {
    log.info("Tx {}, VesperPool is vVSP, which has no fees.", [txHash]);
    return;
  }

  log.info("Getting the whitelist address for pool {}", [poolAddressHex]);
  let feeWhiteListAddressHex = feeWhiteList.toHexString();
  log.info("Fee address list for pool {} is {}", [
    poolAddressHex,
    feeWhiteListAddressHex,
  ]);
  if (feeWhiteList != ZERO_ADDRESS) {
    let addressList = AddressList.bind(feeWhiteList);
    if (addressList.contains(withdrawerAddress)) {
      log.info("Address {} is whitelisted in pool {}, withdraw is fee-less", [
        withdrawerAddressHex,
        poolAddressHex,
      ]);
      return;
    }
  }
  log.info("shares for tx {} in pool {} are {} - withdrawFee is ", [
    txHash,
    poolAddressHex,
    event.params.shares.toString(),
    withdrawFee.toString(),
  ]);
  let fees = event.params.shares
    .toBigDecimal()
    .div(getDecimalDivisor(vTokenDecimals))
    .times(withdrawFee);
  log.info("Fees for tx {} in pool {} originated by withdraw from {} are {}", [
    txHash,
    poolAddressHex,
    withdrawerAddressHex,
    fees.toString(),
  ]);
  let revenue = calculateRevenue(fees, shareToTokenRate, tokenAddress);
  log.info(
    "Fees distribution for tx {} in pool={}: ProtocolRevenue={}, supplySideRevenue={}",
    [
      txHash,
      poolAddressHex,
      revenue.protocolRevenue.toString(),
      revenue.supplySideRevenue.toString(),
    ]
  );
  saveRevenue(pool, revenue);
  log.info("Leaving handleWithdraw for pool {}, withdraw made by {} in tx {}", [
    poolAddressHex,
    withdrawerAddressHex,
    txHash,
  ]);
}

// See handleWithdrawFee for explanation.
export function handleWithdrawV3(call: WithdrawCall): void {
  getOrCreateVault(
    dataSource.address(),
    call.block.number,
    call.block.timestamp
  );
  let poolAddress = dataSource.address();
  let poolAddressHex = poolAddress.toHexString();
  let poolV3 = PoolV3.bind(poolAddress);
  if (
    call.to.equals(ZERO_ADDRESS) ||
    hasStrategy(poolV3.getStrategies(), call.to)
  ) {
    let toHex = call.to.toHexString();
    log.info(
      "Withdraw Event for pool V3 {} was made by {} - it is not interest fees.",
      [poolAddressHex, toHex]
    );
    return;
  }
  getOrCreateWithdraw(call, dataSource.address());
  updateAllSnapshots(call, dataSource.address());
}

export function handleTransferV3(call: TransferCall): void {
  let poolAddress = dataSource.address();
  let poolAddressHex = poolAddress.toHexString();
  log.info("Entered handleTransferV3 in tx={}, pool={}", [
    call.transaction.hash.toHex(),
    poolAddressHex,
  ]);
  let poolV3 = PoolV3.bind(poolAddress);
  if (
    call.from.equals(ZERO_ADDRESS) ||
    hasStrategy(poolV3.getStrategies(), call.from)
  ) {
    let toHex = call.from.toHexString();
    log.info(
      "Transfer Event for pool V3 {} was made by {} - it is not interest fees.",
      [poolAddressHex, toHex]
    );
    return;
  }
  getOrCreateVault(
    dataSource.address(),
    call.block.number,
    call.block.timestamp
  );
  getOrCreateTransfer(call, dataSource.address());
  updateAllSnapshots(call, dataSource.address());
}

export function handleDepositV3(call: DepositCall): void {
  let poolAddress = dataSource.address();
  let poolAddressHex = poolAddress.toHexString();
  log.info("Entered handleTransferV3 in tx={}, pool={}", [
    call.transaction.hash.toHex(),
    poolAddressHex,
  ]);
  let poolV3 = PoolV3.bind(poolAddress);
  if (
    call.from.equals(ZERO_ADDRESS) ||
    hasStrategy(poolV3.getStrategies(), call.from)
  ) {
    let toHex = call.from.toHexString();
    log.info(
      "Deposit Event for pool V3 {} was made by {} - it is not interest fees.",
      [poolAddressHex, toHex]
    );
    return;
  }
  getOrCreateVault(
    dataSource.address(),
    call.block.number,
    call.block.timestamp
  );
  getOrCreateDeposit(call, dataSource.address());
  updateAllSnapshots(call, dataSource.address());
}
