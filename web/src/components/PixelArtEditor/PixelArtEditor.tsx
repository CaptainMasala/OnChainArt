import React, { useState, useEffect, MouseEventHandler } from 'react';
import clsx from 'clsx';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { Abi, Account, formatEther } from 'viem';
import StepDeployProcessing from './StepDeployProcessing';
import StepDeployComplete from './StepDeployComplete';
import StepDeployVerifying from './StepDeployVerifying';
import StepDeployMint from './StepDeployMint';

type PixelArtEditorProps = {
  className?: string;
};

type CellProps = {
  size: number;
  color: string;
  onClick: MouseEventHandler<HTMLDivElement>;
};

export enum DeploySteps {
  START_DEPLOY_STEP,
  DEPLOY_PROCESSING_STEP,
  DEPLOY_VERIFICATION_STEP,
  DEPLOY_MINT_STEP,
  DEPLOY_COMPLETE_STEP,
}

const Cell: React.FC<CellProps> = ({ size, color, onClick }) => (
  <div
    onClick={onClick}
    className={clsx('border border-gray-300', 'hover:brightness-75 transition-colors duration-150')}
    style={{ backgroundColor: color, width: size, height: size }}
  />
);

const PixelArtEditor: React.FC<PixelArtEditorProps> = ({ className }) => {
  const gridSize = 16;
  const totalCells = gridSize * gridSize;
  const [cells, setCells] = useState(Array(totalCells).fill('#ffffff'));
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [cellSize, setCellSize] = useState(40); // Default cell size

  const [projectName, setProjectName] = useState('');
  const [contractAddress, setContractAddress] = useState<`0x${string}`>('0x');

  const [deployStep, setDeployStep] = useState<DeploySteps>(DeploySteps.START_DEPLOY_STEP);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const handleCellClick = (index: number) => {
    const newCells = [...cells];
    newCells[index] = selectedColor;
    setCells(newCells);
  };

  const clearGrid = () => {
    setCells(Array(totalCells).fill('#ffffff'));
  };

  const convertToSVG = () => {
    const svgRows = [];
    for (let i = 0; i < gridSize; i++) {
      const row = cells.slice(i * gridSize, (i + 1) * gridSize)
        .map((color, j) => `<rect width="1" height="1" x="${j}" y="${i}" fill="${color}" />`)
        .join('');
      svgRows.push(row);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridSize} ${gridSize}" shape-rendering="crispEdges" width="512" height="512">${svgRows.join('')}</svg>`;
  };

  const deployToBlockchain = async () => {
    if (!isConnected) {
      console.log('Wallet is not connected');
      return;
    }

    setDeployStep(DeploySteps.DEPLOY_PROCESSING_STEP);

    try {
      const svgData = convertToSVG();
      const initialOwner = address

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectName, svgData, initialOwner }),
      });

      const { id, abi, bytecode } = await response.json();

      const hash = await walletClient?.deployContract({
        abi: abi as Abi,
        bytecode,
        args: [initialOwner, svgData],
      });

      console.log("hash", hash)

      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: hash!
      });

      console.log("receipt", receipt)

      if (receipt?.status === 'reverted') {
        console.error('Transaction failed');
        return;
      }

      const contractAdd = receipt?.contractAddress!
      setContractAddress(contractAdd);

      setDeployStep(DeploySteps.DEPLOY_VERIFICATION_STEP)

      // Call verification API
      const verifyResponse = await fetch('/api/contracts/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: id,
          contractAddress: contractAdd,
        }),
      });

      const verifyResult = await verifyResponse.json();
      console.log('Verification Result:', verifyResult);

      const mintPriceInEther = 0.0005;
      const mintPriceInWei = BigInt(mintPriceInEther * 10 ** 18);

      setDeployStep(DeploySteps.DEPLOY_MINT_STEP)

      const mintHash = await walletClient?.writeContract({
        address: contractAdd,
        abi: abi as Abi,
        functionName: 'mint',
        args: [1],
        value: mintPriceInWei
      });

      console.log("mint hash", mintHash)

  
      const mintReceipt = await publicClient?.waitForTransactionReceipt({
        hash: mintHash!
      });

      console.log("mint receipt", mintReceipt)

  
      if (mintReceipt?.status === 'reverted') {
        console.error('Minting transaction failed');
        return;
      }

      setDeployStep(DeploySteps.DEPLOY_COMPLETE_STEP)

    } catch (error) {
      console.error('Error deploying pixel art:', error);
    }
  };

  useEffect(() => {
    const updateCellSize = () => {
      const screenWidth = window.innerWidth;
      const newSize = Math.min(40, screenWidth / (gridSize + 2)); // 40px max size, adding some padding
      setCellSize(newSize);
    };

    window.addEventListener('resize', updateCellSize);
    updateCellSize(); // Initial size calculation

    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  return (
    <div className={clsx('flex flex-col lg:flex-row', className)}>
      <div className="flex-1 grid grid-cols-16 gap-0">
        {cells.map((color, index) => (
          <Cell
            key={index}
            size={cellSize}
            color={color}
            onClick={() => handleCellClick(index)}
          />
        ))}
      </div>
      <div className="lg:ml-4 flex flex-col lg:flex-col items-center space-y-4 w-full lg:w-64 transition-all duration-300 bg-gray-200 bg-opacity-50 p-4 border-t lg:border-t-0 lg:border-l">
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-10 h-10 p-0 border-none cursor-pointer"
        />
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Project Name"
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />
        <button
          onClick={clearGrid}
          className={clsx(
            'px-4 py-2',
            'bg-red-500 text-white rounded',
            'hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50'
          )}
        >
          Clear
        </button>
       {deployStep === DeploySteps.START_DEPLOY_STEP && <button
          onClick={deployToBlockchain}
          className={clsx(
            'px-4 py-2',
            'bg-blue-500 text-white rounded',
            'hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
          )}
        >
          Deploy
        </button>}
        {deployStep === DeploySteps.DEPLOY_PROCESSING_STEP && <StepDeployProcessing />}
        {deployStep === DeploySteps.DEPLOY_VERIFICATION_STEP && <StepDeployVerifying />}
        {deployStep === DeploySteps.DEPLOY_MINT_STEP && <StepDeployMint />}
        {deployStep === DeploySteps.DEPLOY_COMPLETE_STEP && <StepDeployComplete collectionName={projectName} contractAddress={contractAddress} setDeployStep={setDeployStep} />}
      </div>
    </div>
  );
};

export default PixelArtEditor;
