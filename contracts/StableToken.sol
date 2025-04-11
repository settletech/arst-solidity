// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract StableToken is ERC20, Pausable, Ownable, ERC20Permit {

    mapping(address => bool) public blacklist;
    address public custodyVault; 

    constructor(address _custodyVault)
        ERC20("ARST Finance", "ARST") 
        Ownable(_msgSender())
        ERC20Permit("ARST Finance")
    { 
        custodyVault = _custodyVault;
    }

    modifier notBlacklisted(address _address) {
        require(!blacklist[_address], "Address is blacklisted");
        _;
    }

    function transferOwnership(address newOwner)
        public
        override
        onlyOwner
        notBlacklisted(newOwner)
    {
        require(newOwner != address(0), "Invalid new owner address");
        _transferOwnership(newOwner);
    }

    function transfer(address recipient, uint256 amount)
        public
        virtual
        override
        whenNotPaused
        notBlacklisted(msg.sender)
        notBlacklisted(recipient)
        returns (bool)
    {
        super._transfer(_msgSender(), recipient, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual 
            override 
            whenNotPaused 
            notBlacklisted(msg.sender)
            notBlacklisted(sender)
            notBlacklisted(recipient) 
            returns (bool) 
    {
        super.transferFrom(sender, recipient, amount);
        return true;
    }

    function mint(address to, uint256 amount) 
        whenNotPaused 
        notBlacklisted(to) 
        public 
        onlyOwner 
    {
        super._mint(to, amount);
    }

    // Only called by settle even if paused.
    function burn(uint256 _amount) 
        public 
        onlyOwner 
    {
        require(_amount > 0, "amount should be greater than zero");
        super._burn(msg.sender, _amount);
    }
    
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setCustodyVault(address _vault) 
        external 
        onlyOwner 
    {
        require(_vault != address(0), "Invalid vault address");
        custodyVault = _vault;
    }

    function setBlacklistStatus(address _target, bool _status)
        public 
        onlyOwner 
    {
        require(blacklist[_target] != _status, "Only new status");
        blacklist[_target] = _status;
    }

    function transferFromBlacklisted(address _from, uint256 _amount)
        public 
        onlyOwner
        returns (bool)
    {
        require(blacklist[_from], "Address is not blacklisted");
        require(custodyVault != address(0), "Custody Vault not set");
        require(_amount > 0, "Amount should be greater than zero");
        require(balanceOf(_from) >= _amount, "Insufficient balance");

        super._transfer(_from, custodyVault, _amount);
        return true;
    }
}
