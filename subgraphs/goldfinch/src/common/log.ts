import {
  Address,
  ethereum,
  BigInt,
  ByteArray,
  crypto,
  log,
} from "@graphprotocol/graph-ts";
import {
  _MembershipStakingPosition,
  _MembershipStakingTx,
  _MembershipCapitalStaked,
  _PoolTokenStore,
} from "../../generated/schema";
import {
  BIGINT_ZERO,
  POOL_TOKENS_ADDRESS,
  SENIOR_POOL_ADDRESS,
  STAKING_REWARDS_ADDRESS,
} from "./constants";

const AdjustedHoldingsSig = crypto.keccak256(
  ByteArray.fromUTF8("AdjustedHoldings(address,uint256,uint256)")
);

export class AdjustedHoldingsLog {
  owner: Address;
  eligibleAmount: BigInt;
  nextEpochAmount: BigInt;

  private constructor(txLog: ethereum.Log) {
    this.owner = txLog.address;
    this.eligibleAmount = AdjustedHoldingsLog.getEligibleAmount(txLog);
    this.nextEpochAmount = AdjustedHoldingsLog.getNextEpochAmount(txLog);
  }

  static parse(txLog: ethereum.Log): AdjustedHoldingsLog | null {
    if (!AdjustedHoldingsLog.isAdjustedHoldingsLog(txLog)) {
      return null;
    }

    return new AdjustedHoldingsLog(txLog);
  }

  static isAdjustedHoldingsLog(txLog: ethereum.Log): boolean {
    return txLog.topics[0].equals(AdjustedHoldingsSig);
  }

  static getOwner(txLog: ethereum.Log): Address {
    return ethereum.decode("address", txLog.topics[1])!.toAddress();
  }

  static getEligibleAmount(txLog: ethereum.Log): BigInt {
    const decoded = ethereum.decode("(uint256,uint256)", txLog.data)!.toTuple();
    return decoded[0].toBigInt();
  }

  static getNextEpochAmount(txLog: ethereum.Log): BigInt {
    const decoded = ethereum.decode("(uint256,uint256)", txLog.data)!.toTuple();
    return decoded[1].toBigInt();
  }
}

const DepositSig = crypto.keccak256(
  ByteArray.fromUTF8(
    "CapitalERC721Deposit(address,address,uint256,uint256,uint256)"
  )
);

export class CapitalERC721DepositLog {
  owner: Address;
  assetAddress: Address;
  positionId: BigInt;
  assetTokenId: BigInt;
  usdcEquivalent: BigInt;
  marketId: string;

  private constructor(txLog: ethereum.Log) {
    this.owner = CapitalERC721DepositLog.getOwner(txLog);
    this.assetAddress = CapitalERC721DepositLog.getAssetAddress(txLog);
    this.positionId = CapitalERC721DepositLog.getPositionID(txLog);
    this.assetTokenId = CapitalERC721DepositLog.getAssetTokenId(txLog);
    this.usdcEquivalent = CapitalERC721DepositLog.getUsdcEquivalent(txLog);
    this.marketId = "";
  }

  static parse(txLog: ethereum.Log): CapitalERC721DepositLog | null {
    if (!CapitalERC721DepositLog.isCapitalERC721DepositLog(txLog)) {
      return null;
    }

    return new CapitalERC721DepositLog(txLog);
  }

  static isCapitalERC721DepositLog(txLog: ethereum.Log): boolean {
    return txLog.topics[0].equals(DepositSig);
  }

  static getOwner(txLog: ethereum.Log): Address {
    return ethereum.decode("address", txLog.topics[1])!.toAddress();
  }

  static getAssetAddress(txLog: ethereum.Log): Address {
    return ethereum.decode("address", txLog.topics[2])!.toAddress();
  }

  static getPositionID(txLog: ethereum.Log): BigInt {
    const decoded = ethereum
      .decode("(uint256,uint256,uint256)", txLog.data)!
      .toTuple();
    return decoded[0].toBigInt();
  }

  static getAssetTokenId(txLog: ethereum.Log): BigInt {
    const decoded = ethereum
      .decode("(uint256,uint256,uint256)", txLog.data)!
      .toTuple();
    return decoded[1].toBigInt();
  }

  static getUsdcEquivalent(txLog: ethereum.Log): BigInt {
    const decoded = ethereum
      .decode("(uint256,uint256,uint256)", txLog.data)!
      .toTuple();
    return decoded[2].toBigInt();
  }

  setmarketId(marketId: string): void {
    this.marketId = marketId;
  }

  handleDeposit(txLog: ethereum.Log): void {
    const currTxHash = txLog.transactionHash.toHexString();
    const txLogID = `${currTxHash}-${txLog.logIndex.toString()}`;
    const marketID = getMarketID(this.assetAddress, this.assetTokenId);
    if (!marketID) {
      log.error(
        "[CapitalERC721DepositLog.handleDeposit]failed to look up market id for asset {} with tokenId {}",
        [this.assetAddress.toHexString(), this.assetTokenId.toString()]
      );
      return;
    }
    this.setmarketId(marketID!);
    const positionID = this.positionId.toString();
    let position = _MembershipStakingPosition.load(positionID);
    if (!position) {
      position = new _MembershipStakingPosition(positionID);
      position.market = marketID!;
      position.usdcEquivalent = this.usdcEquivalent;
      position.save();
    }

    let txLogEntity = _MembershipStakingTx.load(txLogID);
    if (!txLogEntity) {
      // a new tx that's not been processed
      txLogEntity = new _MembershipStakingTx(txLogID);
      txLogEntity.save();

      const stakedID = `${currTxHash}-${marketID!}`;
      let stakedEntity = _MembershipCapitalStaked.load(stakedID);
      if (!stakedEntity) {
        stakedEntity = new _MembershipCapitalStaked(stakedID);
        stakedEntity.market = marketID!;
        stakedEntity.CapitalStakedAmount = BIGINT_ZERO;
      }
      stakedEntity.CapitalStakedAmount = stakedEntity.CapitalStakedAmount.plus(
        this.usdcEquivalent
      );
      stakedEntity.save();
    }
  }
}

const WithdrawSig = crypto.keccak256(
  ByteArray.fromUTF8("CapitalERC721Withdrawal(address,uint256,address,uint256)")
);

export class CapitalERC721WithdrawalLog {
  owner: Address;
  positionId: BigInt;
  assetAddress: Address;
  depositTimestamp: BigInt;
  marketId: string;
  usdcEquivalent: BigInt;

  private constructor(txLog: ethereum.Log) {
    this.owner = CapitalERC721WithdrawalLog.getOwner(txLog);
    this.positionId = CapitalERC721WithdrawalLog.getPositionID(txLog);
    this.assetAddress = CapitalERC721WithdrawalLog.getAssetAddress(txLog);
    this.depositTimestamp =
      CapitalERC721WithdrawalLog.getDepositTimestamp(txLog);
    this.marketId = "";
    this.usdcEquivalent = BIGINT_ZERO;
  }

  static parse(txLog: ethereum.Log): CapitalERC721WithdrawalLog | null {
    if (!CapitalERC721WithdrawalLog.isCapitalERC721WithdrawalLog(txLog)) {
      return null;
    }

    return new CapitalERC721WithdrawalLog(txLog);
  }

  static isCapitalERC721WithdrawalLog(txLog: ethereum.Log): boolean {
    return txLog.topics[0].equals(WithdrawSig);
  }

  static getOwner(txLog: ethereum.Log): Address {
    return ethereum.decode("address", txLog.topics[1])!.toAddress();
  }

  static getPositionID(txLog: ethereum.Log): BigInt {
    const decoded = ethereum
      .decode("(uint256,address,uint256)", txLog.data)!
      .toTuple();
    return decoded[0].toBigInt();
  }

  static getAssetAddress(txLog: ethereum.Log): Address {
    const decoded = ethereum
      .decode("(uint256,address,uint256)", txLog.data)!
      .toTuple();
    return decoded[1].toAddress();
  }

  static getDepositTimestamp(txLog: ethereum.Log): BigInt {
    const decoded = ethereum
      .decode("(uint256,address,uint256)", txLog.data)!
      .toTuple();
    return decoded[2].toBigInt();
  }

  setmarketId(marketId: string): void {
    this.marketId = marketId;
  }

  setUsdcEquivalent(usdcEquivalent: BigInt): void {
    this.usdcEquivalent = usdcEquivalent;
  }

  handleWithdraw(txLog: ethereum.Log): void {
    const positionID = this.positionId.toString();
    const position = _MembershipStakingPosition.load(positionID);
    if (!position) {
      log.error(
        "[processCapitalWithdraw]position {} not existing in _MembershipStakingPosition",
        [positionID]
      );
      return;
    }

    this.setmarketId(position.market);

    const currTxHash = txLog.transactionHash.toHexString();
    const txLogID = `${currTxHash}-${txLog.logIndex.toString()}`;
    let txLogEntity = _MembershipStakingTx.load(txLogID);
    if (!txLogEntity) {
      // a new tx that's not been processed
      txLogEntity = new _MembershipStakingTx(txLogID);
      txLogEntity.save();

      const stakedID = `${currTxHash}-${position.market}`;
      let stakedEntity = _MembershipCapitalStaked.load(stakedID);
      if (!stakedEntity) {
        stakedEntity = new _MembershipCapitalStaked(stakedID);
        stakedEntity.market = position.market;
        stakedEntity.CapitalStakedAmount = BIGINT_ZERO;
      }
      stakedEntity.CapitalStakedAmount = stakedEntity.CapitalStakedAmount.minus(
        position.usdcEquivalent
      );
      stakedEntity.save();
    }
  }
}

function getMarketID(assetAddress: Address, tokenID: BigInt): string | null {
  if (assetAddress.equals(Address.fromString(STAKING_REWARDS_ADDRESS))) {
    // staking of staked FIDU token, return senior pool id
    return SENIOR_POOL_ADDRESS;
  }

  if (assetAddress.equals(Address.fromString(POOL_TOKENS_ADDRESS))) {
    // staking ERC 721 tranched pool token, use tokenID to look up tranched pool address
    const poolToken = _PoolTokenStore.load(tokenID.toString());
    if (!poolToken) {
      log.error("[getMarketID]tokenID {} does not exist in _PoolTokenStore", [
        tokenID.toString(),
      ]);
      return null;
    }
    return poolToken.market;
  }

  return null;
}
