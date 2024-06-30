import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    try {
      const contract = await prisma.contract.create({
        data: {
          address,
        },
      });

      res.status(200).json(contract);
    } catch (error) {
      res.status(500).json({ error: 'Failed to store contract address' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}