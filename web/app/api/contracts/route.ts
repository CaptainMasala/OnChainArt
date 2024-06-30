import { NextResponse } from 'next/server';
import solc from 'solc';
import fs from 'fs';
import path from 'path';

import { prisma } from '@/utils/prisma';

/**
 * Handler for the /api/project/compile route, this route will compile the given Solidity contract with provided project name, SVG data, and initial owner.
 * @param req
 * @param res
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const { projectName, svgData, initialOwner } = await req.json();

    if (!projectName || !svgData || !initialOwner) {
      return NextResponse.json({ error: 'Project name, SVG data, and initial owner are required' }, { status: 400 });
    }

    const contractSource = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.25;

      import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
      import "@openzeppelin/contracts/access/Ownable.sol";
      import "@openzeppelin/contracts/utils/Base64.sol";

      contract ${projectName} is ERC1155, Ownable {
          string public name = "${projectName}";
          string private _svgData;
          uint256 public currentTokenId = 0;
          uint public mintPrice = 0.0005 ether;

          constructor(address initialOwner, string memory svgData) ERC1155("") Ownable(initialOwner) {
              _svgData = svgData;
          }

          function mint(uint256 quantity) external payable {
              uint256 cost = mintPrice;
              require(msg.value == quantity * cost, "Please send the exact ETH amount");
              uint256 newTokenId = currentTokenId;
              _mint(msg.sender, newTokenId, quantity, "");
              currentTokenId += 1;
          }

          function withdraw() external onlyOwner {
            (bool success, ) = msg.sender.call{value: address(this).balance}("");
            require(success, "Transfer failed.");
          }

          function uri(uint256 /* tokenId */) public view override returns (string memory) {
              string memory base64Image = Base64.encode(bytes(_svgData));

              string memory json = string(
                  abi.encodePacked(
                      '{"name":"${projectName}",',
                      '"description":"${projectName} is fully onchain 16x16 pixel art made using OnChainArt.xyz",',
                      '"image":"data:image/svg+xml;base64,', base64Image, '"}'
                  )
              );

              // Encode JSON data to base64
              string memory base64Json = Base64.encode(bytes(json));

              // Construct final URI
              return string(abi.encodePacked('data:application/json;base64,', base64Json));
          }
      }
    `;

    const sources = {
      [`${projectName}.sol`]: { content: contractSource },
      '@openzeppelin/contracts/token/ERC1155/ERC1155.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/token/ERC1155/ERC1155.sol'), 'utf8') },
      '@openzeppelin/contracts/access/Ownable.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/access/Ownable.sol'), 'utf8') },
      '@openzeppelin/contracts/utils/Context.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/Context.sol'), 'utf8') },
      '@openzeppelin/contracts/token/ERC1155/IERC1155.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol'), 'utf8') },
      '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol'), 'utf8') },
      '@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol'), 'utf8') },
      '@openzeppelin/contracts/utils/introspection/ERC165.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol'), 'utf8') },
      '@openzeppelin/contracts/utils/Address.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/Address.sol'), 'utf8') },
      '@openzeppelin/contracts/interfaces/draft-IERC6093.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol'), 'utf8') },
      '@openzeppelin/contracts/utils/Arrays.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/Arrays.sol'), 'utf8') },
      '@openzeppelin/contracts/utils/introspection/IERC165.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol'), 'utf8') },
      '@openzeppelin/contracts/utils/StorageSlot.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/StorageSlot.sol'), 'utf8') },
      '@openzeppelin/contracts/utils/math/Math.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/math/Math.sol'), 'utf8') },
      '@openzeppelin/contracts/utils/Base64.sol': { content: fs.readFileSync(path.resolve('./node_modules/@openzeppelin/contracts/utils/Base64.sol'), 'utf8') },
    };

    const input = {
      language: 'Solidity',
      sources,
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

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
      return NextResponse.json({ error: 'Contract compilation failed', details: output.errors }, { status: 500 });
    }

    const compiledContract = output.contracts[`${projectName}.sol`][projectName];
    const { abi, evm } = compiledContract;

    const abiString = JSON.stringify(abi);

    const contract = await prisma.contract.create({
      data: {
        projectName,
        sourceCode: contractSource,
        abi: abiString,
        bytecode: evm.bytecode.object,
        svgData,
        initialOwner,
        deployedContractAddress: null, // Set as null initially
      },
    });

    return NextResponse.json({ id: contract.id, abi, bytecode: evm.bytecode.object }, { status: 200 });
  } catch (error) {
    console.error('Error compiling contract:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });
  }
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const address = url.searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address query parameter is required' }, { status: 400 });
  }

  try {
    const contract = await prisma.contract.findUnique({
      where: { deployedContractAddress: address },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json(contract, { status: 200 });
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });
  }
}

export const dynamic = 'force-dynamic';
