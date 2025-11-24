/*
  Warnings:

  - The primary key for the `Libro` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Libro` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuarioId]` on the table `Libro` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usuarioId` to the `Libro` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Libro_id_key";

-- AlterTable
ALTER TABLE "Libro" DROP CONSTRAINT "Libro_pkey",
DROP COLUMN "id",
ADD COLUMN     "usuarioId" INTEGER NOT NULL,
ALTER COLUMN "titulo" SET DEFAULT 'Mi Libro Personal',
ADD CONSTRAINT "Libro_pkey" PRIMARY KEY ("usuarioId");

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Libro_usuarioId_key" ON "Libro"("usuarioId");

-- AddForeignKey
ALTER TABLE "Libro" ADD CONSTRAINT "Libro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
