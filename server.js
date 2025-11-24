// server.js

const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json()); // Para procesar JSON en peticiones POST

// Sirve archivos estáticos (como index.html)
app.use(express.static(path.join(__dirname, 'public'))); 

// Ruta principal, sirve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Función auxiliar para obtener ID Numérico
// Transforma el string 'user_1700...' a un número entero
function getNumericIdFromUserId(userIdString) {
    // Si no es un string que comienza con 'user_', retorna 0 (podría ser un ID fijo)
    if (!userIdString || !userIdString.startsWith('user_')) {
        return 0; 
    }
    // Extraemos solo la parte numérica y la convertimos a entero
    const numericPart = userIdString.replace('user_', '');
    return parseInt(numericPart) || 0; // Aseguramos que siempre sea un número (o 0)
}


// ===============================================
// RUTA 1: CARGAR CONTENIDO (GET)
// ===============================================
app.get('/api/libro', async (req, res) => {
    // Extraemos el userId del parámetro de consulta (ej: /api/libro?userId=user_...)
    const userId = req.query.userId;
    
    if (!userId) {
        return res.status(400).json({ error: "UserID es requerido para cargar el libro." });
    }

    const numericId = getNumericIdFromUserId(userId);
    
    try {
        // Buscamos el libro usando el ID numérico único
        const libro = await prisma.libro.findUnique({
            where: { id: numericId }, 
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
    // Extraemos el contenido y el userId del cuerpo de la petición
    const { contenido, userId } = req.body; 

    if (!userId) {
        return res.status(400).json({ error: "UserID es requerido para guardar." });
    }

    const numericId = getNumericIdFromUserId(userId);

    try {
        // Guardamos el libro usando upsert, indexado por el ID numérico
        const libroActualizado = await prisma.libro.upsert({
            where: { id: numericId },
            update: { contenido: contenido },
            create: { 
                id: numericId, // Crea un nuevo registro con el ID único
                titulo: `Libro de ${userId}`, 
                contenido: contenido 
            },
        });

        res.status(200).json({ message: 'Guardado exitoso' });
    } catch (error) {
        console.error('Error al guardar:', error);
        // Si hay un error, mostramos el código P2021 si la tabla no existe
        if (error.code === 'P2021') {
             res.status(500).json({ error: 'Error al guardar. La tabla Libro no existe en la base de datos (P2021).', details: error.message });
        } else {
             res.status(500).json({ error: 'Error al guardar.', details: error.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});