import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  if (req.method === 'GET') {
    try {
      const contract = await prisma.contract.findUnique({
        where: { address: String(address) },
      });

      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      res.status(200).json(contract);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve contract' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}