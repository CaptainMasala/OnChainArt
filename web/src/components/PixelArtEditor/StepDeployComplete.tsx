import { useCallback } from 'react';
import clsx from 'clsx';
import Button from '@/components/Button/Button';
import { DeploySteps } from './PixelArtEditor';

type DeployCompleteStepProps = {
  collectionName: string | null;
  contractAddress: string | null;
  setDeployStep: React.Dispatch<React.SetStateAction<DeploySteps>>;
};

export default function StepDeployComplete({ collectionName, contractAddress, setDeployStep }: DeployCompleteStepProps) {

  const handleDeployAnother = useCallback(() => {
    setDeployStep(DeploySteps.START_DEPLOY_STEP);
  }, [setDeployStep]);

  return (
    <div
      className={clsx(
        'rounded-lg border border-boat-color-palette-line',
        'mb-8 bg-boat-footer-dark-gray p-8',
      )}
    >
      <h2 className="mb-5 w-full text-center text-2xl font-semibold text-white">
        Congrats! Successfully deployed {collectionName}
      </h2>
      <div className="text-center text-6xl">🎉</div>
      <div className="my-4 text-center text-md text-white-400">
        Mint <a href={`http://localhost:3000/mint/${contractAddress}`} target="_blank" rel="noopener noreferrer">here</a>
      </div>
      <div className="my-4 text-center text-md text-white-400">
        Find on <a href={`https://sepolia.basescan.org/address/${contractAddress}`} target="_blank" rel="noopener noreferrer">explorer</a>
      </div>
      <Button buttonContent="Make another NFT" onClick={handleDeployAnother} />
    </div>
  );
}
