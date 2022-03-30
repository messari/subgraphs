import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import {
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ADDRESS_ZERO
} from "./utils/constants";

import {
  DVMFactory,
  NewDVM,
  OwnershipTransferPrepared,
  OwnershipTransferred,
  RemoveDVM
} from "../generated/DVMFactory/DVMFactory";

import {
  DODOLpToken,
  Approval,
  Burn,
  Mint,
  OwnershipTransferPrepared,
  OwnershipTransferred,
  Transfer
} from "../generated/DODOLpToken/DODOLpToken";

import {
  vDODOToken,
  Approval,
  ChangePerReward,
  DonateDODO,
  MintVDODO,
  PreDeposit,
  OwnershipTransferPrepared,
  OwnershipTransferred,
  RedeemVDODO,
  SetCantransfer,
  Transfer,
  UpdateDODOFeeBurnRatio
} from "../generated/vDODOToken/vDODOToken";

import {
  DVM,
  BuyShares,
  SellShares,
  DODOSwap,
  DODOFlashLoan,
  Transfer,
  Approval,
  Mint,
  Burn
} from "../generated/templates/DVM/DVM";

import { ERC20, Transfer, Approval } from "../generated/templates/ERC20/ERC20";

import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  RewardToken
} from "../generated/schema";

function getToken(address: Address): ERC20 {
  return ERC20.bind(address);
}

export function handleNewDVM(event: NewDVM): void {
  let dodo = DexAmmProtocol.load(event.address.toHex());
  let pool = LiquidityPool.load(event.params.dvm.toHex());
  let it = Token.load(event.params.baseToken.toHex());
  let ot = Token.load(event.params.quoteToken.toHex());
  let dodoLp = RewardToken.load(DODOLpToken_ADDRESS);
  let vdodo = RewardToken.load(vDODOToken_ADDRESS);

  if (!dodoLp) {
    dodoLp = new RewardToken(DODOLpToken_ADDRESS);
    let tokenC = getToken(Address.fromString(DODOLpToken_ADDRESS));
    dodoLp.name = tokenC.name();
    dodoLp.symbol = tokenC.symbol();
    dodoLp.decimals = tokenC.decimals();
    dodoLp.type = "DEPOSIT";
    dodoLp.save();
  }

  if (!vdodo) {
    vdodo = new RewardToken(vDODOToken_ADDRESS);
    let tokenC = getToken(Address.fromString(vDODOToken_ADDRESS));
    vdodo.name = tokenC.name();
    vdodo.symbol = tokenC.symbol();
    vdodo.decimals = tokenC.decimals();
    vdodo.type = "DEPOSIT";
    vdodo.save();
  }

  if (!it) {
    it = new Token(event.params.baseToken.toHex());
    let tokenC = getToken(event.params.baseToken);
    it.name = tokenC.name();
    it.symbol = tokenC.symbol();
    it.decimals = tokenC.decimals();
  }
  it.save();

  if (!ot) {
    ot = new Token(event.params.quoteToken.toHex());
    let tokenC = getToken(event.params.baseToken);
    ot.name = tokenC.name();
    ot.symbol = tokenC.symbol();
    ot.decimals = tokenC.decimals();
  }
  ot.save();

  if (!dodo) {
    dodo = new DexAmmProtocol(event.address.toHex());
    dodo.name = "DODO V2";
    dodo.slug = "messari-dodo";
    dodo.schemaVersion = "schema-dex-amm";
    dodo.subgraphVersion = "0.0.2";
    dodo.network = "ETHEREUM";
    dodo.type = "EXCHANGE";
    dodo.totalUniqueUsers = 0;
    dodo.totalValueLockedUSD = ZERO_BD;
  }

  if (!pool) {
    pool = new LiquidityPool(event.params.dvm.toHex());
    pool.protocol = dodo.id;
    pool.inputTokens = [it.id];
    pool.outputToken = ot.id;
    pool.rewardTokens = [dodoLp.id, vdodo.id];
    pool.totalValueLockedUSD = ZERO_BD;
    pool.totalVolumeUSD = ZERO_BD;
    pool.inputTokenBalances = [ZERO_BI];
    pool.outputTokenSupply = ZERO_BI;
    pool.outputTokenPriceUSD = ZERO_BD;
    pool.rewardTokenEmissionsAmount = [ZERO_BI];
    pool.rewardTokenEmissionsUSD = [ZERO_BD];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
  }

  dodo.save();
  pool.save();
}

export function handleRemoveDVM(event: RemoveDVM): void {
  let dodo = DexAmmProtocol.load(event.address.toHex());
  let pool = LiquidityPool.load(event.params.dvm.toHex());
}
