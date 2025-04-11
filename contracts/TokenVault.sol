// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TokenVault is AccessControl { 
    IERC20 public token;
    bytes32 public constant VAULT_OWNER_ROLE = keccak256("VAULT_OWNER_ROLE");
    bytes32 public constant VAULT_TRANSFER_ROLE = keccak256("VAULT_TRANSFER_ROLE");
    event Transfer(address indexed recipient, uint256 amount);

    constructor(address _multisig) {
        _setRoleAdmin(DEFAULT_ADMIN_ROLE, VAULT_OWNER_ROLE);
        _setRoleAdmin(VAULT_OWNER_ROLE, VAULT_OWNER_ROLE);
        
        _grantRole(VAULT_OWNER_ROLE, _multisig);
        _grantRole(VAULT_TRANSFER_ROLE, msg.sender);
    }

    function transfer(address _token, address _recipient, uint256 _amount) public onlyRole(VAULT_TRANSFER_ROLE) {
        require(_token != address(0), "Address zero");
        require(IERC20(_token).transfer(_recipient, _amount), "Transfer failed");
        emit Transfer(_recipient, _amount);
    }

    function getBalance(address _token) public view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    function grantRole(bytes32 role, address account) public override onlyRole(VAULT_OWNER_ROLE) {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public override onlyRole(VAULT_OWNER_ROLE) {
        _revokeRole(role, account);
    }
}