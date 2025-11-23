const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Inicializa Prisma para interactuar con la DB
const prisma = new PrismaClient();
const LIBRO_ID = 1; // ID fijo para asegurar que solo haya UN libro

app.use(express.json());
// Servir el editor (index.html) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public'))); 

// ===================================
// RUTA 1: OBTENER EL CONTENIDO DEL LIBRO
// ===================================
app.get('/api/libro', async (req, res) => {
    try {
        // 'upsert' intenta encontrar el libro (ID 1), si no existe, lo crea.
        const libro = await prisma.libro.upsert({
            where: { id: LIBRO_ID },
            update: {}, // No hacemos nada si lo encuentra
            create: { id: LIBRO_ID, titulo: "El Libro de Mi Novia", contenido: "" }, // Lo crea si es la primera vez
        });
        res.json({ contenido: libro.contenido });
    } catch (e) {
        console.error("Error al obtener el libro:", e);
        res.status(500).send("Error al obtener el libro");
    }
});

// ===================================
// RUTA 2: GUARDAR EL CONTENIDO DEL LIBRO
// ===================================
app.post('/api/libro', async (req, res) => {
    const { contenido } = req.body;
    
    if (typeof contenido !== 'string') {
        return res.status(400).send("Contenido inválido");
    }
    
    try {
        // Actualiza el contenido en la única fila del libro (ID 1)
        await prisma.libro.update({
            where: { id: LIBRO_ID },
            data: { contenido: contenido },
        });
        res.status(200).send('Guardado OK');
    } catch (e) {
        console.error("Error al guardar:", e);
        res.status(500).send("Error al guardar");
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});