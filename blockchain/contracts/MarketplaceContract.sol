// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KYCRegistry.sol";

/**
 * @title MarketplaceContract
 * @dev Decentralized marketplace for product listings and purchases
 * @notice Handles item listings, purchases, and automatic escrow creation
 */
contract MarketplaceContract {
    
    // Reference to KYC Registry
    KYCRegistry public kycRegistry;
    
    // Item structure
    struct MarketplaceItem {
        uint256 id;
        string title;
        string description;
        uint256 price;
        string category;
        string ipfsHash;        // IPFS hash for product images/metadata
        address payable seller;
        bool active;
        uint256 listedAt;
    }
    
    // State variables
    mapping(uint256 => MarketplaceItem) public items;
    mapping(address => uint256[]) public sellerItems;
    uint256 public itemCount;
    uint256 public platformFeePercent = 2; // 2% platform fee
    address payable public platformWallet;
    
    // Events
    event ItemListed(
        uint256 indexed itemId,
        address indexed seller,
        string title,
        uint256 price,
        uint256 timestamp
    );
    
    event ItemPurchased(
        uint256 indexed itemId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 timestamp
    );
    
    event ItemRemoved(
        uint256 indexed itemId,
        address indexed seller,
        uint256 timestamp
    );
    
    event ItemUpdated(
        uint256 indexed itemId,
        string title,
        uint256 price,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyVerifiedSeller() {
        require(
            kycRegistry.getUserRole(msg.sender) == KYCRegistry.UserRole.SELLER,
            "Only verified sellers can perform this action"
        );
        require(
            kycRegistry.isVerified(msg.sender),
            "Seller must be KYC verified"
        );
        _;
    }
    
    modifier onlyItemOwner(uint256 _itemId) {
        require(items[_itemId].seller == msg.sender, "Not the item owner");
        _;
    }
    
    modifier itemExists(uint256 _itemId) {
        require(_itemId > 0 && _itemId <= itemCount, "Item does not exist");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _kycRegistryAddress Address of the deployed KYCRegistry contract
     */
    constructor(address _kycRegistryAddress) {
        require(_kycRegistryAddress != address(0), "Invalid KYC Registry address");
        kycRegistry = KYCRegistry(_kycRegistryAddress);
        platformWallet = payable(msg.sender);
    }
    
    /**
     * @notice List a new item in the marketplace
     * @param _title Item title
     * @param _description Item description
     * @param _price Item price in wei
     * @param _category Item category
     * @param _ipfsHash IPFS hash for item images/metadata
     */
    function listItem(
        string memory _title,
        string memory _description,
        uint256 _price,
        string memory _category,
        string memory _ipfsHash
    ) external onlyVerifiedSeller returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_price > 0, "Price must be greater than 0");
        
        itemCount++;
        
        items[itemCount] = MarketplaceItem({
            id: itemCount,
            title: _title,
            description: _description,
            price: _price,
            category: _category,
            ipfsHash: _ipfsHash,
            seller: payable(msg.sender),
            active: true,
            listedAt: block.timestamp
        });
        
        sellerItems[msg.sender].push(itemCount);
        
        emit ItemListed(itemCount, msg.sender, _title, _price, block.timestamp);
        
        return itemCount;
    }
    
    /**
     * @notice Update an existing item
     * @param _itemId ID of the item to update
     * @param _title New title
     * @param _description New description
     * @param _price New price
     */
    function updateItem(
        uint256 _itemId,
        string memory _title,
        string memory _description,
        uint256 _price
    ) external itemExists(_itemId) onlyItemOwner(_itemId) {
        require(items[_itemId].active, "Item is not active");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_price > 0, "Price must be greater than 0");
        
        items[_itemId].title = _title;
        items[_itemId].description = _description;
        items[_itemId].price = _price;
        
        emit ItemUpdated(_itemId, _title, _price, block.timestamp);
    }
    
    /**
     * @notice Remove an item from the marketplace
     * @param _itemId ID of the item to remove
     */
    function removeItem(uint256 _itemId) 
        external 
        itemExists(_itemId) 
        onlyItemOwner(_itemId) 
    {
        require(items[_itemId].active, "Item already inactive");
        
        items[_itemId].active = false;
        
        emit ItemRemoved(_itemId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Get item details
     * @param _itemId ID of the item
     * @return MarketplaceItem struct
     */
    function getItem(uint256 _itemId) 
        external 
        view 
        itemExists(_itemId) 
        returns (MarketplaceItem memory) 
    {
        return items[_itemId];
    }
    
    /**
     * @notice Get all items listed by a seller
     * @param _seller Address of the seller
     * @return Array of item IDs
     */
    function getSellerItems(address _seller) external view returns (uint256[] memory) {
        return sellerItems[_seller];
    }
    
    /**
     * @notice Get all active items (for browsing)
     * @return Array of active items
     */
    function getActiveItems() external view returns (MarketplaceItem[] memory) {
        // Count active items
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= itemCount; i++) {
            if (items[i].active) {
                activeCount++;
            }
        }
        
        // Create array of active items
        MarketplaceItem[] memory activeItems = new MarketplaceItem[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= itemCount; i++) {
            if (items[i].active) {
                activeItems[index] = items[i];
                index++;
            }
        }
        
        return activeItems;
    }
    
    /**
     * @notice Update platform fee percentage (Owner only)
     * @param _newFeePercent New fee percentage (0-100)
     */
    function updatePlatformFee(uint256 _newFeePercent) external {
        require(msg.sender == platformWallet, "Only platform owner");
        require(_newFeePercent <= 10, "Fee cannot exceed 10%");
        platformFeePercent = _newFeePercent;
    }
    
    /**
     * @notice Update platform wallet address (Owner only)
     * @param _newWallet New platform wallet address
     */
    function updatePlatformWallet(address payable _newWallet) external {
        require(msg.sender == platformWallet, "Only platform owner");
        require(_newWallet != address(0), "Invalid address");
        platformWallet = _newWallet;
    }
}
