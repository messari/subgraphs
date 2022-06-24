/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {IERC20} from "../../intf/IERC20.sol";
import {IDODOV1} from "../intf/IDODOV1.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";
import {IDODOSellHelper} from "../helper/DODOSellHelper.sol";
import {UniversalERC20} from "../lib/UniversalERC20.sol";
import {SafeMath} from "../../lib/SafeMath.sol";
import {IDODOAdapter} from "../intf/IDODOAdapter.sol";

contract DODOV1Adapter is IDODOAdapter {
    using SafeMath for uint256;
    using UniversalERC20 for IERC20;

    address public immutable _DODO_SELL_HELPER_;

    constructor(address dodoSellHelper) public {
        _DODO_SELL_HELPER_ = dodoSellHelper;
    }
    
    function sellBase(address to, address pool, bytes memory) external override {
        address curBase = IDODOV1(pool)._BASE_TOKEN_();
        uint256 curAmountIn = IERC20(curBase).tokenBalanceOf(address(this));
        IERC20(curBase).universalApproveMax(pool, curAmountIn);
        IDODOV1(pool).sellBaseToken(curAmountIn, 0, "");
        if(to != address(this)) {
            address curQuote = IDODOV1(pool)._QUOTE_TOKEN_();
            SafeERC20.safeTransfer(IERC20(curQuote), to, IERC20(curQuote).tokenBalanceOf(address(this)));
        }
    }

    function sellQuote(address to, address pool, bytes memory) external override {
        address curQuote = IDODOV1(pool)._QUOTE_TOKEN_();
        uint256 curAmountIn = IERC20(curQuote).tokenBalanceOf(address(this));
        IERC20(curQuote).universalApproveMax(pool, curAmountIn);
        uint256 canBuyBaseAmount = IDODOSellHelper(_DODO_SELL_HELPER_).querySellQuoteToken(
            pool,
            curAmountIn
        );
        IDODOV1(pool).buyBaseToken(canBuyBaseAmount, curAmountIn, "");
        if(to != address(this)) {
            address curBase = IDODOV1(pool)._BASE_TOKEN_();
            SafeERC20.safeTransfer(IERC20(curBase), to, canBuyBaseAmount);
        }
    }
}