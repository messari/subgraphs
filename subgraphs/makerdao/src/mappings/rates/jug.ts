import { Address } from "@graphprotocol/graph-ts";
import { LogNote } from "../../../generated/Jug/Jug";
import { getMarketFromIlk, getOrCreateInterestRate } from "../../common/getters";
import { bigIntToBigDecimal, bigDecimalExponential, round } from "./../../common/utils/numbers";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ONE_HUNDRED,
  COLLATERAL_FILE_SIGNATURE,
  MCD_JUG_ADDRESS,
  RAY,
  SECONDS_PER_YEAR_BIGDECIMAL,
} from "../../common/constants";
import { Jug } from "../../../generated/templates/Jug/Jug";

// Updates the stable borrow rate for the market
export function handleFile(event: LogNote): void {
  let signature = event.params.sig.toHexString();
  if (signature == COLLATERAL_FILE_SIGNATURE) {
    let ilk = event.params.arg1;
    let what = event.params.arg2.toString();
    if (what == "duty") {
      let jugContract = Jug.bind(Address.fromString(MCD_JUG_ADDRESS));
      let market = getMarketFromIlk(ilk);
      if (!market) {
        return;
      }
      let interestRate = getOrCreateInterestRate(market.id);
      let rate = bigIntToBigDecimal(jugContract.ilks(ilk).value0, RAY).minus(BIGDECIMAL_ONE);
      let interestRateAnnualized = bigDecimalExponential(rate, SECONDS_PER_YEAR_BIGDECIMAL).times(
        BIGDECIMAL_ONE_HUNDRED,
      );
      interestRate.rate = round(interestRateAnnualized);
      interestRate.save();
      market.rates = [interestRate.id];
      market.save();
    }
  }
}
