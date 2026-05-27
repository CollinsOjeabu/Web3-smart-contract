// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KYCRegistry.sol";

/**
 * @title SupplyChainEscrow
 * @dev Core escrow contract for supply chain shipment management
 * @notice Handles shipment creation, tracking, and automated payment release
 */
contract SupplyChainEscrow {
    
    // Reference to KYC Registry
    KYCRegistry public kycRegistry;
    
    // Shipment status enum
    enum ShipmentStatus {
        PENDING,
        IN_TRANSIT,
        OUT_FOR_DELIVERY,
        DELIVERED,
        CANCELLED
    }
    
    // Payment status enum
    enum PaymentStatus {
        PENDING,
        LOCKED,
        RELEASED,
        REFUNDED
    }
    
    // Status update history
    struct StatusUpdate {
        ShipmentStatus status;
        string location;
        string message;
        uint256 timestamp;
        address updatedBy;
    }
    
    // Shipment structure
    struct Shipment {
        uint256 id;
        address payable sender;      // Seller
        address payable receiver;    // Buyer
        address payable courier;     // Delivery agent
        string title;
        string description;
        string category;
        uint256 price;
        ShipmentStatus status;
        PaymentStatus paymentStatus;
        uint256 createdAt;
        uint256 deliveredAt;
        bool exists;
    }
    
    // State variables
    mapping(uint256 => Shipment) public shipments;
    mapping(uint256 => StatusUpdate[]) public shipmentHistory;
    mapping(address => uint256[]) public userShipments;
    uint256 public shipmentCount;
    
    // Events
    event ShipmentCreated(
        uint256 indexed shipmentId,
        address indexed sender,
        address indexed receiver,
        address courier,
        uint256 amount,
        uint256 timestamp
    );
    
    event ShipmentStatusUpdated(
        uint256 indexed shipmentId,
        ShipmentStatus status,
        string location,
        uint256 timestamp,
        address updatedBy
    );
    
    event PaymentLocked(
        uint256 indexed shipmentId,
        uint256 amount,
        uint256 timestamp
    );
    
    event PaymentReleased(
        uint256 indexed shipmentId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event PaymentRefunded(
        uint256 indexed shipmentId,
        address indexed buyer,
        uint256 amount,
        uint256 timestamp
    );
    
    // Modifiers
    modifier shipmentExists(uint256 _shipmentId) {
        require(
            _shipmentId > 0 && _shipmentId <= shipmentCount,
            "Shipment does not exist"
        );
        require(shipments[_shipmentId].exists, "Shipment not found");
        _;
    }
    
    modifier onlyShipmentParty(uint256 _shipmentId) {
        Shipment memory shipment = shipments[_shipmentId];
        require(
            msg.sender == shipment.sender ||
            msg.sender == shipment.receiver ||
            msg.sender == shipment.courier ||
            kycRegistry.isAdmin(msg.sender),
            "Not authorized for this shipment"
        );
        _;
    }
    
    modifier onlyCourierOrAdmin(uint256 _shipmentId) {
        Shipment memory shipment = shipments[_shipmentId];
        require(
            msg.sender == shipment.courier || kycRegistry.isAdmin(msg.sender),
            "Only courier or admin can update status"
        );
        _;
    }
    
    /**
     * @dev Constructor
     * @param _kycRegistryAddress Address of the deployed KYCRegistry contract
     */
    constructor(address _kycRegistryAddress) {
        require(_kycRegistryAddress != address(0), "Invalid KYC Registry address");
        kycRegistry = KYCRegistry(_kycRegistryAddress);
    }
    
    /**
     * @notice Create a new shipment with escrow
     * @param _receiver Address of the receiver (buyer)
     * @param _courier Address of the courier
     * @param _title Shipment title
     * @param _description Shipment description
     * @param _category Shipment category
     */
    function createShipment(
        address payable _receiver,
        address payable _courier,
        string memory _title,
        string memory _description,
        string memory _category
    ) external payable returns (uint256) {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(_receiver != address(0), "Invalid receiver address");
        require(_courier != address(0), "Invalid courier address");
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        // Verify sender is KYC verified
        require(kycRegistry.isVerified(msg.sender), "Sender must be KYC verified");
        
        shipmentCount++;
        
        // Create shipment
        shipments[shipmentCount] = Shipment({
            id: shipmentCount,
            sender: payable(msg.sender),
            receiver: _receiver,
            courier: _courier,
            title: _title,
            description: _description,
            category: _category,
            price: msg.value,
            status: ShipmentStatus.PENDING,
            paymentStatus: PaymentStatus.LOCKED,
            createdAt: block.timestamp,
            deliveredAt: 0,
            exists: true
        });
        
        // Add to user shipments
        userShipments[msg.sender].push(shipmentCount);
        userShipments[_receiver].push(shipmentCount);
        userShipments[_courier].push(shipmentCount);
        
        // Add initial status to history
        shipmentHistory[shipmentCount].push(StatusUpdate({
            status: ShipmentStatus.PENDING,
            location: "Origin",
            message: "Smart Contract Initialized & Funds Locked in Escrow",
            timestamp: block.timestamp,
            updatedBy: msg.sender
        }));
        
        emit ShipmentCreated(
            shipmentCount,
            msg.sender,
            _receiver,
            _courier,
            msg.value,
            block.timestamp
        );
        
        emit PaymentLocked(shipmentCount, msg.value, block.timestamp);
        
        return shipmentCount;
    }
    
    /**
     * @notice Update shipment status
     * @param _shipmentId ID of the shipment
     * @param _status New status
     * @param _location Current location
     * @param _message Status update message
     */
    function updateShipmentStatus(
        uint256 _shipmentId,
        ShipmentStatus _status,
        string memory _location,
        string memory _message
    ) external shipmentExists(_shipmentId) onlyCourierOrAdmin(_shipmentId) {
        Shipment storage shipment = shipments[_shipmentId];
        
        require(
            shipment.status != ShipmentStatus.DELIVERED &&
            shipment.status != ShipmentStatus.CANCELLED,
            "Shipment already finalized"
        );
        
        // Update status
        ShipmentStatus oldStatus = shipment.status;
        shipment.status = _status;
        
        // Add to history
        shipmentHistory[_shipmentId].push(StatusUpdate({
            status: _status,
            location: _location,
            message: _message,
            timestamp: block.timestamp,
            updatedBy: msg.sender
        }));
        
        emit ShipmentStatusUpdated(
            _shipmentId,
            _status,
            _location,
            block.timestamp,
            msg.sender
        );
        
        // Auto-release payment on delivery
        if (_status == ShipmentStatus.DELIVERED && 
            shipment.paymentStatus == PaymentStatus.LOCKED) {
            _releasePayment(_shipmentId);
        }
    }
    
    /**
     * @notice Cancel shipment and refund buyer
     * @param _shipmentId ID of the shipment
     * @param _reason Cancellation reason
     */
    function cancelShipment(
        uint256 _shipmentId,
        string memory _reason
    ) external shipmentExists(_shipmentId) {
        Shipment storage shipment = shipments[_shipmentId];
        
        require(
            msg.sender == shipment.sender || 
            msg.sender == shipment.receiver ||
            kycRegistry.isAdmin(msg.sender),
            "Not authorized to cancel"
        );
        
        require(
            shipment.status != ShipmentStatus.DELIVERED &&
            shipment.status != ShipmentStatus.CANCELLED,
            "Cannot cancel finalized shipment"
        );
        
        require(
            shipment.paymentStatus == PaymentStatus.LOCKED,
            "Payment already processed"
        );
        
        // Update status
        shipment.status = ShipmentStatus.CANCELLED;
        
        // Add to history
        shipmentHistory[_shipmentId].push(StatusUpdate({
            status: ShipmentStatus.CANCELLED,
            location: "N/A",
            message: _reason,
            timestamp: block.timestamp,
            updatedBy: msg.sender
        }));
        
        emit ShipmentStatusUpdated(
            _shipmentId,
            ShipmentStatus.CANCELLED,
            "N/A",
            block.timestamp,
            msg.sender
        );
        
        // Refund buyer
        _refundBuyer(_shipmentId);
    }
    
    /**
     * @dev Internal function to release payment to seller
     * @param _shipmentId ID of the shipment
     */
    function _releasePayment(uint256 _shipmentId) private {
        Shipment storage shipment = shipments[_shipmentId];
        
        require(shipment.paymentStatus == PaymentStatus.LOCKED, "Payment not locked");
        
        shipment.paymentStatus = PaymentStatus.RELEASED;
        shipment.deliveredAt = block.timestamp;
        
        uint256 amount = shipment.price;
        
        // Transfer funds to seller
        (bool success, ) = shipment.sender.call{value: amount}("");
        require(success, "Payment transfer failed");
        
        emit PaymentReleased(_shipmentId, shipment.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Internal function to refund buyer
     * @param _shipmentId ID of the shipment
     */
    function _refundBuyer(uint256 _shipmentId) private {
        Shipment storage shipment = shipments[_shipmentId];
        
        require(shipment.paymentStatus == PaymentStatus.LOCKED, "Payment not locked");
        
        shipment.paymentStatus = PaymentStatus.REFUNDED;
        
        uint256 amount = shipment.price;
        
        // In marketplace model, the sender is the seller, receiver is the buyer
        // For P2P shipments, sender paid, so refund to sender
        // We'll refund to receiver (buyer) as per marketplace logic
        address payable refundRecipient = shipment.receiver;
        
        // Transfer refund
        (bool success, ) = refundRecipient.call{value: amount}("");
        require(success, "Refund transfer failed");
        
        emit PaymentRefunded(_shipmentId, refundRecipient, amount, block.timestamp);
    }
    
    /**
     * @notice Get shipment details
     * @param _shipmentId ID of the shipment
     * @return Shipment struct
     */
    function getShipment(uint256 _shipmentId) 
        external 
        view 
        shipmentExists(_shipmentId) 
        returns (Shipment memory) 
    {
        return shipments[_shipmentId];
    }
    
    /**
     * @notice Get shipment history
     * @param _shipmentId ID of the shipment
     * @return Array of status updates
     */
    function getShipmentHistory(uint256 _shipmentId) 
        external 
        view 
        shipmentExists(_shipmentId) 
        returns (StatusUpdate[] memory) 
    {
        return shipmentHistory[_shipmentId];
    }
    
    /**
     * @notice Get all shipments for a user
     * @param _user Address of the user
     * @return Array of shipment IDs
     */
    function getUserShipments(address _user) external view returns (uint256[] memory) {
        return userShipments[_user];
    }
    
    /**
     * @notice Get all shipments (for admin/analytics)
     * @return Array of all shipment IDs
     */
    function getAllShipments() external view returns (uint256[] memory) {
        uint256[] memory allShipments = new uint256[](shipmentCount);
        for (uint256 i = 1; i <= shipmentCount; i++) {
            allShipments[i - 1] = i;
        }
        return allShipments;
    }
    
    /**
     * @notice Get contract balance
     * @return Current balance locked in escrow
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
