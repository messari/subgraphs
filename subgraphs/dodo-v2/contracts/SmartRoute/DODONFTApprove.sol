/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {IERC721} from "../intf/IERC721.sol";
import {IERC1155} from "../intf/IERC1155.sol";
import {InitializableOwnable} from "../lib/InitializableOwnable.sol";

/**
 * @title DODONFTApprove
 * @author DODO Breeder
 *
 * @notice Handle NFT authorizations in DODO platform
 */
contract DODONFTApprove is InitializableOwnable {
    
    // ============ Storage ============
    uint256 private constant _TIMELOCK_DURATION_ = 3 days;
    mapping (address => bool) public _IS_ALLOWED_PROXY_;
    uint256 public _TIMELOCK_;
    address public _PENDING_ADD_DODO_PROXY_;

    // ============ Events ============
    event AddDODOProxy(address dodoProxy);
    event RemoveDODOProxy(address oldProxy);

    // ============ Modifiers ============
    modifier notLocked() {
        require(
            _TIMELOCK_ <= block.timestamp,
            "AddProxy is timelocked"
        );
        _;
    }

    function init(address owner, address[] memory proxies) external {
        initOwner(owner);
        for(uint i = 0; i < proxies.length; i++) 
            _IS_ALLOWED_PROXY_[proxies[i]] = true;
    }

    function unlockAddProxy(address newDodoProxy) external onlyOwner {
        _TIMELOCK_ = block.timestamp + _TIMELOCK_DURATION_;
        _PENDING_ADD_DODO_PROXY_ = newDodoProxy;
    }

    function lockAddProxy() public onlyOwner {
       _PENDING_ADD_DODO_PROXY_ = address(0);
       _TIMELOCK_ = 0;
    }


    function addDODOProxy() external onlyOwner notLocked() {
        _IS_ALLOWED_PROXY_[_PENDING_ADD_DODO_PROXY_] = true;
        lockAddProxy();
        emit AddDODOProxy(_PENDING_ADD_DODO_PROXY_);
    }

    function removeDODOProxy (address oldDodoProxy) external onlyOwner {
        _IS_ALLOWED_PROXY_[oldDodoProxy] = false;
        emit RemoveDODOProxy(oldDodoProxy);
    }


    function claimERC721(
        address nftContract,
        address who,
        address dest,
        uint256 tokenId
    ) external {
        require(_IS_ALLOWED_PROXY_[msg.sender], "DODONFTApprove:Access restricted");
        IERC721(nftContract).safeTransferFrom(who, dest, tokenId);
    }

    function claimERC1155(
        address nftContract,
        address who,
        address dest,
        uint256 tokenId,
        uint256 amount
    ) external {
        require(_IS_ALLOWED_PROXY_[msg.sender], "DODONFTApprove:Access restricted");
        IERC1155(nftContract).safeTransferFrom(who, dest, tokenId, amount, "");
    } 

    function claimERC1155Batch(
        address nftContract,
        address who,
        address dest,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external {
        require(_IS_ALLOWED_PROXY_[msg.sender], "DODONFTApprove:Access restricted");
        IERC1155(nftContract).safeBatchTransferFrom(who, dest, tokenIds, amounts, "");
    } 

    function isAllowedProxy(address _proxy) external view returns (bool) {
        return _IS_ALLOWED_PROXY_[_proxy];
    }
}
