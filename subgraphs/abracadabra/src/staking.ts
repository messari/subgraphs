import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { STAKED_SPELL, SPELL, TREASURY_ADDRESS, BIGDECIMAL_ZERO, DEFAULT_DECIMALS } from "./common/constants";
import { ERC20, Transfer } from "../generated/Spell/ERC20";
import { updateUsageMetrics } from "./common/metrics";
import { getOrCreateTokenPriceEntity } from "./common/prices/prices";
import { bigIntToBigDecimal } from "./common/utils/numbers";

// handle staking events which are spell transfers to and from sspell
// updates treasury and usageMetrics

export function handleTransfer(event: Transfer): void {
  if (event.params.to.toHexString() == STAKED_SPELL) {
    // stake spell into sspell
    // just add the same address, the way updateUsageMetrics is written, it will not double count
    updateUsageMetrics(event, event.params.from, event.params.from);
  } else if (event.params.from.toHexString() == STAKED_SPELL) {
    // withdraw spell from sspell
    // just add the same address, the way updateUsageMetrics is written, it will not double count
    updateUsageMetrics(event, event.params.to, event.params.to);
  }
}

export function getTreasuryBalance(): BigDecimal {
  let spellContract = ERC20.bind(Address.fromString(SPELL));
  let spellPriceUSD = getOrCreateTokenPriceEntity(SPELL).priceUSD;
  let treasurySpellBalance = spellContract.try_balanceOf(Address.fromString(TREASURY_ADDRESS));
  let treasurySpellBalanceUSD = BIGDECIMAL_ZERO;
  if (!treasurySpellBalance.reverted) {
    treasurySpellBalanceUSD = bigIntToBigDecimal(treasurySpellBalance.value, DEFAULT_DECIMALS).times(spellPriceUSD);
    return treasurySpellBalanceUSD;
  }
  return treasurySpellBalanceUSD;
}
