/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

interface IController {
    function getMintFeeRate(address filterAdminAddr) external view returns (uint256);

    function getBurnFeeRate(address filterAdminAddr) external view returns (uint256);

    function isEmergencyWithdrawOpen(address filter) external view returns (bool);
}
