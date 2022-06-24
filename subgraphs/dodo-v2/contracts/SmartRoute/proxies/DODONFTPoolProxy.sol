/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeMath} from "../../lib/SafeMath.sol";
import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {ICloneFactory} from "../../lib/CloneFactory.sol";
import {ReentrancyGuard} from "../../lib/ReentrancyGuard.sol";
import {IFilter} from "../../NFTPool/intf/IFilter.sol";
import {IFilterAdmin} from "../../NFTPool/intf/IFilterAdmin.sol";
import {IDODONFTApprove} from "../../intf/IDODONFTApprove.sol";
import {IERC20} from "../../intf/IERC20.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";

contract DODONFTPoolProxy is InitializableOwnable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ Storage ============
    address constant _ETH_ADDRESS_ = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    mapping(uint256 => address) public _FILTER_TEMPLATES_;
    address public _FILTER_ADMIN_TEMPLATE_;
    address public _MAINTAINER_;
    address public _CONTROLLER_;
    address public immutable _CLONE_FACTORY_;
    address public immutable _DODO_NFT_APPROVE_;
    address public immutable _DODO_APPROVE_;

    mapping (address => bool) public isWhiteListed;

    // ============ Event ==============
    event SetFilterTemplate(uint256 idx, address filterTemplate);
    event Erc721In(address filter, address to, uint256 received);
    event Erc1155In(address filter, address to, uint256 received);

    event CreateLiteNFTPool(address newFilterAdmin, address filterAdminOwner);
    event CreateNFTPool(address newFilterAdmin, address filterAdminOwner, address filter);
    event CreateFilterV1(address newFilterAdmin, address newFilterV1, address nftCollection, uint256 filterTemplateKey);
    event Erc721toErc20(address nftContract, uint256 tokenId, address toToken, uint256 returnAmount);

    event ChangeMaintainer(address newMaintainer);
    event ChangeContoller(address newController);
    event ChangeFilterAdminTemplate(address newFilterAdminTemplate);
    event ChangeWhiteList(address contractAddr, bool isAllowed);

    constructor(
        address cloneFactory,
        address filterAdminTemplate,
        address controllerModel,
        address defaultMaintainer,
        address dodoNftApprove,
        address dodoApprove
    ) public {
        _CLONE_FACTORY_ = cloneFactory;
        _FILTER_ADMIN_TEMPLATE_ = filterAdminTemplate;
        _CONTROLLER_ = controllerModel;
        _MAINTAINER_ = defaultMaintainer;
        _DODO_NFT_APPROVE_ = dodoNftApprove;
        _DODO_APPROVE_ = dodoApprove;
    }

    // ================ ERC721 In and Out ===================
    function erc721In(
        address filter,
        address nftCollection,
        uint256[] memory tokenIds,
        address to,
        uint256 minMintAmount
    ) external {
        for(uint256 i = 0; i < tokenIds.length; i++) {
            require(IFilter(filter).isNFTValid(nftCollection,tokenIds[i]), "NOT_REGISTRIED");
            IDODONFTApprove(_DODO_NFT_APPROVE_).claimERC721(nftCollection, msg.sender, filter, tokenIds[i]);
        }
        uint256 received = IFilter(filter).ERC721In(tokenIds, to);
        require(received >= minMintAmount, "MINT_AMOUNT_NOT_ENOUGH");

        emit Erc721In(filter, to, received);
    }

    // ================== ERC1155 In and Out ===================
    function erc1155In(
        address filter,
        address nftCollection,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        address to,
        uint256 minMintAmount
    ) external {
        for(uint256 i = 0; i < tokenIds.length; i++) {
            require(IFilter(filter).isNFTValid(nftCollection,tokenIds[i]), "NOT_REGISTRIED");
        }
        IDODONFTApprove(_DODO_NFT_APPROVE_).claimERC1155Batch(nftCollection, msg.sender, filter, tokenIds, amounts);
        uint256 received = IFilter(filter).ERC1155In(tokenIds, to);
        require(received >= minMintAmount, "MINT_AMOUNT_NOT_ENOUGH");

        emit Erc1155In(filter, to, received);
    }

    // ================== Create NFTPool ===================
    function createLiteNFTPool(
        address filterAdminOwner,
        string[] memory infos, // 0 => fragName, 1 => fragSymbol
        uint256[] memory numParams //0 - initSupply, 1 - fee
    ) external returns(address newFilterAdmin) {
        newFilterAdmin = ICloneFactory(_CLONE_FACTORY_).clone(_FILTER_ADMIN_TEMPLATE_);
        
        address[] memory filters = new address[](0);
        
        IFilterAdmin(newFilterAdmin).init(
            filterAdminOwner, 
            numParams[0],
            infos[0],
            infos[1],
            numParams[1],
            _CONTROLLER_,
            _MAINTAINER_,
            filters
        );

        emit CreateLiteNFTPool(newFilterAdmin, filterAdminOwner);
    }



    function createNewNFTPoolV1(
        address filterAdminOwner,
        address nftCollection,
        uint256 filterKey, //1 => FilterERC721V1, 2 => FilterERC1155V1
        string[] memory infos, // 0 => filterName, 1 => fragName, 2 => fragSymbol
        uint256[] memory numParams,//0 - initSupply, 1 - fee
        bool[] memory toggles,
        uint256[] memory filterNumParams, //0 - startId, 1 - endId, 2 - maxAmount, 3 - minAmount
        uint256[] memory priceRules,
        uint256[] memory spreadIds
    ) external returns(address newFilterAdmin) {
        newFilterAdmin = ICloneFactory(_CLONE_FACTORY_).clone(_FILTER_ADMIN_TEMPLATE_);

        address filterV1 = createFilterV1(
            filterKey,
            newFilterAdmin,
            nftCollection,
            toggles,
            infos[0],
            filterNumParams,
            priceRules,
            spreadIds
        );

        address[] memory filters = new address[](1);
        filters[0] = filterV1;
        
        IFilterAdmin(newFilterAdmin).init(
            filterAdminOwner, 
            numParams[0],
            infos[1],
            infos[2],
            numParams[1],
            _CONTROLLER_,
            _MAINTAINER_,
            filters
        );

        emit CreateNFTPool(newFilterAdmin, filterAdminOwner, filterV1);
    }

    // ================== Create Filter ===================
    function createFilterV1(
        uint256 key,
        address filterAdmin,
        address nftCollection,
        bool[] memory toggles,
        string memory filterName,
        uint256[] memory numParams, //0 - startId, 1 - endId, 2 - maxAmount, 3 - minAmount
        uint256[] memory priceRules,
        uint256[] memory spreadIds
    ) public returns(address newFilterV1) {
        newFilterV1 = ICloneFactory(_CLONE_FACTORY_).clone(_FILTER_TEMPLATES_[key]);

        emit CreateFilterV1(filterAdmin, newFilterV1, nftCollection, key);
        
        IFilter(newFilterV1).init(
            filterAdmin,
            nftCollection,
            toggles,
            filterName,
            numParams,
            priceRules,
            spreadIds
        );
    }


    // ================== NFT ERC20 Swap ======================
    function erc721ToErc20(
        address filterAdmin,
        address filter,
        address nftContract,
        uint256 tokenId,
        address toToken,
        address dodoProxy,
        bytes memory dodoSwapData
    ) 
        external
        preventReentrant
    {
        IDODONFTApprove(_DODO_NFT_APPROVE_).claimERC721(nftContract, msg.sender, filter, tokenId);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = tokenId;

        uint256 receivedFragAmount = IFilter(filter).ERC721In(tokenIds, address(this));

        _generalApproveMax(filterAdmin, _DODO_APPROVE_, receivedFragAmount);

        require(isWhiteListed[dodoProxy], "Not Whitelist Proxy Contract");
        (bool success, ) = dodoProxy.call(dodoSwapData);
        require(success, "API_SWAP_FAILED");

        uint256 returnAmount = _generalBalanceOf(toToken, address(this));

        _generalTransfer(toToken, msg.sender, returnAmount);

        emit Erc721toErc20(nftContract, tokenId, toToken, returnAmount);
    }
    

    //====================== Ownable ========================
    function changeMaintainer(address newMaintainer) external onlyOwner {
        _MAINTAINER_ = newMaintainer;
        emit ChangeMaintainer(newMaintainer);
    }

    function changeFilterAdminTemplate(address newFilterAdminTemplate) external onlyOwner {
        _FILTER_ADMIN_TEMPLATE_ = newFilterAdminTemplate;
        emit ChangeFilterAdminTemplate(newFilterAdminTemplate);
    }

    function changeController(address newController) external onlyOwner {
        _CONTROLLER_ = newController;
        emit ChangeContoller(newController);
    }

    function setFilterTemplate(uint256 idx, address newFilterTemplate) external onlyOwner {
        _FILTER_TEMPLATES_[idx] = newFilterTemplate;
        emit SetFilterTemplate(idx, newFilterTemplate);
    }

    function changeWhiteList(address contractAddr, bool isAllowed) external onlyOwner {
        isWhiteListed[contractAddr] = isAllowed;
        emit ChangeWhiteList(contractAddr, isAllowed);
    }

    //======================= Internal =====================
    function _generalApproveMax(
        address token,
        address to,
        uint256 amount
    ) internal {
        uint256 allowance = IERC20(token).allowance(address(this), to);
        if (allowance < amount) {
            if (allowance > 0) {
                IERC20(token).safeApprove(to, 0);
            }
            IERC20(token).safeApprove(to, uint256(-1));
        }
    }

    function _generalBalanceOf(
        address token, 
        address who
    ) internal view returns (uint256) {
        if (token == _ETH_ADDRESS_) {
            return who.balance;
        } else {
            return IERC20(token).balanceOf(who);
        }
    }

    function _generalTransfer(
        address token,
        address payable to,
        uint256 amount
    ) internal {
        if (amount > 0) {
            if (token == _ETH_ADDRESS_) {
                to.transfer(amount);
            } else {
                IERC20(token).safeTransfer(to, amount);
            }
        }
    }
}