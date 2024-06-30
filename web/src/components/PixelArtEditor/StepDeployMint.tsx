import { SymbolIcon } from '@radix-ui/react-icons';
import clsx from 'clsx';
import Button from '@/components/Button/Button';

export default function StepDeployMint() {
  return (
    <div
      className={clsx(
        'rounded-lg border border-boat-color-palette-line',
        'mb-8 bg-boat-footer-dark-gray p-8',
      )}
    >
      <h2 className="mb-5 w-full text-center text-2xl font-semibold text-white">
        Minting your nft...
      </h2>

      <div className="text-center text-6xl">⛓️🎨</div>

      <div className="my-4 text-center text-sm text-gray-400">
        Please confirm transaction in your wallet
      </div>
    </div>
  );
}
