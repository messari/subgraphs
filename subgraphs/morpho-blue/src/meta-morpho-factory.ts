import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { CreateMetaMorpho as CreateMetaMorphoEvent } from "../generated/MetaMorphoFactory/MetaMorphoFactory";
import { InterestRate, MetaMorpho } from "../generated/schema";
import { MetaMorpho as MetaMorphoTemplate } from "../generated/templates";

import { getZeroMarket } from "./initializers/markets";
import { AccountManager } from "./sdk/account";
import { InterestRateSide, InterestRateType } from "./sdk/constants";
import { TokenManager } from "./sdk/token";

export function handleCreateMetaMorpho(event: CreateMetaMorphoEvent): void {
  MetaMorphoTemplate.create(event.params.metaMorpho);
  const metaMorpho = new MetaMorpho(event.params.metaMorpho);

  metaMorpho.name = event.params.name;
  metaMorpho.symbol = event.params.symbol;
  metaMorpho.decimals = 18;
  metaMorpho.asset = new TokenManager(event.params.asset, event).getToken().id;

  metaMorpho.owner = new AccountManager(
    event.params.initialOwner
  ).getAccount().id;

  metaMorpho.timelock = event.params.initialTimelock;

  metaMorpho.fee = BigInt.zero();
  metaMorpho.feeAccrued = BigInt.zero();
  metaMorpho.feeAccruedAssets = BigInt.zero();

  metaMorpho.lastTotalAssets = BigInt.zero();
  metaMorpho.totalShares = BigInt.zero();
  metaMorpho.idle = BigInt.zero();

  metaMorpho.supplyQueue = [];
  metaMorpho.withdrawQueue = [];

  const rate = new InterestRate(metaMorpho.id.toHexString() + "-supply");
  rate.rate = BigDecimal.zero();
  rate.market = getZeroMarket(event).id;
  rate.type = InterestRateType.VARIABLE;
  rate.side = InterestRateSide.LENDER;
  rate.save();

  metaMorpho.rate = rate.id;

  metaMorpho.account = new AccountManager(
    event.params.metaMorpho
  ).getAccount().id;

  metaMorpho.save();
}
