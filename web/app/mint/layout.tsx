import { generateMetadata } from '@/utils/generateMetadata';

export const metadata = generateMetadata({
  title: 'Mint - BOAT',
  description:
    'Mint your onchain 16x16 pixel art',
  images: 'themes.png',
  pathname: 'mint',
});

export default async function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
