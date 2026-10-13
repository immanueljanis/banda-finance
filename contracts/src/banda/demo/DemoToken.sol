// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Valueless demo asset. No claim on securities, commodities or real USDC.
contract DemoToken {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    address public immutable issuer;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    constructor(string memory name_, string memory symbol_, uint8 decimals_, address issuer_) {
        require(issuer_ != address(0), "Demo: zero issuer");
        name = name_; symbol = symbol_; decimals = decimals_; issuer = issuer_;
    }
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount); return true;
    }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 available = allowance[from][msg.sender];
        if (available != type(uint256).max) {
            require(available >= amount, "Demo: allowance");
            allowance[from][msg.sender] = available - amount;
        }
        _transfer(from, to, amount); return true;
    }
    function mint(address to, uint256 amount) external {
        require(msg.sender == issuer, "Demo: issuer only"); _mint(to, amount);
    }
    function burn(uint256 amount) external {
        require(msg.sender == issuer, "Demo: issuer only");
        balanceOf[msg.sender] -= amount; totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "Demo: zero recipient");
        totalSupply += amount; balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    function _transfer(address from, address to, uint256 amount) private {
        require(to != address(0), "Demo: zero recipient");
        balanceOf[from] -= amount; balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}

contract DemoUSD is DemoToken {
    uint256 public constant GRANT = 1_000e6;
    uint256 public constant LIFETIME_LIMIT = 5_000e6;
    mapping(address => uint256) public claimed;
    mapping(address => uint256) public nextClaimAt;
    event DemoCreditsClaimed(address indexed wallet, uint256 amount, uint256 nextClaimAt);
    // Self-issued: the inherited external mint cannot be called by any wallet.
    constructor() DemoToken("DemoUSD - No Monetary Value", "DemoUSD", 6, address(this)) {}
    function claim() external {
        require(block.timestamp >= nextClaimAt[msg.sender], "Demo: daily limit");
        require(claimed[msg.sender] + GRANT <= LIFETIME_LIMIT, "Demo: lifetime limit");
        claimed[msg.sender] += GRANT;
        nextClaimAt[msg.sender] = block.timestamp + 1 days;
        _mint(msg.sender, GRANT);
        emit DemoCreditsClaimed(msg.sender, GRANT, nextClaimAt[msg.sender]);
    }
}
