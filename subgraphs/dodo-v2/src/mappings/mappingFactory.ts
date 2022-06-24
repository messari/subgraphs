import { getOrCreatePool } from "../utils/getters";
import { Address } from "@graphprotocol/graph-ts";

import { DVMFactory, NewDVM } from "../../generated/DVMFactory/DVMFactory";

import {
  CrowdPoolingFactory,
  NewCP
} from "../../generated/CrowdPoolingFactory/CrowdPoolingFactory";

import { DPPFactory, NewDPP } from "../../generated/DPPFactory/DPPFactory";

import { DSPFactory, NewDSP } from "../../generated/DSPFactory/DSPFactory";

import {
  DODOMineV3Proxy,
  DepositRewardToMine
} from "../../generated/DODOMineV3Proxy/DODOMineV3Proxy";

import { DODOMine } from "../../generated/DODOMineV3Proxy/DODOMine";

import { getUSDprice } from "../utils/getters";

import { ERC20V3Factory, NewERC20 } from "../../generated/ERC20V3Factory/ERC20V3Factory";

import { DODOLpToken_ADDRESS, ZERO_BI, TOKEN_CREATION_FEE } from "../constants/constant";

import { updateFinancialsERC20 } from "../utils/metrics";

export function handleNewDVM(event: NewDVM): void {
  getOrCreatePool(
    event.params.dvm,
    event.params.baseToken,
    event.params.quoteToken,
    event.block.timestamp,
    event.block.number
  );
}

export function handleNewCP(event: NewCP): void {
  getOrCreatePool(
    event.params.cp,
    event.params.baseToken,
    event.params.quoteToken,
    event.block.timestamp,
    event.block.number
  );
}

export function handleNewDPP(event: NewDPP): void {
  getOrCreatePool(
    event.params.dpp,
    event.params.baseToken,
    event.params.quoteToken,
    event.block.timestamp,
    event.block.number
  );
}

export function handleNewDSP(event: NewDSP): void {
  getOrCreatePool(
    event.params.DSP,
    event.params.baseToken,
    event.params.quoteToken,
    event.block.timestamp,
    event.block.number
  );
}

// event DepositRewardToMine(address mine, address rewardToken, uint256 amount);
// event CreateMineV3(address account, address mineV3);export function handleNewMineV3(event: NewDSP): void {
export function handleDepositRewardToMine(event: DepositRewardToMine): void {
  let mineAdd = event.params.mine;
  let dmContract = DODOMine.bind(mineAdd);
  let ddpb = dmContract.try_dodoPerBlock();
  let dd = ZERO_BI;
  if (ddpb.reverted) {
    dd = ZERO_BI;
  } else {
    dd = ddpb.value;
  }
  let poolAdd = event.params.rewardToken;
  let pool = getOrCreatePool(
    poolAdd,
    poolAdd,
    poolAdd,
    event.block.timestamp,
    event.block.number
  );
  pool.stakedOutputTokenAmount += event.params.amount;
  pool.rewardTokenEmissionsAmount = [dd];
  let usdPricePerBlock = getUSDprice(
    Address.fromString(DODOLpToken_ADDRESS),
    dd
  );
  pool.rewardTokenEmissionsUSD = [usdPricePerBlock];
  pool.save();
}

export function handleNewERC20(event: NewERC20): void {
  //NewERC20 (address erc20, address creator, uint256 erc20Type)
  updateFinancialsERC20(event);
}
