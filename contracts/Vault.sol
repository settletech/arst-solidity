// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TokenVault is Ownable, AccessControl { 
    IERC20 public token;
    bytes32 public constant VAULTOWNER_ROLE = keccak256("VAULTOWNER_ROLE"); 
    event Transfer(address indexed recipient, uint256 amount);

    constructor(IERC20 _token) Ownable(msg.sender) {
        token = _token;
        _grantRole(VAULTOWNER_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function transfer(address _recipient, uint256 _amount) public onlyRole(VAULTOWNER_ROLE) { 
        require(token.transfer(_recipient, _amount), "Transfer failed");
        emit Transfer(_recipient, _amount);
    }

    function getBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function grantRole(bytes32 role, address account) public override onlyOwner {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public override onlyOwner {
        _revokeRole(role, account);
    }
}