/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.6.9;

import {IDODOAdapter} from "../intf/IDODOAdapter.sol";
import {ICurve} from "../intf/ICurve.sol";
import {IERC20} from "../../intf/IERC20.sol";
import {SafeMath} from "../../lib/SafeMath.sol";
import {UniversalERC20} from "../lib/UniversalERC20.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";

// for two tokens; to adapter like dodo V1
contract CurveAdapter is IDODOAdapter {
    using SafeMath for uint;
    using UniversalERC20 for IERC20;

    function _curveSwap(address to, address pool, bytes memory moreInfo) internal {
        (bool noLending, address fromToken, address toToken, int128 i, int128 j) = abi.decode(moreInfo, (bool, address, address, int128, int128));
        uint256 sellAmount = IERC20(fromToken).balanceOf(address(this));

        // approve
        IERC20(fromToken).universalApproveMax(pool, sellAmount);
        // swap
        if(noLending) {
            ICurve(pool).exchange(i, j, sellAmount, 0);
        } else {
            ICurve(pool).exchange_underlying(i, j, sellAmount, 0);
        }

        if(to != address(this)) {
            SafeERC20.safeTransfer(IERC20(toToken), to, IERC20(toToken).balanceOf(address(this)));
        }
    }

    function sellBase(address to, address pool, bytes memory moreInfo) external override {
        _curveSwap(to, pool, moreInfo);
    }

    function sellQuote(address to, address pool, bytes memory moreInfo) external override {
        _curveSwap(to, pool, moreInfo);
    }
}