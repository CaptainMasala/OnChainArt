import { useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { Abi, TransactionExecutionError } from 'viem';
import {
  useAccount,
  usePublicClient,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from 'wagmi';
import Button from '@/components/Button/Button';
import { EXPECTED_CHAIN } from '@/constants';
import { useCustom1155Contract, useCustomOnChain1155Contract } from '../_contracts/useCustom1155Contract';
import { MintSteps } from './ContractDemo';
import StepMintComplete from './StepMintComplete';
import StepMintProcessing from './StepMintProcessing';
import StepOutOfGas from './StepOutOfGas';

type StartMintProps = {
  setMintStep: React.Dispatch<React.SetStateAction<MintSteps>>;
  mintStep: MintSteps;
  collectionName: string | null;
  abi: any;
  contractAddress: any
};

export default function StepStartMint({ setMintStep, mintStep, collectionName, abi, contractAddress }: StartMintProps) {
  const { chain } = useAccount();
  const { address } = useAccount();
  const contract = useCustomOnChain1155Contract(abi, contractAddress);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const onCorrectNetwork = chain?.id === EXPECTED_CHAIN.id;

  // const { data: mintData } = useSimulateContract({
  //   address: contract.status === 'ready' ? contractAddress : undefined,
  //   abi: abi,
  //   functionName: 'mint',
  //   args: address ? [address, BigInt(1)] : undefined,
  //   value: mintPriceInWei,
  //   query: {
  //     enabled: onCorrectNetwork,
  //   },
  // });

  // const { writeContract: performMint, error: errorMint, data: dataMint } = useWriteContract();

  // const { status: transactionStatus } = useWaitForTransactionReceipt({
  //   hash: dataMint,
  //   query: {
  //     enabled: !!dataMint,
  //   },
  // });

  // useEffect(() => {
  //   if (transactionStatus === 'success') {
  //     setMintStep(MintSteps.MINT_COMPLETE_STEP);
  //   }

  //   if (errorMint) {
  //     const isOutOfGas =
  //       errorMint instanceof TransactionExecutionError &&
  //       errorMint.message.toLowerCase().includes('out of gas');
  //     setMintStep(isOutOfGas ? MintSteps.OUT_OF_GAS_STEP : MintSteps.START_MINT_STEP);
  //   }
  // }, [transactionStatus, setMintStep, errorMint]);

  // const handleMint = useCallback(() => {
  //   console.log('clicked', mintData)
  //   if (mintData?.request) {
  //     performMint?.(mintData?.request);
  //     setMintStep(MintSteps.MINT_PROCESSING_STEP);
  //   }
  // }, [mintData, performMint, setMintStep]);

  const handleMint = async () => {
    setMintStep(MintSteps.START_MINT_STEP)
    const mintPriceInEther = 0.0005;
    const mintPriceInWei = BigInt(mintPriceInEther * 10 ** 18);


    const mintHash = await walletClient?.writeContract({
      address: contractAddress,
      abi: JSON.parse(abi) as Abi,
      functionName: 'mint',
      args: [1],
      value: mintPriceInWei
    });

    setMintStep(MintSteps.MINT_PROCESSING_STEP)


    console.log("mint hash", mintHash)


    const mintReceipt = await publicClient?.waitForTransactionReceipt({
      hash: mintHash!
    });

    console.log("mint receipt", mintReceipt)
    setMintStep(MintSteps.MINT_COMPLETE_STEP)

  }

  return (
    <>
      {mintStep === MintSteps.MINT_PROCESSING_STEP && <StepMintProcessing />}
      {mintStep === MintSteps.OUT_OF_GAS_STEP && <StepOutOfGas setMintStep={setMintStep} />}
      {mintStep === MintSteps.MINT_COMPLETE_STEP && (
        <StepMintComplete setMintStep={setMintStep} collectionName={collectionName} contractAddress={contractAddress} />
      )}

      {mintStep === MintSteps.START_MINT_STEP && (
        <Button
          buttonContent="Mint"
          onClick={handleMint}
          disabled={!onCorrectNetwork}
          className={clsx('my-4', onCorrectNetwork ? 'bg-white' : 'bg-gray-400')}
        />
      )}

      {mintStep === MintSteps.MINT_COMPLETE_STEP && (
        <Button
          buttonContent="Mint Another"
          onClick={handleMint}
          disabled={!onCorrectNetwork}
          className={clsx('my-4', onCorrectNetwork ? 'bg-white' : 'bg-gray-400')}
        />
      )}

    </>
  );
}
