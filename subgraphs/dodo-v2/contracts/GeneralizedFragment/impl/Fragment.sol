/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {SafeMath} from "../../lib/SafeMath.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";
import {DecimalMath} from "../../lib/DecimalMath.sol";
import {IDVM} from "../../DODOVendingMachine/intf/IDVM.sol";
import {IDODOCallee} from "../../intf/IDODOCallee.sol";
import {IERC20} from "../../intf/IERC20.sol";
import {InitializableFragERC20} from "../../external/ERC20/InitializableFragERC20.sol";
import {ICollateralVault} from "../../CollateralVault/intf/ICollateralVault.sol";

interface IBuyoutModel {
  function getBuyoutStatus(address fragAddr, address user) external view returns (int);
}

contract Fragment is InitializableFragERC20 {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ Storage ============
    
    bool public _IS_BUYOUT_;
    uint256 public _BUYOUT_TIMESTAMP_;
    uint256 public _BUYOUT_PRICE_;
    uint256 public _DISTRIBUTION_RATIO_;

    address public _COLLATERAL_VAULT_;
    address public _VAULT_PRE_OWNER_;
    address public _QUOTE_;
    address public _DVM_;
    address public _DEFAULT_MAINTAINER_;
    address public _BUYOUT_MODEL_;

    bool internal _FRAG_INITIALIZED_;

    // ============ Event ============
    event RemoveNftToken(address nftContract, uint256 tokenId, uint256 amount);
    event AddNftToken(address nftContract, uint256 tokenId, uint256 amount);
    event InitInfo(address vault, string name, string baseURI);
    event CreateFragment();
    event Buyout(address newOwner);
    event Redeem(address sender, uint256 baseAmount, uint256 quoteAmount);


    function init(
      address dvm, 
      address vaultPreOwner,
      address collateralVault,
      uint256 _totalSupply, 
      uint256 ownerRatio,
      uint256 buyoutTimestamp,
      address defaultMaintainer,
      address buyoutModel,
      uint256 distributionRatio,
      string memory _symbol
    ) external {
        require(!_FRAG_INITIALIZED_, "DODOFragment: ALREADY_INITIALIZED");
        _FRAG_INITIALIZED_ = true;

        // init local variables
        _DVM_ = dvm;
        _QUOTE_ = IDVM(_DVM_)._QUOTE_TOKEN_();
        _VAULT_PRE_OWNER_ = vaultPreOwner;
        _COLLATERAL_VAULT_ = collateralVault;
        _BUYOUT_TIMESTAMP_ = buyoutTimestamp;
        _DEFAULT_MAINTAINER_ = defaultMaintainer;
        _BUYOUT_MODEL_ = buyoutModel;
        _DISTRIBUTION_RATIO_ = distributionRatio;

        // init FRAG meta data
        name = string(abi.encodePacked("DODO_FRAG_", _symbol));
        // symbol = string(abi.encodePacked("d_", _symbol));
        symbol = _symbol;
        super.init(address(this), _totalSupply, name, symbol);

        // init FRAG distribution
        uint256 vaultPreOwnerBalance = DecimalMath.mulFloor(_totalSupply, ownerRatio);
        uint256 distributionBalance = DecimalMath.mulFloor(vaultPreOwnerBalance, distributionRatio);
        
        if(distributionBalance > 0) _transfer(address(this), _DEFAULT_MAINTAINER_, distributionBalance);
        _transfer(address(this), _VAULT_PRE_OWNER_, vaultPreOwnerBalance.sub(distributionBalance));
        _transfer(address(this), _DVM_, _totalSupply.sub(vaultPreOwnerBalance));

        // init DVM liquidity
        IDVM(_DVM_).buyShares(address(this));
    }


    function buyout(address newVaultOwner) external {
        require(_BUYOUT_TIMESTAMP_ != 0, "DODOFragment: NOT_SUPPORT_BUYOUT");
        require(block.timestamp > _BUYOUT_TIMESTAMP_, "DODOFragment: BUYOUT_NOT_START");
        require(!_IS_BUYOUT_, "DODOFragment: ALREADY_BUYOUT");

        int buyoutFee = IBuyoutModel(_BUYOUT_MODEL_).getBuyoutStatus(address(this), newVaultOwner);
        require(buyoutFee != -1, "DODOFragment: USER_UNABLE_BUYOUT");

        _IS_BUYOUT_ = true;
      
        _BUYOUT_PRICE_ = IDVM(_DVM_).getMidPrice();
        uint256 requireQuote = DecimalMath.mulCeil(_BUYOUT_PRICE_, totalSupply);
        uint256 payQuote = IERC20(_QUOTE_).balanceOf(address(this));
        require(payQuote >= requireQuote, "DODOFragment: QUOTE_NOT_ENOUGH");

        IDVM(_DVM_).sellShares(
          IERC20(_DVM_).balanceOf(address(this)),
          address(this),
          0,
          0,
          "",
          uint256(-1)
        ); 

        uint256 redeemFrag = totalSupply.sub(balances[address(this)]).sub(balances[_VAULT_PRE_OWNER_]);
        uint256 ownerQuoteWithoutFee = IERC20(_QUOTE_).balanceOf(address(this)).sub(DecimalMath.mulCeil(_BUYOUT_PRICE_, redeemFrag));
        _clearBalance(address(this));
        _clearBalance(_VAULT_PRE_OWNER_);

        uint256 buyoutFeeAmount =  DecimalMath.mulFloor(ownerQuoteWithoutFee, uint256(buyoutFee));
      
        IERC20(_QUOTE_).safeTransfer(_DEFAULT_MAINTAINER_, buyoutFeeAmount);
        IERC20(_QUOTE_).safeTransfer(_VAULT_PRE_OWNER_, ownerQuoteWithoutFee.sub(buyoutFeeAmount));

        ICollateralVault(_COLLATERAL_VAULT_).directTransferOwnership(newVaultOwner);

        emit Buyout(newVaultOwner);
    }


    function redeem(address to, bytes calldata data) external {
        require(_IS_BUYOUT_, "DODOFragment: NEED_BUYOUT");

        uint256 baseAmount = balances[msg.sender];
        uint256 quoteAmount = DecimalMath.mulFloor(_BUYOUT_PRICE_, baseAmount);
        _clearBalance(msg.sender);
        IERC20(_QUOTE_).safeTransfer(to, quoteAmount);

        if (data.length > 0) {
          IDODOCallee(to).NFTRedeemCall(
            msg.sender,
            quoteAmount,
            data
          );
        }

        emit Redeem(msg.sender, baseAmount, quoteAmount);
    }

    function getBuyoutRequirement() external view returns (uint256 requireQuote){
        require(_BUYOUT_TIMESTAMP_ != 0, "NOT SUPPORT BUYOUT");
        require(!_IS_BUYOUT_, "ALREADY BUYOUT");
        uint256 price = IDVM(_DVM_).getMidPrice();
        requireQuote = DecimalMath.mulCeil(price, totalSupply);
    }

    function _clearBalance(address account) internal {
        uint256 clearBalance = balances[account];
        balances[account] = 0;
        balances[address(0)] = balances[address(0)].add(clearBalance);
        emit Transfer(account, address(0), clearBalance);
    }
}
