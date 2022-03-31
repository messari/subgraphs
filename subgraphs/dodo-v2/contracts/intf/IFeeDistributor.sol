/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

interface IFeeDistributor {
    function init(
      address baseToken,
      address quoteToken,
      address stakeToken
    ) external;

    function stake(address to) external;

    function _STAKE_TOKEN_() external view returns(address);

    function _STAKE_VAULT_() external view returns(address);

}
