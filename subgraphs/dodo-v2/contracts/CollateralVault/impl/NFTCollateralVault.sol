/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {SafeMath} from "../../lib/SafeMath.sol";
import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {IERC721} from "../../intf/IERC721.sol";
import {IERC721Receiver} from "../../intf/IERC721Receiver.sol";
import {IERC1155} from "../../intf/IERC1155.sol";
import {IERC1155Receiver} from "../../intf/IERC1155Receiver.sol";
import {ReentrancyGuard} from "../../lib/ReentrancyGuard.sol";


contract NFTCollateralVault is InitializableOwnable, IERC721Receiver, IERC1155Receiver, ReentrancyGuard {
    using SafeMath for uint256;

    // ============ Storage ============
    string public name;
    string public baseURI;

    function init(
        address owner,
        string memory _name,
        string memory _baseURI
    ) external {
        initOwner(owner);
        name = _name;
        baseURI = _baseURI;
    }

    // ============ Event ============
    event RemoveNftToken(address nftContract, uint256 tokenId, uint256 amount);
    event AddNftToken(address nftContract, uint256 tokenId, uint256 amount);

    // ============ TransferFrom NFT ============
    function depositERC721(address nftContract, uint256[] memory tokenIds) public {
        require(nftContract != address(0), "DODONftVault: ZERO_ADDRESS");
        for(uint256 i = 0; i < tokenIds.length; i++) {
            IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenIds[i]);
            // emit AddNftToken(nftContract, tokenIds[i], 1);
        }
    }

    function depoistERC1155(address nftContract, uint256[] memory tokenIds, uint256[] memory amounts) public {
        require(nftContract != address(0), "DODONftVault: ZERO_ADDRESS");
        require(tokenIds.length == amounts.length, "PARAMS_NOT_MATCH");
        IERC1155(nftContract).safeBatchTransferFrom(msg.sender, address(this), tokenIds, amounts, "");
        // for(uint256 i = 0; i < tokenIds.length; i++) {
        //     emit AddNftToken(nftContract, tokenIds[i], amounts[i]);
        // }
    }

    // ============ Ownable ============
    function directTransferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "DODONftVault: ZERO_ADDRESS");
        emit OwnershipTransferred(_OWNER_, newOwner);
        _OWNER_ = newOwner;
    }

    function createFragment(address nftProxy, bytes calldata data) external preventReentrant onlyOwner {
        require(nftProxy != address(0), "DODONftVault: PROXY_INVALID");
        _OWNER_ = nftProxy;
        (bool success,) = nftProxy.call(data);
        require(success, "DODONftVault: TRANSFER_OWNER_FAILED");
        emit OwnershipTransferred(_OWNER_, nftProxy);
    }

    function withdrawERC721(address nftContract, uint256[] memory tokenIds) external onlyOwner {
        require(nftContract != address(0), "DODONftVault: ZERO_ADDRESS");
        for(uint256 i = 0; i < tokenIds.length; i++) {
            IERC721(nftContract).safeTransferFrom(address(this), _OWNER_, tokenIds[i]);
            emit RemoveNftToken(nftContract, tokenIds[i], 1);
        }
    }

    function withdrawERC1155(address nftContract, uint256[] memory tokenIds, uint256[] memory amounts) external onlyOwner {
        require(nftContract != address(0), "DODONftVault: ZERO_ADDRESS");
        require(tokenIds.length == amounts.length, "PARAMS_NOT_MATCH");
        IERC1155(nftContract).safeBatchTransferFrom(address(this), _OWNER_, tokenIds, amounts, "");
        for(uint256 i = 0; i < tokenIds.length; i++) {
            emit RemoveNftToken(nftContract, tokenIds[i], amounts[i]);
        }
    }

    function supportsInterface(bytes4 interfaceId) public override view returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId
            || interfaceId == type(IERC721Receiver).interfaceId;
    }

    // ============ Callback ============
    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        emit AddNftToken(msg.sender, tokenId, 1);
        return IERC721Receiver.onERC721Received.selector;
    }

    function onERC1155Received(
        address,
        address,
        uint256 id,
        uint256 value,
        bytes calldata
    ) external override returns (bytes4){
        emit AddNftToken(msg.sender, id, value);
        return IERC1155Receiver.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata
    ) external override returns (bytes4){
        require(ids.length == values.length, "PARAMS_NOT_MATCH");
        for(uint256 i = 0; i < ids.length; i++) {
            emit AddNftToken(msg.sender, ids[i], values[i]);
        }
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }
}
