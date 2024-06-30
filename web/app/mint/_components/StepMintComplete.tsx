import { useCallback } from 'react';
import clsx from 'clsx';
import Button from '@/components/Button/Button';
import { MintSteps } from './ContractDemo';

type MintCompleteStepProps = {
  setMintStep: React.Dispatch<React.SetStateAction<MintSteps>>;
  collectionName: string | null;
  contractAddress: string | null
};

export default function StepMintComplete({ setMintStep, collectionName, contractAddress }: MintCompleteStepProps) {
  const handleMintAnother = useCallback(() => {
    setMintStep(MintSteps.START_MINT_STEP);
  }, [setMintStep]);

  return (
    <div
      className={clsx(
        'rounded-lg border border-boat-color-palette-line',
        'mb-8 bg-boat-footer-dark-gray p-8',
      )}
    >
      <h2 className="mb-5 w-full text-center text-2xl font-semibold text-white">
        Congrats! You minted {collectionName}
      </h2>
      <div className="text-center text-6xl">🎉</div>
      <div className="my-4 text-center text-sm text-gray-400">
        Find on <a href={`https://testnets.opensea.io/assets/base-sepolia/${contractAddress}/`} target="_blank" rel="noopener noreferrer">Opensea</a> 
      </div>
      {/* <Button buttonContent="Mint another NFT" onClick={handleMintAnother} /> */}
    </div>
  );
}
