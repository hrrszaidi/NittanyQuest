// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NittanyQuest is ERC721URIStorage, Ownable, ReentrancyGuard {

    // Counter for the next NFT token ID to be minted (starts at 0)
    uint256 public nextTokenId;

    // Counter for the next quest ID to be assigned (also serves as total quest count)
    uint256 public nextQuestId;

    // Struct that stores all data for a single quest
    struct Quest {
        uint256 questId;        // Unique identifier for this quest
        string name;            // Display name shown to players
        string locationHint;    // Public clue pointing to the physical location
        string badgeURI;        // IPFS URI for the NFT badge image/metadata
        bytes32 secretHash;     // keccak256 hash of the secret code (plaintext never stored)
        uint256 totalMinted;    // How many badges have been minted for this quest
        address creator;        // Wallet address that created this quest
    }

    // Maps quest ID → Quest struct
    mapping(uint256 => Quest) public quests;

    // Maps (questId, userAddress) → whether the user has completed the quest
    mapping(uint256 => mapping(address => bool)) public hasCompletedQuest;

    // Maps wallet address → total number of badges minted by that wallet
    mapping(address => uint256) public userBadgeCount;

    // Maps token ID → the quest ID that token was minted for
    mapping(uint256 => uint256) public tokenQuest;

    // Emitted when a new quest is created
    event QuestCreated(
        uint256 indexed questId,
        string name,
        string locationHint,
        string badgeURI,
        address indexed creator
    );

    // Emitted when a player successfully mints a badge
    event BadgeMinted(
        address indexed user,
        uint256 indexed questId,
        uint256 indexed tokenId
    );

    /// @notice Deploys the contract, sets the deployer as owner, and initializes the ERC-721 token
    constructor()
        ERC721("NittanyQuest Badge", "NQB")  // Token name and symbol for the NFT collection
        Ownable(msg.sender)                  // Sets the deploying wallet as the contract owner
    {}

    function createQuest(
        string memory _name,
        string memory _locationHint,
        string memory _badgeURI,
        string memory _secret
    ) public {
        // Validate required fields before writing to storage
        require(bytes(_name).length > 0, "Quest name required");
        require(bytes(_badgeURI).length > 0, "Badge URI required");
        require(bytes(_secret).length > 0, "Secret required");

        // Hash the plaintext secret — only the hash is stored, never the original string
        bytes32 secretHash = keccak256(abi.encode(_secret));

        // Assign the current counter value as the new quest's ID, then increment
        uint256 questId = nextQuestId;

        // Write the new quest into the mapping
        quests[questId] = Quest({
            questId: questId,
            name: _name,
            locationHint: _locationHint,
            badgeURI: _badgeURI,
            secretHash: secretHash,
            totalMinted: 0,         // No badges minted yet
            creator: msg.sender     // Track who created this quest
        });

        nextQuestId++; // Increment counter so the next quest gets a unique ID

        // Emit an event so the frontend can read the new questId from the transaction receipt
        emit QuestCreated(questId, _name, _locationHint, _badgeURI, msg.sender);
    }

    function mintBadge(uint256 _questId, string memory _secret) public nonReentrant {
        // Ensure the quest ID exists (nextQuestId is the total count, so valid IDs are 0 to nextQuestId-1)
        require(_questId < nextQuestId, "Quest does not exist");

        Quest storage quest = quests[_questId]; // Load quest from storage by reference

        // Prevent double-claiming — each wallet can only mint one badge per quest
        require(!hasCompletedQuest[_questId][msg.sender], "Already completed this quest");

        // Hash the submitted secret and compare it to the stored hash
        bytes32 submittedHash = keccak256(abi.encode(_secret));
        require(submittedHash == quest.secretHash, "Invalid secret code");

        // Assign the next available token ID for this NFT
        uint256 tokenId = nextTokenId;

        // Update state before minting (checks-effects-interactions pattern)
        hasCompletedQuest[_questId][msg.sender] = true; // Mark quest as completed for this wallet
        userBadgeCount[msg.sender]++;                   // Increment the wallet's badge count
        quest.totalMinted++;                            // Increment the quest's mint counter
        tokenQuest[tokenId] = _questId;                 // Record which quest this token belongs to

        // Mint the ERC-721 token to the caller's wallet with a completion check
        _safeMint(msg.sender, tokenId);

        // Attach the badge image/metadata URI to this specific token
        _setTokenURI(tokenId, quest.badgeURI);

        nextTokenId++; // Increment token ID counter for the next mint

        emit BadgeMinted(msg.sender, _questId, tokenId);
    }

    function getQuest(
        uint256 _questId
    )
        public
        view
        returns (
            uint256 questId,
            string memory name,
            string memory locationHint,
            string memory badgeURI,
            uint256 totalMinted,
            address creator
        )
    {
        require(_questId < nextQuestId, "Quest does not exist");

        // Load the quest into memory (cheaper than reading from storage multiple times)
        Quest memory quest = quests[_questId];

        // Return all 6 fields as a tuple — destructured by the frontend
        return (
            quest.questId,
            quest.name,
            quest.locationHint,
            quest.badgeURI,
            quest.totalMinted,
            quest.creator
        );
    }

    function completedQuest(
        uint256 _questId,
        address _user
    ) public view returns (bool) {
        require(_questId < nextQuestId, "Quest does not exist");

        // Look up the completion status in the nested mapping
        return hasCompletedQuest[_questId][_user];
    }

    function getCompletedQuestIds(
        address _user
    ) public view returns (uint256[] memory) {
        // Pre-allocate array with the exact size (userBadgeCount tracks how many they've completed)
        uint256 count = userBadgeCount[_user];
        uint256[] memory completed = new uint256[](count);

        uint256 index = 0;

        // Iterate through all quests and collect the ones this user has completed
        for (uint256 i = 0; i < nextQuestId; i++) {
            if (hasCompletedQuest[i][_user]) {
                completed[index] = i;
                index++;
            }
        }

        return completed;
    }

    function getSecretHash(
        string memory _secret
    ) public pure returns (bytes32) {
        // Uses abi.encode (not abi.encodePacked) to avoid hash collisions between similar strings
        return keccak256(abi.encode(_secret));
    }
}
