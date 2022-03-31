/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

interface IDODOAdapter {
    
    function sellBase(address to, address pool, bytes memory data) external;

    function sellQuote(address to, address pool, bytes memory data) external;
}
