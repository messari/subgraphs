/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {IDODOV2} from "../intf/IDODOV2.sol";
import {IDODOAdapter} from "../intf/IDODOAdapter.sol";

contract DODOV2Adapter is IDODOAdapter {
    function sellBase(address to, address pool, bytes memory) external override {
        IDODOV2(pool).sellBase(to);
    }

    function sellQuote(address to, address pool, bytes memory) external override {
        IDODOV2(pool).sellQuote(to);
    }
}