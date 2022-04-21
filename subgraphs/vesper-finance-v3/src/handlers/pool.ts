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
} from "../orm";

// these functions compiles to AssemblyScript. Therefore although we are allowed to code in TS in this file
// we need to do so with the restrictions of AssemblyScript
// * no union types allowed (so we can't reuse a function here)
// * comparisons should be made with == (unless comparing exact pointers)
// * no destructuring

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

// This handler is called for every block for v3 Pools. It is used to persist
// totalSupply and totalDebt(), as there are no events for these methods
// and are restricted from thegraph to be hooked on.
export function handleBlockV3(block: ethereum.Block): void {
  let poolAddress = dataSource.address();
  // let poolAddressHex = poolAddress.toHexString();
  const vault = getOrCreateVault(poolAddress, block.number, block.timestamp);
  // const aggregator = getOrCreateYieldAggregator();
  // log.info("Entered handleBlockV3 for address {}", [poolAddressHex]);

  // let pool = getPoolV3(poolAddressHex);
  // let poolV3 = PoolV3.bind(poolAddress);
  // log.info("Calculating values for pool {}", [poolAddressHex]);
  // let tokenAddress = poolV3.token();
  // handleTotalSupply(
  //   block.number,
  //   poolV3.try_totalSupply(),
  //   pool,
  //   tokenAddress,
  //   getShareToTokenRateV3(poolV3)
  // );
  // log.info("pool {}, totalSupply={}", [
  //   poolAddressHex,
  //   pool.totalSupply.toString(),
  // ]);
  // let totalDebtCall = poolV3.try_totalDebt();
  // if (!totalDebtCall.reverted) {
  //   pool.totalDebt = totalDebtCall.value;
  //   let tokenDecimal = Erc20Token.bind(tokenAddress).decimals();
  //   pool.totalDebtUsd = toUsd(
  //     pool.totalDebt.toBigDecimal().div(getDecimalDivisor(tokenDecimal)),
  //     tokenDecimal,
  //     tokenAddress
  //   );
  // }
  // log.info("pool {}, totalDebt={}", [
  //   poolAddressHex,
  //   pool.totalDebt.toString(),
  // ]);

  // aggregator.totalValueLockedUSD = aggregator.totalValueLockedUSD.plus(
  //   pool.totalDebtUsd
  // );

  // aggregator.save();
  // pool.save();
}

// This handler is used to calculate the withdraw fees for every pool
// The Withdraw event is fired in every withdraw, and the fees are calculated if the address
// withdrawing is not whitelisted - in that case it is 0
// vVSP does not have withdraw fees either
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
export function handleWithdrawV3(event: Withdraw): void {
  getOrCreateWithdraw(event, dataSource.address());
  // let poolAddress = dataSource.address();
  // let poolV3 = PoolV3.bind(poolAddress);
  // handleWithdrawFee(
  //   getPoolV3(poolAddress.toHexString()),
  //   event,
  //   poolV3.feeWhitelist(),
  //   poolV3
  //     .withdrawFee()
  //     .toBigDecimal()
  //     .div(BigDecimal.fromString("10000")),
  //   getShareToTokenRateV3(poolV3),
  //   poolV3.token(),
  //   poolV3.decimals()
  // );
}

// This handler hooks on transferring of the fees for V3 Pools
// Strategies of the pool transfer the fees to the pool as an amount of shares
// this is done through minting of the shares, hence the Transfer event is emitted.
export function handleTransferV3(event: Transfer): void {
  let poolAddress = dataSource.address();
  let poolAddressHex = poolAddress.toHexString();
  log.info("Entered handleTransferV3 in tx={}, pool={}", [
    event.transaction.hash.toHex(),
    poolAddressHex,
  ]);
  let poolV3 = PoolV3.bind(poolAddress);
  if (
    event.params.from != ZERO_ADDRESS ||
    !hasStrategy(poolV3.getStrategies(), event.params.to)
  ) {
    let toHex = event.params.to.toHexString();
    log.info(
      "Transfer Event for pool V3 {} was made by {} - it is not interest fees.",
      [poolAddressHex, toHex]
    );
    return;
  }
  getOrCreateTransfer(event, dataSource.address());
  // let interestFees = event.params.value
  //   .toBigDecimal()
  //   .div(getDecimalDivisor(poolV3.decimals()));
  // log.info("interestFees={}", [interestFees.toString()]);
  // let revenue = calculateRevenue(
  //   interestFees,
  //   getShareToTokenRateV3(poolV3),
  //   poolV3.token()
  // );
  // log.info(
  //   "Interest fees distribution for tx {} in poolV3 {}: ProtocolRevenue={}, supplySideRevenue={}",
  //   [
  //     event.transaction.hash.toHexString(),
  //     poolAddressHex,
  //     revenue.protocolRevenue.toString(),
  //     revenue.supplySideRevenue.toString(),
  //   ]
  // );
  // saveRevenue(getPoolV3(poolAddressHex), revenue);
}

export function handleDepositV3(event: Deposit): void {
  let poolAddress = dataSource.address();
  let poolAddressHex = poolAddress.toHexString();
  log.info("Entered handleTransferV3 in tx={}, pool={}", [
    event.transaction.hash.toHex(),
    poolAddressHex,
  ]);
  let poolV3 = PoolV3.bind(poolAddress);
  if (
    event.params.owner != ZERO_ADDRESS ||
    !hasStrategy(poolV3.getStrategies(), event.params.owner)
  ) {
    let toHex = event.params.owner.toHexString();
    log.info(
      "Deposit Event for pool V3 {} was made by {} - it is not interest fees.",
      [poolAddressHex, toHex]
    );
    return;
  }
  getOrCreateDeposit(event, dataSource.address());
}
