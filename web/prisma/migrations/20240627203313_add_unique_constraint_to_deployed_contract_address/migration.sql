/*
  Warnings:

  - A unique constraint covering the columns `[deployedContractAddress]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Contract_deployedContractAddress_key" ON "Contract"("deployedContractAddress");
