// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TokenVault is AccessControl { 
    IERC20 public token;
    bytes32 public constant VAULT_OWNER_ROLE = keccak256("VAULT_OWNER_ROLE");
    bytes32 public constant VAULT_TRANSFER_ROLE = keccak256("VAULT_TRANSFER_ROLE");
    event Transfer(address indexed recipient, uint256 amount);

    constructor(IERC20 _token, address _multisig) {
        token = _token;

        _setRoleAdmin(DEFAULT_ADMIN_ROLE, VAULT_OWNER_ROLE);
        _setRoleAdmin(VAULT_OWNER_ROLE, VAULT_OWNER_ROLE);
        
        _grantRole(VAULT_OWNER_ROLE, _multisig);
        _grantRole(VAULT_TRANSFER_ROLE, msg.sender);
    }

    function transfer(address _recipient, uint256 _amount) public onlyRole(VAULT_TRANSFER_ROLE) {
        require(token.transfer(_recipient, _amount), "Transfer failed");
        emit Transfer(_recipient, _amount);
    }

    function getBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function grantRole(bytes32 role, address account) public override onlyRole(VAULT_OWNER_ROLE) {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public override onlyRole(VAULT_OWNER_ROLE) {
        _revokeRole(role, account);
    }
}