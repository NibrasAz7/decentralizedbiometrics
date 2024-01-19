// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract BiometricIdentity {
    
    // Structures
    struct Subject {
        uint16 ID;           // ID of the Subject 
        uint16 hx;           // Hash representation
        uint16 delta;        // The offset
    }
    
    struct Node {
        uint ID;             // ID of the Node
        string name;         // Name of the Node
        address addr;        // Ethereum address of the Node
        bool isAuthorised;   // Authorization status for AC
        bool isEnrollment;   // Enrollment center status for EC
    }

    // Events
    event SubjectSet(uint16 indexed _ID, uint16 _hx, uint16 _delta);
    event SubjectUpdated(uint16 indexed _ID, uint16 _hx, uint16 _delta);
    event SubjectDeleted(uint16 indexed _ID);
    event NodeSet(uint indexed _ID, string _name, address _addr);
    event NodeDeleted(address indexed _addr);
    event NodeStatusUpdated(address indexed _addr, bool isAuthorised, bool isEnrollment);
    event Error(string ErrorMessage);

    // Private state variable for contract creator's address
    address private owner;
    
    // Mappings
    mapping(uint16 => Subject) private subjects;
    mapping(address => Node) private nodes;

    // Modifiers
    modifier isAC() {
        require(nodes[msg.sender].isAuthorised, "Caller is not an authorized Authentication Center");
        _;
    }

    modifier isEC() {
        require(nodes[msg.sender].isEnrollment, "Caller is not an Enrollment Center");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
        nodes[owner] = Node({
            ID: 1,
            name: "First Enrollment Center",
            addr: owner,
            isAuthorised: true,
            isEnrollment: true
        });
    }
    
    // Functions for Subjects
    function setSubject(uint16 _ID, uint16 _hx, uint16 _delta) public isEC {
        subjects[_ID] = Subject(_ID, _hx, _delta);
        emit SubjectSet(_ID, _hx, _delta);
    }

    function getSubject(uint16 _ID) public view isAC returns (uint16, uint16, uint16) {
        Subject memory subject = subjects[_ID];
        return (subject.ID, subject.hx, subject.delta);
    }

    function updateSubject(uint16 _ID, uint16 _hx, uint16 _delta) public isEC {
        Subject storage subject = subjects[_ID];
        subject.hx = _hx;
        subject.delta = _delta;
        emit SubjectUpdated(_ID, _hx, _delta);
    }

    function deleteSubject(uint16 _ID) public isEC {
        delete subjects[_ID];
        emit SubjectDeleted(_ID);
    }
    
    // Functions for Nodes
    function setNode(uint _ID, string memory _name, address _addr) public isEC {
        nodes[_addr] = Node(_ID, _name, _addr, true, false); // Setting as authorized but not an enrollment center by default
        emit NodeSet(_ID, _name, _addr);
    }

    function getNode(address _addr) public view isEC returns (uint, string memory, address, bool, bool) {
        Node memory node = nodes[_addr];
        return (node.ID, node.name, node.addr, node.isAuthorised, node.isEnrollment);
    }

    function deleteNode(address _addr) public isEC {
        delete nodes[_addr];
        emit NodeDeleted(_addr);
    }

    function updateNodeStatus(address _addr, bool _isAuthorised, bool _isEnrollment) public isEC {
        Node storage node = nodes[_addr];
        node.isAuthorised = _isAuthorised;
        node.isEnrollment = _isEnrollment;
        emit NodeStatusUpdated(_addr, _isAuthorised, _isEnrollment);
    }
}
