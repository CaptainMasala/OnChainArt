'use client';
import { useAccount } from 'wagmi';
import Footer from '@/components/layout/footer/Footer';
import Header from '@/components/layout/header/Header';
import PixelArtEditor from '@/components/PixelArtEditor/PixelArtEditor';

/**
 * Use the page component to wrap the components
 * that you want to render on the page.
 */
export default function HomePage() {
  const account = useAccount();

  return (
    <>
      <Header />
      <main className="container mx-auto flex flex-col px-8 py-16">
        {/* <div>
          <h2 className="text-xl">Developer information</h2>
          <br />
          <h3 className="text-lg">Account</h3>
          <ul>
            <li>
              <b>status</b>: {account.status}
            </li>
            <li>
              <b>addresses</b>: {JSON.stringify(account.addresses)}
            </li>
            <li>
              <b>chainId</b>: {account.chainId}
            </li>
          </ul>
        </div> */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-800">
          <PixelArtEditor className="w-full max-w-4xl my-8" />
        </div>
      </main>
      {/* <Footer /> */}
    </>
  );
}
