var BiometricIdentity = artifacts.require("BiometricIdentity");

module.exports = function(deployer) {
  deployer.deploy(BiometricIdentity);
};

