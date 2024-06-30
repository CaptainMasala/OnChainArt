import { NextResponse } from 'next/server';
import axios from 'axios';
import { prisma } from '@/utils/prisma';
import fs from 'fs';
import path from 'path';
import qs from 'qs';
import { encodeAbiParameters } from 'viem';


const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
const verificationUrl = process.env.ETHERSCAN_API_URL;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request): Promise<Response> {
    try {
        const { contractId, contractAddress } = await req.json();

        // Fetch contract details from the database
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
        });

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        await prisma.contract.update({
            where: { id: contractId },
            data: { deployedContractAddress: contractAddress },
        });

        const { sourceCode, projectName, initialOwner, svgData } = contract;

        // Create standard JSON input
        const input = {
            language: 'Solidity',
            sources: {
                [`${projectName}.sol`]: {
                    content: sourceCode,
                },
                '@openzeppelin/contracts/token/ERC1155/ERC1155.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/token/ERC1155/ERC1155.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/access/Ownable.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/access/Ownable.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/utils/Context.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/Context.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/token/ERC1155/IERC1155.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/utils/introspection/ERC165.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/utils/Address.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/Address.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/interfaces/draft-IERC6093.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/utils/Arrays.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/Arrays.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/utils/introspection/IERC165.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/utils/StorageSlot.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/StorageSlot.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/utils/math/Math.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/math/Math.sol'), 'utf8'),
                },
                '@openzeppelin/contracts/utils/Base64.sol': {
                    content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/Base64.sol'), 'utf8'),
                },
            },
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode'],
                    },
                },
            },
        };

        const inputString = JSON.stringify(input);

        const constructorArguments = encodeAbiParameters(
            [
                { type: 'address', name: 'initialOwner' },
                { type: 'string', name: 'svgData' }
            ],
            [initialOwner as `0x${string}`, svgData]
        ).slice(2);

        const params = {
            module: 'contract',
            action: 'verifysourcecode',
            apikey: etherscanApiKey,
            contractaddress: contractAddress,
            sourceCode: inputString,
            codeformat: 'solidity-standard-json-input',
            contractname: `${projectName}.sol:${projectName}`,
            compilerversion: 'v0.8.26+commit.8a97fa7a',
            constructorArguments: constructorArguments
        };

        console.log("params", params)

        const response = await axios.post(verificationUrl!, qs.stringify(params));

        console.log(response)
        const { status: verificationStatus, message: verificationMessage, result: verificationResult } = response.data;

        const maxRetries = 5;
        const retryDelay = 2000;

        if (verificationStatus === '1') {
            let checkStatus;
            let checkMessage;
            let checkResult;
        
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                await delay(retryDelay);
                const checkStatusParams = {
                    module: 'contract',
                    action: 'checkverifystatus',
                    apikey: etherscanApiKey,
                    guid: verificationResult,
                };
        
                const checkStatusResponse = await axios.get(verificationUrl!, { params: checkStatusParams });
        
                ({ status: checkStatus, message: checkMessage, result: checkResult } = checkStatusResponse.data);
        
                if (checkStatus === '1' && checkResult === 'Pass - Verified') {
                    return NextResponse.json({ message: 'Verification successful' }, { status: 200 });
                }
            }
        
            return NextResponse.json({ error: 'Verification status check failed', message: { ...checkMessage, ...checkResult } }, { status: 500 });
        } else {
            return NextResponse.json({ error: 'Verification failed', message: { ...verificationMessage, ...verificationResult } }, { status: 500 });
        }
    } catch (error) {
        console.error('Verification Error:', error);
        return NextResponse.json({ error: 'Verification failed', details: error }, { status: 500, statusText: 'Internal Server Error' });
    }
}

export const dynamic = 'force-dynamic';
