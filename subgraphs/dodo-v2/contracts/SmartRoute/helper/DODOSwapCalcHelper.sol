/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {IDODOV1} from "../intf/IDODOV1.sol";
import {IDODOSellHelper} from "./DODOSellHelper.sol";

contract DODOSwapCalcHelper {
    address public immutable _DODO_SELL_HELPER_;

    constructor(address dodoSellHelper) public {
        _DODO_SELL_HELPER_ = dodoSellHelper;
    }

    function calcReturnAmountV1(
        uint256 fromTokenAmount,
        address[] memory dodoPairs,
        uint8[] memory directions
    ) external view returns (uint256 returnAmount,uint256[] memory midPrices,uint256[] memory feeRates) {
        returnAmount = fromTokenAmount;
        midPrices = new uint256[](dodoPairs.length);
        feeRates = new uint256[](dodoPairs.length);
        for (uint256 i = 0; i < dodoPairs.length; i++) {
            address curDodoPair = dodoPairs[i];
            if (directions[i] == 0) {
                returnAmount = IDODOV1(curDodoPair).querySellBaseToken(returnAmount);
            } else {
                returnAmount = IDODOSellHelper(_DODO_SELL_HELPER_).querySellQuoteToken(
                    curDodoPair,
                    returnAmount
                );
            }
            midPrices[i] = IDODOV1(curDodoPair).getMidPrice();
            feeRates[i] = IDODOV1(curDodoPair)._MT_FEE_RATE_() + IDODOV1(curDodoPair)._LP_FEE_RATE_();
        }        
    }
}