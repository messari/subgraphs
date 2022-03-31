/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {IDVM} from "../../DODOVendingMachine/intf/IDVM.sol";
import {IFragment} from "../../GeneralizedFragment/intf/IFragment.sol";

interface IDODONFTRegistry {
    function addRegistry(
        address vault,
        address fragment, 
        address quoteToken,
        address dvm
    ) external;

    function removeRegistry(address fragment) external;
}

/**
 * @title DODONFT Registry
 * @author DODO Breeder
 *
 * @notice Register DODONFT Pools 
 */
contract DODONFTRegistry is InitializableOwnable, IDODONFTRegistry {

    mapping (address => bool) public isAdminListed;
    
    // ============ Registry ============
    // Vault -> Frag
    mapping(address => address) public _VAULT_FRAG_REGISTRY_;

    // base -> quote -> DVM address list
    mapping(address => mapping(address => address[])) public _REGISTRY_;

    // ============ Events ============

    event NewRegistry(
        address vault,
        address fragment,
        address dvm
    );

    event RemoveRegistry(address fragment);


    // ============ Admin Operation Functions ============

    function addRegistry(
        address vault,
        address fragment, 
        address quoteToken,
        address dvm
    ) override external {
        require(isAdminListed[msg.sender], "ACCESS_DENIED");
        _VAULT_FRAG_REGISTRY_[vault] = fragment;
        _REGISTRY_[fragment][quoteToken].push(dvm);
        emit NewRegistry(vault, fragment, dvm);
    }

    function removeRegistry(address fragment) override external {
        require(isAdminListed[msg.sender], "ACCESS_DENIED");
        address vault = IFragment(fragment)._COLLATERAL_VAULT_();
        address dvm = IFragment(fragment)._DVM_();

        _VAULT_FRAG_REGISTRY_[vault] = address(0);

        address quoteToken = IDVM(dvm)._QUOTE_TOKEN_();
        address[] memory registryList = _REGISTRY_[fragment][quoteToken];
        for (uint256 i = 0; i < registryList.length; i++) {
            if (registryList[i] == dvm) {
                if(i != registryList.length - 1) {
                    _REGISTRY_[fragment][quoteToken][i] = _REGISTRY_[fragment][quoteToken][registryList.length - 1];
                }                
                _REGISTRY_[fragment][quoteToken].pop();
                break;
            }
        }

        emit RemoveRegistry(fragment);
    }

    function addAdminList (address contractAddr) external onlyOwner {
        isAdminListed[contractAddr] = true;
    }

    function removeAdminList (address contractAddr) external onlyOwner {
        isAdminListed[contractAddr] = false;
    }

    function getDODOPool(address baseToken, address quoteToken)
        external
        view
        returns (address[] memory pools)
    {
        return _REGISTRY_[baseToken][quoteToken];
    }

    function getDODOPoolBidirection(address token0, address token1)
        external
        view
        returns (address[] memory baseToken0Pool, address[] memory baseToken1Pool)
    {
        return (_REGISTRY_[token0][token1], _REGISTRY_[token1][token0]);
    }
}
