/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {IGambit} from "../intf/IGambit.sol";
import {IDODOAdapter} from "../intf/IDODOAdapter.sol";

contract GambitAdapter is IDODOAdapter {

    function _gambitSwap(address to, address pool, bytes memory moreInfo) internal {
        (address tokenIn, address tokenOut) = abi.decode(moreInfo, (address, address));

        IGambit(pool).swap(tokenIn, tokenOut, to);
    }

    function sellBase(address to, address pool, bytes memory moreInfo) external override {
        _gambitSwap(to, pool, moreInfo);
    }

    function sellQuote(address to, address pool, bytes memory moreInfo) external override {
        _gambitSwap(to, pool, moreInfo);
    }
}