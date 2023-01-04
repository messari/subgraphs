import { Address } from "@graphprotocol/graph-ts";
import {
  BonusToSPChanged,
  MCRChanged,
  PriceFeedChanged,
  VestaParameters,
} from "../../generated/VestaParameters/VestaParameters";
import { LendingProtocol, Market } from "../../generated/schema";
import {
  getOrCreateLendingProtocol,
  updateProtocolPriceOracle,
} from "../entities/protocol";
import { bigIntToBigDecimal } from "../utils/numbers";
import { BIGDECIMAL_HUNDRED, BIGINT_ZERO } from "../utils/constants";

export function handlePriceFeedChanged(event: PriceFeedChanged): void {
  const newPriceOracle = event.params.addr;
  updateProtocolPriceOracle(newPriceOracle.toHexString());
}

export function handleMCRChanged(event: MCRChanged): void {
  const protocol = getOrCreateLendingProtocol();
  const assets = protocol._marketAssets;
  const contract = VestaParameters.bind(event.address);

  // As the asset address is not included in the event's paramters, we have to iterate over all markets to update their MCR.
  for (let i = 0; i < assets.length; i++) {
    const market = Market.load(assets[i]);
    if (market != null) {
      const tryMCR = contract.try_MCR(Address.fromString(assets[i]));
      if (!tryMCR.reverted && tryMCR.value != BIGINT_ZERO) {
        const adjustedMCR = bigIntToBigDecimal(tryMCR.value);
        const MaxLTV = BIGDECIMAL_HUNDRED.div(adjustedMCR);
        market.maximumLTV = MaxLTV;
        market.liquidationThreshold = MaxLTV;

        market.save();
      }
    }
  }

  // As of Sep 2022, the bonusToSP function call was not enabled in Vesta Parameters contract when the latest BonusToSPChanged event was triggered.
  // So we call try to retrieve the latest bonusToSP values here in order to get the updated values ASAP.
  if (!protocol._bonusToSPCallEnabled) {
    retrieveBonusToSP(protocol, assets, contract);
  }
}

export function handleBonusToSPChanged(event: BonusToSPChanged): void {
  const protocol = getOrCreateLendingProtocol();
  const assets = protocol._marketAssets;
  const contract = VestaParameters.bind(event.address);

  retrieveBonusToSP(protocol, assets, contract);
}

function retrieveBonusToSP(
  protocol: LendingProtocol,
  assets: string[],
  contract: VestaParameters
): void {
  // As the asset address is not included in the event's paramters, we have to iterate over all markets to update their MCR.
  for (let i = 0; i < assets.length; i++) {
    const market = Market.load(assets[i]);
    if (market != null) {
      const tryBonusToSP = contract.try_BonusToSP(
        Address.fromString(assets[i])
      );

      if (tryBonusToSP.reverted) {
        return;
      } else {
        market.liquidationPenalty = bigIntToBigDecimal(
          tryBonusToSP.value
        ).times(BIGDECIMAL_HUNDRED);
        market.save();

        if (!protocol._bonusToSPCallEnabled) {
          protocol._bonusToSPCallEnabled = true;
          protocol.save();
        }
      }
    }
  }
}
