/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;


interface IFragment {

    function init(
      address dvm, 
      address vaultPreOwner,
      address collateralVault,
      uint256 totalSupply, 
      uint256 ownerRatio,
      uint256 buyoutTimestamp,
      address defaultMaintainer,
      address buyoutModel,
      uint256 distributionRatio,
      string memory fragSymbol
    ) external;

    function buyout(address newVaultOwner) external;

    function redeem(address to) external;

    function _QUOTE_() external view returns (address);

    function _COLLATERAL_VAULT_() external view returns (address);

    function _DVM_() external view returns (address);

    function totalSupply() external view returns (uint256);
}
