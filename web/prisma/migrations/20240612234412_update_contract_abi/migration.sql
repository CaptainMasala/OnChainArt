/*
  Warnings:

  - You are about to drop the column `address` on the `Contract` table. All the data in the column will be lost.
  - Added the required column `abi` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bytecode` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialOwner` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectName` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceCode` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `svgData` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectName" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "abi" TEXT NOT NULL,
    "bytecode" TEXT NOT NULL,
    "svgData" TEXT NOT NULL,
    "initialOwner" TEXT NOT NULL,
    "deployedContractAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Contract" ("createdAt", "id") SELECT "createdAt", "id" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
