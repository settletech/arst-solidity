// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MultiSigWallet {

    uint256 public numConfirmationsRequired;
    address[] public owners;
    //uint256 public activeOwners;
    mapping(address => bool) public blacklist;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        uint256 numConfirmations;
        uint256 deadline;
        bool executed;
    }

    Transaction[] public transactions;
    // mapping from tx index => owner => bool
    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    mapping(address => bool) public isOwner;
    mapping(address => uint256[]) public txOwner;
    
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
   
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier onlyContract() {
        require(address(this) == msg.sender, "only contract");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "tx already confirmed");
        _;
    }

    modifier notBlacklisted(address _address) {
        require(!blacklist[_address], "Address is blacklisted");
        _;
    }

    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) payable {
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0
                && _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        //activeOwners = _owners.length;
        numConfirmationsRequired = _numConfirmationsRequired;
    }

    function getBalance() external view returns (uint256){
        return address(this).balance;
    }
    
    receive() external payable {
        require(msg.value > 0, "msg.value < 0");
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(address _to, uint256 _value, bytes memory _data) public onlyOwner returns (uint256 transactionId) {
        uint256 txIndex = transactions.length;
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            numConfirmations: 1,
            deadline: block.timestamp + 5 days
        }));
        isConfirmed[txIndex][msg.sender] = true;

        txOwner[msg.sender].push(txIndex);

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
        return txIndex;
    }

    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        require(transaction.deadline > block.timestamp, "transaction outdated");
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        require(transaction.deadline > block.timestamp, "transaction outdated");
        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "Not enough confirmations"
        );

        transaction.executed = true;
       
        (bool success, ) = address(transaction.to).call{value: transaction.value}(transaction.data);
        require(success, "tx failed");
        
        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        require(transaction.deadline > block.timestamp, "transaction outdated");
        require(isConfirmed[_txIndex][msg.sender], "tx not confirmed");

        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getActiveOwners() public view returns (address[] memory) {
        return owners;
    }

    // Functions for owner management
    function addOwner(address _owner) notBlacklisted(_owner) public onlyContract { 
        require(_owner != address(0), "invalid owner");
        require(!isOwner[_owner], "owner not unique");

        isOwner[_owner] = true;
        //activeOwners++;
        owners.push(_owner);
    }

    /*function removeOwner(address _owner) public onlyContract {
        require(activeOwners > numConfirmationsRequired, "owner cannot be removed");
        require(isOwner[_owner], "not owner");

        activeOwners--;
        isOwner[_owner] = false;
    } */

    function removeOwner(address _owner) public onlyContract {
        require(owners.length > numConfirmationsRequired, "owner cannot be removed");
        require(isOwner[_owner], "not owner");

        //activeOwners--;
        isOwner[_owner] = false;

        // Get Owners Array Index
        uint256 ownerIndex;
        for (uint256 i = 0; i < owners.length;  i++) {
            if (owners[i] == _owner) {
                ownerIndex = i;
                break;
            }
        }

        // Owner is deleted from owners array.
        // address temp = owners[owners.length - 1];
        //owners[owners.length - 1] = owners[ownerIndex];
        owners[ownerIndex] = owners[owners.length - 1];
        owners.pop();

        // Get transactions not executed and less than five days.
        uint256 txSize = transactions.length;
        //if(txSize > 0){
            Transaction storage transaction;
            for (uint256 i = txSize; i > 0; i--){
                transaction = transactions[i-1];
                if(transaction.deadline > block.timestamp){
                    if(isConfirmed[i-1][_owner] && !transaction.executed) {
                        transaction.numConfirmations--;
                    }
                }
                else {
                    break;
                }
            }
        //}

        blacklist[_owner] = true;
    }

    function changeRequirement(uint256 _numConfirmationsRequired) public onlyContract {
        require(_numConfirmationsRequired > 0, "confirmations required"); 
        require(_numConfirmationsRequired <= owners.length, "invalid number of required confirmations");
        numConfirmationsRequired = _numConfirmationsRequired;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getTxsOwner(address _owner) public view returns(uint256[] memory) {
        return txOwner[_owner];
    }

    function getTransaction(uint256 _txIndex)
        public
        view
        txExists(_txIndex)
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations,
            uint256 deadline
        )
    {
        Transaction memory transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations,
            transaction.deadline
        );
    }
}
