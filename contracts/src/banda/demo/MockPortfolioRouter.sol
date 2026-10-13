// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {DemoToken, DemoUSD} from "./DemoToken.sol";

/// @notice Issues synthetic holdings; never executes a market purchase.
/// All DemoUSD stays reserved here. Full redemption returns exact recorded principal.
contract MockPortfolioRouter {
    DemoUSD public immutable settlement;
    address public immutable diamond;
    address[] private tokens;
    uint16[] private weights;
    uint256[] private prices;
    mapping(address => uint256) public shareBalance;
    mapping(address => uint256[]) private issued;
    uint256 public totalLiability;
    event DemoAllocated(address indexed account, address indexed token, uint256 demoCredits, uint256 quantity);
    event DemoSettled(address indexed account, address indexed recipient, uint256 demoCredits);

    constructor(DemoUSD settlement_, address diamond_, uint16[] memory weights_, uint256[] memory prices_) {
        require(address(settlement_) != address(0x3600000000000000000000000000000000000000), "Demo: real USDC forbidden");
        require(address(settlement_).code.length != 0 && diamond_.code.length != 0, "Demo: dependencies");
        require(weights_.length == 6 && prices_.length == 6, "Demo: six legs");
        settlement = settlement_; diamond = diamond_;
        string[6] memory names = ["Simulated NVIDIA", "Simulated Bittensor", "Simulated Alphabet", "Simulated NEAR", "Simulated Gold", "Simulated Cash"];
        string[6] memory symbols = ["mNVDA", "mTAO", "mGOOGL", "mNEAR", "mGLD", "mCASH"];
        uint256 total;
        for (uint256 i; i < 6; ++i) {
            require(weights_[i] > 0 && prices_[i] > 0 && prices_[i] <= 1e18, "Demo: invalid leg");
            total += weights_[i];
            tokens.push(address(new DemoToken(string.concat(names[i], " - Demo Only"), symbols[i], 18, address(this))));
        }
        require(total == 10_000, "Demo: allocation total");
        weights = weights_; prices = prices_;
    }
    function legs() external view returns (address[] memory, uint16[] memory) { return (tokens, weights); }
    function simulatedPrices() external view returns (uint256[] memory) { return prices; }
    function previewAllocation(uint256 assets) public view returns (uint256[] memory quantities) {
        require(assets >= 10e6 && assets <= type(uint128).max, "Demo: amount bounds");
        quantities = new uint256[](6);
        uint256 remaining = assets;
        for (uint256 i; i < 6; ++i) {
            uint256 credits = i == 5 ? remaining : assets * weights[i] / 10_000;
            remaining -= credits;
            quantities[i] = credits * 1e18 / prices[i];
            require(quantities[i] != 0, "Demo: zero leg");
        }
    }
    function deposit(uint256 assets, address account) external returns (uint256) {
        require(msg.sender == diamond, "Demo: diamond only");
        require(account.code.length != 0 && shareBalance[account] == 0, "Demo: account already funded");
        uint256[] memory quantities = previewAllocation(assets);
        shareBalance[account] = assets; issued[account] = quantities; totalLiability += assets;
        require(settlement.transferFrom(msg.sender, address(this), assets), "Demo: settlement pull");
        uint256 remaining = assets;
        for (uint256 i; i < 6; ++i) {
            uint256 credits = i == 5 ? remaining : assets * weights[i] / 10_000;
            remaining -= credits;
            DemoToken(tokens[i]).mint(account, quantities[i]);
            emit DemoAllocated(account, tokens[i], credits, quantities[i]);
        }
        return assets;
    }
    function holdingsFor(address account, uint256 shares) external view returns (address[] memory, uint256[] memory) {
        require(shares != 0 && shares == shareBalance[account], "Demo: full redemption only");
        return (tokens, issued[account]);
    }
    function redeem(uint256 shares, address receiver, address account) external returns (uint256) {
        require(msg.sender == account && receiver == diamond, "Demo: account required");
        require(shares != 0 && shares == shareBalance[account], "Demo: full redemption only");
        delete shareBalance[account]; totalLiability -= shares;
        uint256[] memory quantities = issued[account]; delete issued[account];
        for (uint256 i; i < 6; ++i) DemoToken(tokens[i]).burn(quantities[i]);
        require(settlement.transfer(receiver, shares), "Demo: settlement return");
        emit DemoSettled(account, receiver, shares);
        return shares;
    }
    function previewRedeem(uint256 shares) external pure returns (uint256) { return shares; }
}

/// @notice A fixed principal accounting rule, not an oracle observation or market valuation.
contract DemoNavAdapter {
    address public immutable router;
    constructor(address router_) { router = router_; }
    function quote(address strategy, uint256 shares) external view returns (uint256, uint256, uint256, bool) {
        return (shares, block.timestamp, block.number, strategy == router && shares != 0);
    }
}
