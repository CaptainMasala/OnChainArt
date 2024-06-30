'use client';

import dynamic from 'next/dynamic';
import Banner from '@/components/layout/banner/banner';
import Footer from '@/components/layout/footer/Footer';
import Header from '@/components/layout/header/Header';
import Main from '@/components/layout/Main';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const MintContract = dynamic(
  async () => import('app/mint/_components/ContractMint').then((mod) => mod),
  {
    ssr: false,
  },
);

/**
 * Use the page component to wrap the components
 * that you want to render on the page.
 */
export default function MintPage() {

  const params = useParams();
  const contractAddress = params?.slug;

  const [contractInfo, setContractInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contractAddress) {
      const fetchContractInfo = async () => {
        try {
          const response = await fetch(`/api/contracts?address=${contractAddress}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch contract information');
          }

          const data = await response.json();
          setContractInfo(data);
        } catch (error: any) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchContractInfo();
    }
  }, [contractAddress]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Header />
      <Main>
        <div>
          <h1>Contract Address: {contractAddress}</h1>
        </div>
        <MintContract contractInfo={contractInfo} />
      </Main>
      <Footer />
    </>
  );
}
