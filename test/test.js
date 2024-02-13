const BiometricIdentity = artifacts.require("BiometricIdentity");
const truffleAssert = require('truffle-assertions');

contract("BiometricIdentity", (accounts) => {
  let biometricIdentityInstance;
  let Main_Enrollment_Center = accounts[0] // Main_Enrollment_Center responsible for deployment of smart contract
  let postOfficeAddress =  accounts[1] // Post Office Address for testing as AC node
  let hospitalAddress =  accounts[2] //  Hospital Address for testing as AC node
  let ComuneAddress =  accounts[3] // Comune Address for testing
  let whiteHatHackerAddress =  accounts[4] // // White-hat Hacker Address for testing as AC node 

  before(async () => {
    biometricIdentityInstance = await BiometricIdentity.deployed();
  });

  describe("Deployment", () => {
    it("is deployed and initialized correctly", async () => {
      assert(biometricIdentityInstance.address !== '');
    });
  });


describe("Registration Phase", () => {
  it('Register Post Office Node', async () => {
    const tx = await biometricIdentityInstance.setNode(2, 'Post Office', postOfficeAddress, { from: Main_Enrollment_Center });
    truffleAssert.eventEmitted(tx, 'NodeSet', (ev) => {
      return ev._ID.toNumber() === 2 && ev._name === "Post Office" && ev._addr === postOfficeAddress;
    });
  });

  // Test for registering Hospital Node
  it('Register Hospital Node', async () => {
    const tx = await biometricIdentityInstance.setNode(3, 'Hospital', hospitalAddress, { from: Main_Enrollment_Center });
    truffleAssert.eventEmitted(tx, 'NodeSet', (ev) => {
      return ev._ID.toNumber() === 3 && ev._name === "Hospital" && ev._addr === hospitalAddress;
    });
  });
}); // End Registration Phase testing


describe("Enrollment Phase", () => {
  it('successfully enrolls first subject', async () => {
    const tx = await biometricIdentityInstance.setSubject(1, 10110, 1001, { from: Main_Enrollment_Center });
    truffleAssert.eventEmitted(tx, 'SubjectSet', (ev) => {
      return ev._ID.toNumber() === 1 && ev._hx.toNumber() === 10110 && ev._delta.toNumber() === 1001;
    });
  });

  it('successfully enrolls second subject', async () => {
    const tx = await biometricIdentityInstance.setSubject(2, 11110, 1101, { from: Main_Enrollment_Center });
    truffleAssert.eventEmitted(tx, 'SubjectSet', (ev) => {
      return ev._ID.toNumber() === 2 && ev._hx.toNumber() === 11110 && ev._delta.toNumber() === 1101;
    });
  });

  it('successfully enrolls third subject', async () => {
    const tx = await biometricIdentityInstance.setSubject(3, 10111, 1011, { from: Main_Enrollment_Center });
    truffleAssert.eventEmitted(tx, 'SubjectSet', (ev) => {
      return ev._ID.toNumber() === 3 && ev._hx.toNumber() === 10111 && ev._delta.toNumber() === 1011;
    });
  });
}); // End Enrollment Phase testing


describe("Authentication Phase", () => {

  it('Post Office Authenitcating Subject 1', async () => {
    // Assuming the ID of the subject to retrieve is 1
    const subjectId = 1;
    // Attempt to get the subject by the authorized Post Office
    const tx = await biometricIdentityInstance.getSubject(subjectId, { from: postOfficeAddress });
    // Assertions to ensure the subject is retrieved successfully
    assert.equal(tx[0].toNumber(), subjectId, "Subject ID does not match");

  });

  it('Hospital Authenitcating Subject 1', async () => {
    // Assuming the ID of the subject to retrieve is 2
    const subjectId = 2;
    // Attempt to get the subject by the authorized Post Office
    const tx = await biometricIdentityInstance.getSubject(subjectId, { from: hospitalAddress });
    // Assertions to ensure the subject is retrieved successfully
    assert.equal(tx[0].toNumber(), subjectId, "Subject ID does not match");

  });


  it('Preventing White-hat Hacker from unauthorization access', async () => {
    // Assuming the ID of the subject to retrieve is 2
    const subjectId = 3;
    // Attempt to get the subject by the whiteHatHackerAddress
    try {
      await biometricIdentityInstance.getSubject(subjectId, { from: whiteHatHackerAddress });
      assert.fail("The transaction should have reverted due to lack of authorization");
    } catch (error) {
      assert(error.message.includes("revert"), "Expected revert error not received");
    }
  });
}); // End Enrollment Phase testing

describe("Revocation Phase", () => {
  it('Deleter subject 3 by Main_Enrollment_Center', async () => {
    // Deleting subject 3 by the Main_Enrollment_Center
    const tx = await biometricIdentityInstance.deleteSubject(3, { from: Main_Enrollment_Center });

    // Asserting that the SubjectDeleted event was emitted
    truffleAssert.eventEmitted(tx, 'SubjectDeleted', (ev) => {
      return ev._ID.toNumber() === 3;
    }, "SubjectDeleted event should be emitted with the correct subject ID");

    // verify the subject's deletion by attempting to retrieve it
    // the test depends on how your contract handles queries for deleted subjects
    //try {
    //  await biometricIdentityInstance.getSubject(3, { from: Main_Enrollment_Center });
    //  assert.fail("Expected an error for querying a deleted subject");
    //} catch (error) {
    //  assert(error.message.includes("revert"), "Expected revert error for querying a deleted subject, but did not receive it");
    //}
  });
});


describe("Node Status Update", () => {
  it('updates the Post Office node to an Enrollment Center', async () => {
    const txResult = await biometricIdentityInstance.updateNodeStatus(postOfficeAddress, true, true, { from: Main_Enrollment_Center });

    // Asserting that the NodeStatusUpdated event was emitted with the expected values
    truffleAssert.eventEmitted(txResult, 'NodeStatusUpdated', (ev) => {
      return ev._addr === postOfficeAddress && ev.isAuthorised === true && ev.isEnrollment === true;
    }, "NodeStatusUpdated event should be emitted with correct parameters indicating the Hospital is now an Enrollment Center");

    // Verify the updated status by retrieving the node's details
    const updatedNode = await biometricIdentityInstance.getNode(postOfficeAddress, { from: Main_Enrollment_Center });
    assert.equal(updatedNode[3], true, "Hospital node should be authorised");
    assert.equal(updatedNode[4], true, "Hospital node should be an Enrollment Center");
  });
  it('Register Comune Node bu Post Office', async () => {
    const tx = await biometricIdentityInstance.setNode(4, 'Comune', ComuneAddress, { from: postOfficeAddress });
    truffleAssert.eventEmitted(tx, 'NodeSet', (ev) => {
      return ev._ID.toNumber() === 4 && ev._name === "Comune" && ev._addr === ComuneAddress;
    });
  });

}); // End Node Status Update


describe("Preventing the gain ununaotriased access", () => {
    it('prevents unauthorized accounts from adding subjects', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.setSubject(4, 20220, 2002, { from: hospitalAddress }), // Hospital is not authorized as EC
        "Caller is not an Enrollment Center"
      );
});
    it('prevents unregistered accounts from adding subjects', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.setSubject(4, 20220, 2002, { from: whiteHatHackerAddress }), // Hospital is not authorized as EC
        "Caller is not an Enrollment Center"
      );
});
    it('prevents unauthorized accounts from updating subject information', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.updateSubject(1, 10112, 1002, { from: hospitalAddress }), // Hospital is not authorized as EC
          "Caller is not an Enrollment Center"
  );
});
    it('prevents unregistered accounts from updating subject information', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.updateSubject(1, 10112, 1002, { from: whiteHatHackerAddress }), // Hospital is not authorized as EC
          "Caller is not an Enrollment Center"
  );
});
    it('prevents unauthorized accounts from deleting subjects', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.deleteSubject(1, { from: hospitalAddress }), // Hospital is not authorized as EC
          "Caller is not an Enrollment Center"
  );
});
    it('prevents unregistered accounts from deleting subjects', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.deleteSubject(1, { from: whiteHatHackerAddress }), // Hospital is not authorized as EC
          "Caller is not an Enrollment Center"
  );
});
    it('prevents unauthorized accounts from registering nodes', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.setNode(3, 'New Node', whiteHatHackerAddress, { from: hospitalAddress }), // Assuming unauthorized
        "Caller is not an Enrollment Center"
  );
});
    it('prevents unregistered accounts from registering nodes', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.setNode(3, 'New Node', whiteHatHackerAddress, { from: whiteHatHackerAddress }), // Assuming unauthorized
        "Caller is not an Enrollment Center"
  );
});
    it('prevents unauthorized accounts from updating node status', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.updateNodeStatus(postOfficeAddress, false, false, { from: hospitalAddress }), // Hospital is not authorized as EC
        "Caller is not an Enrollment Center"
  );
});
    it('prevents unregistered accounts from updating node status', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.updateNodeStatus(postOfficeAddress, false, false, { from: whiteHatHackerAddress }), // White-Hat Hacker is not registered
        "Caller is not an Enrollment Center"
  );
});
    it('prevents unauthorized accounts from deleting nodes', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.deleteNode(postOfficeAddress, { from: hospitalAddress }), // // Hospital is not authorized as EC
        "Caller is not an Enrollment Center"
  );
});
    it('prevents unregistered accounts from deleting nodes', async () => {
      await truffleAssert.reverts(
        biometricIdentityInstance.deleteNode(postOfficeAddress, { from: whiteHatHackerAddress }), // White-Hat Hacker is not registered
        "Caller is not an Enrollment Center"
  );
});
}); // End of preventing the gain ununaotriased access tests
});

