// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KYCRegistry
 * @dev Manages user roles and KYC verification for the supply chain platform
 * @notice This contract handles identity verification and role-based access control
 */
contract KYCRegistry {
    
    // Enum for user roles
    enum UserRole {
        GUEST,      // Default role, no verification
        BUYER,      // Verified buyer
        SELLER,     // Verified seller/merchant
        COURIER,    // Verified courier/delivery agent
        ADMIN       // Platform administrator
    }
    
    // Enum for KYC status
    enum KYCStatus {
        NOT_STARTED,    // User hasn't submitted KYC
        PENDING,        // KYC submitted, awaiting review
        VERIFIED,       // KYC approved
        REJECTED        // KYC rejected
    }
    
    // User profile structure
    struct UserProfile {
        string name;
        string email;
        UserRole role;
        KYCStatus kycStatus;
        uint256 submittedAt;
        uint256 verifiedAt;
        bool exists;
    }
    
    // State variables
    mapping(address => UserProfile) public users;
    mapping(address => bool) public admins;
    address public owner;
    uint256 public totalUsers;
    
    // Events
    event KYCSubmitted(address indexed user, string name, string email, uint256 timestamp);
    event KYCVerified(address indexed user, UserRole role, uint256 timestamp);
    event KYCRejected(address indexed user, string reason, uint256 timestamp);
    event AdminAdded(address indexed admin, uint256 timestamp);
    event AdminRemoved(address indexed admin, uint256 timestamp);
    event RoleUpdated(address indexed user, UserRole oldRole, UserRole newRole);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Only admin can call this function");
        _;
    }
    
    modifier onlyVerified() {
        require(users[msg.sender].kycStatus == KYCStatus.VERIFIED, "User not verified");
        _;
    }
    
    /**
     * @dev Constructor sets the contract deployer as owner and first admin
     */
    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
        
        // Initialize owner profile
        users[msg.sender] = UserProfile({
            name: "Platform Owner",
            email: "owner@chainflow.com",
            role: UserRole.ADMIN,
            kycStatus: KYCStatus.VERIFIED,
            submittedAt: block.timestamp,
            verifiedAt: block.timestamp,
            exists: true
        });
        
        totalUsers = 1;
        emit KYCVerified(msg.sender, UserRole.ADMIN, block.timestamp);
    }
    
    /**
     * @notice Submit KYC information for verification
     * @param _name User's full name
     * @param _email User's email address
     */
    function submitKYC(string memory _name, string memory _email) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        require(
            users[msg.sender].kycStatus != KYCStatus.PENDING,
            "KYC already pending"
        );
        
        if (!users[msg.sender].exists) {
            totalUsers++;
        }
        
        users[msg.sender] = UserProfile({
            name: _name,
            email: _email,
            role: UserRole.GUEST,
            kycStatus: KYCStatus.PENDING,
            submittedAt: block.timestamp,
            verifiedAt: 0,
            exists: true
        });
        
        emit KYCSubmitted(msg.sender, _name, _email, block.timestamp);
    }
    
    /**
     * @notice Verify a user's KYC and assign role (Admin only)
     * @param _user Address of the user to verify
     * @param _role Role to assign to the user
     */
    function verifyKYC(address _user, UserRole _role) external onlyAdmin {
        require(users[_user].exists, "User does not exist");
        require(users[_user].kycStatus == KYCStatus.PENDING, "KYC not pending");
        require(_role != UserRole.GUEST, "Cannot assign GUEST role");
        require(_role != UserRole.ADMIN, "Use addAdmin function for admin role");
        
        UserRole oldRole = users[_user].role;
        users[_user].role = _role;
        users[_user].kycStatus = KYCStatus.VERIFIED;
        users[_user].verifiedAt = block.timestamp;
        
        emit KYCVerified(_user, _role, block.timestamp);
        if (oldRole != _role) {
            emit RoleUpdated(_user, oldRole, _role);
        }
    }
    
    /**
     * @notice Reject a user's KYC application (Admin only)
     * @param _user Address of the user to reject
     * @param _reason Reason for rejection
     */
    function rejectKYC(address _user, string memory _reason) external onlyAdmin {
        require(users[_user].exists, "User does not exist");
        require(users[_user].kycStatus == KYCStatus.PENDING, "KYC not pending");
        
        users[_user].kycStatus = KYCStatus.REJECTED;
        
        emit KYCRejected(_user, _reason, block.timestamp);
    }
    
    /**
     * @notice Add a new admin (Owner only)
     * @param _admin Address to grant admin privileges
     */
    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Invalid address");
        require(!admins[_admin], "Already an admin");
        
        admins[_admin] = true;
        
        // Update user profile if exists
        if (users[_admin].exists) {
            UserRole oldRole = users[_admin].role;
            users[_admin].role = UserRole.ADMIN;
            users[_admin].kycStatus = KYCStatus.VERIFIED;
            users[_admin].verifiedAt = block.timestamp;
            emit RoleUpdated(_admin, oldRole, UserRole.ADMIN);
        } else {
            users[_admin] = UserProfile({
                name: "Admin",
                email: "",
                role: UserRole.ADMIN,
                kycStatus: KYCStatus.VERIFIED,
                submittedAt: block.timestamp,
                verifiedAt: block.timestamp,
                exists: true
            });
            totalUsers++;
        }
        
        emit AdminAdded(_admin, block.timestamp);
    }
    
    /**
     * @notice Remove admin privileges (Owner only)
     * @param _admin Address to revoke admin privileges from
     */
    function removeAdmin(address _admin) external onlyOwner {
        require(_admin != owner, "Cannot remove owner");
        require(admins[_admin], "Not an admin");
        
        admins[_admin] = false;
        
        if (users[_admin].exists) {
            UserRole oldRole = users[_admin].role;
            users[_admin].role = UserRole.GUEST;
            emit RoleUpdated(_admin, oldRole, UserRole.GUEST);
        }
        
        emit AdminRemoved(_admin, block.timestamp);
    }
    
    /**
     * @notice Get user profile information
     * @param _user Address of the user
     * @return UserProfile struct
     */
    function getUserProfile(address _user) external view returns (UserProfile memory) {
        return users[_user];
    }
    
    /**
     * @notice Check if user is verified
     * @param _user Address of the user
     * @return bool True if verified
     */
    function isVerified(address _user) external view returns (bool) {
        return users[_user].kycStatus == KYCStatus.VERIFIED;
    }
    
    /**
     * @notice Get user's role
     * @param _user Address of the user
     * @return UserRole enum value
     */
    function getUserRole(address _user) external view returns (UserRole) {
        return users[_user].exists ? users[_user].role : UserRole.GUEST;
    }
    
    /**
     * @notice Check if address is an admin
     * @param _user Address to check
     * @return bool True if admin
     */
    function isAdmin(address _user) external view returns (bool) {
        return admins[_user] || _user == owner;
    }
}
