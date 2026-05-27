const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting deployment to Sepolia...");

    // 1. Deploy KYCRegistry
    console.log("Deploying KYCRegistry...");
    const kycRegistry = await hre.ethers.deployContract("KYCRegistry");
    await kycRegistry.waitForDeployment();
    const kycAddress = await kycRegistry.getAddress();
    console.log(`KYCRegistry deployed to: ${kycAddress}`);

    // 2. Deploy MarketplaceContract
    console.log("Deploying MarketplaceContract...");
    const marketplace = await hre.ethers.deployContract("MarketplaceContract", [kycAddress]);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log(`MarketplaceContract deployed to: ${marketplaceAddress}`);

    // 3. Deploy SupplyChainEscrow
    console.log("Deploying SupplyChainEscrow...");
    const escrow = await hre.ethers.deployContract("SupplyChainEscrow", [kycAddress]);
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    console.log(`SupplyChainEscrow deployed to: ${escrowAddress}`);

    // Save addresses to .env file
    const envPath = path.join(__dirname, "../.env");
    let envContent = fs.readFileSync(envPath, "utf8");

    envContent = envContent.replace(/VITE_KYC_CONTRACT_ADDRESS=.*/, `VITE_KYC_CONTRACT_ADDRESS=${kycAddress}`);
    envContent = envContent.replace(/VITE_MARKETPLACE_CONTRACT_ADDRESS=.*/, `VITE_MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`);
    envContent = envContent.replace(/VITE_ESCROW_CONTRACT_ADDRESS=.*/, `VITE_ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);

    fs.writeFileSync(envPath, envContent);
    console.log("Contract addresses saved to .env");

    // Verify contracts (wait a bit for Etherscan to index)
    if (process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting 30 seconds before verification...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        try {
            await hre.run("verify:verify", {
                address: kycAddress,
                constructorArguments: [],
            });

            await hre.run("verify:verify", {
                address: marketplaceAddress,
                constructorArguments: [kycAddress],
            });

            await hre.run("verify:verify", {
                address: escrowAddress,
                constructorArguments: [kycAddress],
            });
        } catch (error) {
            console.error("Verification failed:", error);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
