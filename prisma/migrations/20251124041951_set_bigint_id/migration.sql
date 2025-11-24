-- CreateTable
CREATE TABLE "Libro" (
    "id" BIGINT NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT 'Libro de Usuario Privado',
    "contenido" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Libro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Libro_id_key" ON "Libro"("id");
