// server.js

const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json()); 

// Sirve archivos estáticos (como index.html)
app.use(express.static(path.join(__dirname, 'public'))); 

// Ruta principal, sirve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Función auxiliar para obtener ID BigInt
// Convierte el string 'user_1700...' a un BigInt (tipo de dato de JS)
function getBigIntIdFromUserId(userIdString) {
    if (!userIdString || !userIdString.startsWith('user_')) {
        return BigInt(0); 
    }
    const numericPart = userIdString.replace('user_', '');
    // Usamos BigInt() para manejar números muy grandes (necesario para el campo BigInt en PostgreSQL)
    return BigInt(numericPart); 
}


// ===============================================
// RUTA 1: CARGAR CONTENIDO (GET)
// ===============================================
app.get('/api/libro', async (req, res) => {
    const userId = req.query.userId;
    
    if (!userId) {
        return res.status(400).json({ error: "UserID es requerido para cargar el libro." });
    }

    const bigIntId = getBigIntIdFromUserId(userId);
    
    try {
        // Buscamos el libro usando el ID BigInt único
        const libro = await prisma.libro.findUnique({
            where: { id: bigIntId }, 
        });

        // Si el libro existe, retornamos su contenido. Si no, retornamos un contenido vacío.
        res.json({ 
            contenido: libro ? libro.contenido : "Empieza a escribir aquí...",
        });
    } catch (error) {
        console.error('Error al obtener el libro:', error);
        res.status(500).json({ error: 'Error al obtener el libro.', details: error.message });
    }
});

// ===============================================
// RUTA 2: GUARDAR CONTENIDO (POST)
// ===============================================
app.post('/api/libro', async (req, res) => {
    const { contenido, userId } = req.body; 

    if (!userId) {
        return res.status(400).json({ error: "UserID es requerido para guardar." });
    }

    const bigIntId = getBigIntIdFromUserId(userId);

    try {
        // Guardamos o actualizamos (upsert) el libro usando el ID BigInt
        const libroActualizado = await prisma.libro.upsert({
            where: { id: bigIntId },
            update: { contenido: contenido },
            create: { 
                id: bigIntId, // Crea un nuevo registro con el ID único
                titulo: `Libro de ${userId}`, 
                contenido: contenido 
            },
        });

        res.status(200).json({ message: 'Guardado exitoso' });
    } catch (error) {
        console.error('Error al guardar:', error);
        res.status(500).json({ error: 'Error al guardar.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});