/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeMath} from "../../lib/SafeMath.sol";
import {IFilterAdmin} from "../intf/IFilterAdmin.sol";
import {IController} from "../intf/IController.sol";
import {IERC721} from "../../intf/IERC721.sol";
import {IERC721Receiver} from "../../intf/IERC721Receiver.sol";
import {DecimalMath} from "../../lib/DecimalMath.sol";
import {ReentrancyGuard} from "../../lib/ReentrancyGuard.sol";
import {BaseFilterV1} from "./BaseFilterV1.sol";

contract FilterERC721V1 is IERC721Receiver, BaseFilterV1 {
    using SafeMath for uint256;

    //============== Event =================
    event FilterInit(address filterAdmin, address nftCollection, string name);
    event NftIn(uint256 tokenId);
    event TargetOut(uint256 tokenId);
    event RandomOut(uint256 tokenId);
    event EmergencyWithdraw(address nftContract,uint256 tokenId, address to);

    function init(
        address filterAdmin,
        address nftCollection,
        bool[] memory toggles,
        string memory filterName,
        uint256[] memory numParams, //0 - startId, 1 - endId, 2 - maxAmount, 3 - minAmount
        uint256[] memory priceRules,
        uint256[] memory spreadIds
    ) external {
        initOwner(filterAdmin);

        _changeFilterName(filterName);
        _NFT_COLLECTION_ = nftCollection;
        _changeNFTInPrice(priceRules[0], priceRules[1], toggles[0]);
        _changeNFTRandomOutPrice(priceRules[2], priceRules[3], toggles[1]);
        _changeNFTTargetOutPrice(priceRules[4], priceRules[5], toggles[2]);

        _changeNFTAmountRange(numParams[2], numParams[3]);

        _changeTokenIdRange(numParams[0], numParams[1]);
        for (uint256 i = 0; i < spreadIds.length; i++) {
            _SPREAD_IDS_REGISTRY_[spreadIds[i]] = true;
            emit ChangeTokenIdMap(spreadIds[i], true);
        }

        emit FilterInit(filterAdmin, nftCollection, filterName);
    }

    // ================= Trading ================

    function ERC721In(uint256[] memory tokenIds, address to)
        external
        preventReentrant
        returns (uint256 received)
    {
        require(tokenIds.length <= getAvaliableNFTInAmount(), "EXCEDD_IN_AMOUNT");
        uint256 originTotalNftAmount = _TOTAL_NFT_AMOUNT_;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(isNFTIDValid(tokenId), "NFT_ID_NOT_SUPPORT");
            require(
                _NFT_RESERVE_[tokenId] == 0 &&
                    IERC721(_NFT_COLLECTION_).ownerOf(tokenId) == address(this),
                "NFT_NOT_SEND"
            );
            _NFT_IDS_.push(tokenId);
            _TOKENID_IDX_[tokenId] = _NFT_IDS_.length;
            _NFT_RESERVE_[tokenId] = 1;

            emit NftIn(tokenId);
        }
        _TOTAL_NFT_AMOUNT_ = _NFT_IDS_.length;
        (uint256 rawReceive, ) = _queryNFTIn(originTotalNftAmount, originTotalNftAmount + tokenIds.length);
        received = IFilterAdmin(_OWNER_).mintFragTo(to, rawReceive);

        emit NftInOrder(to, received);
    }

    function ERC721TargetOut(uint256[] memory tokenIds, address to, uint256 maxBurnAmount)
        external
        preventReentrant
        returns (uint256 paid)
    {
        (uint256 rawPay, ) = queryNFTTargetOut(tokenIds.length);
        paid = IFilterAdmin(_OWNER_).burnFragFrom(msg.sender, rawPay);
        require(paid <= maxBurnAmount, "BURN_AMOUNT_EXCEED");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            _transferOutERC721(to, tokenIds[i]);

            emit TargetOut(tokenIds[i]);
        }
        _TOTAL_NFT_AMOUNT_ = _NFT_IDS_.length;

        emit TargetOutOrder(msg.sender, paid);
    }

    function ERC721RandomOut(uint256 amount, address to, uint256 maxBurnAmount)
        external
        preventReentrant
        returns (uint256 paid)
    {
        (uint256 rawPay, ) = queryNFTRandomOut(amount);
        paid = IFilterAdmin(_OWNER_).burnFragFrom(msg.sender, rawPay);
        require(paid <= maxBurnAmount, "BURN_AMOUNT_EXCEED");
        for (uint256 i = 0; i < amount; i++) {
            uint256 index = _getRandomNum() % _NFT_IDS_.length;
            uint256 tokenId = _NFT_IDS_[index];
            _transferOutERC721(to, tokenId);
            emit RandomOut(tokenId);
        }
        _TOTAL_NFT_AMOUNT_ = _NFT_IDS_.length;

        emit RandomOutOrder(msg.sender, paid);
    }

    // ============ Transfer =============

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function _transferOutERC721(address to, uint256 tokenId) internal {
        require(_TOKENID_IDX_[tokenId] > 0, "TOKENID_NOT_EXIST");
        uint256 index = _TOKENID_IDX_[tokenId] - 1;
        require(index < _NFT_IDS_.length, "INDEX_INVALID");
        IERC721(_NFT_COLLECTION_).safeTransferFrom(address(this), to, tokenId);
        if(index != _NFT_IDS_.length - 1) {
            uint256 lastTokenId = _NFT_IDS_[_NFT_IDS_.length - 1];
            _NFT_IDS_[index] = lastTokenId;
            _TOKENID_IDX_[lastTokenId] = index + 1;
        }
        _NFT_IDS_.pop();
        _NFT_RESERVE_[tokenId] = 0;
        _TOKENID_IDX_[tokenId] = 0;
    }

    function emergencyWithdraw(
        address[] memory nftContract,
        uint256[] memory tokenIds,
        address to
    ) external onlySuperOwner {
        require(nftContract.length == tokenIds.length, "PARAM_INVALID");
        address controller = IFilterAdmin(_OWNER_)._CONTROLLER_();
        require(
            IController(controller).isEmergencyWithdrawOpen(address(this)),
            "EMERGENCY_WITHDRAW_NOT_OPEN"
        );

        for (uint256 i = 0; i < nftContract.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (_NFT_RESERVE_[tokenId] > 0 && nftContract[i] == _NFT_COLLECTION_) {
                uint256 index = getNFTIndexById(tokenId);
                if(index != _NFT_IDS_.length - 1) {
                    uint256 lastTokenId = _NFT_IDS_[_NFT_IDS_.length - 1];
                    _NFT_IDS_[index] = lastTokenId;
                    _TOKENID_IDX_[lastTokenId] = index + 1;
                }
                _NFT_IDS_.pop();
                _NFT_RESERVE_[tokenId] = 0;
                _TOKENID_IDX_[tokenId] = 0;
            }
            IERC721(nftContract[i]).safeTransferFrom(address(this), to, tokenIds[i]);
            emit EmergencyWithdraw(nftContract[i],tokenIds[i],to);
        }
        _TOTAL_NFT_AMOUNT_ = _NFT_IDS_.length;
    }

    // ============ Support ============

    function supportsInterface(bytes4 interfaceId) public view returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId;
    }

    function version() external pure virtual returns (string memory) {
        return "FILTER_1_ERC721 1.0.0";
    }
}
