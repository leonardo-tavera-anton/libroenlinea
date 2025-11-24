// server.js

const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const session = require('express-session'); // NUEVO: Para gestionar sesiones de usuario
const bcrypt = require('bcryptjs');         // NUEVO: Para encriptar contraseñas

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware y Configuración de Sesiones
app.use(express.json());
app.use(session({
    // Usamos una variable de entorno para la clave secreta (necesitas SESSION_SECRET en .env)
    secret: process.env.SESSION_SECRET || 'mi_clave_secreta_de_fallback_999', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // La sesión dura 24 horas
}));

// Middleware de autenticación: Verifica si el usuario está logueado
function requireLogin(req, res, next) {
    if (req.session.userId) {
        next(); // El usuario está logueado, continúa a la ruta
    } else {
        res.status(401).json({ error: 'No autorizado. Por favor, inicia sesión.' });
    }
}

// ===============================================
// RUTAS DE AUTENTICACIÓN
// ===============================================

// 1. REGISTRO de nuevo usuario
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Encripta la contraseña
        const user = await prisma.usuario.create({
            data: { username, password: hashedPassword }
        });
        
        // Inicia sesión automáticamente
        req.session.userId = user.id; 
        res.status(201).json({ message: 'Registro exitoso', userId: user.id });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') { // Error de columna única (username ya existe)
            return res.status(409).json({ error: 'Nombre de usuario ya existe.' });
        }
        res.status(500).json({ error: 'Error en el registro.' });
    }
});

// 2. LOGIN de usuario existente
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.usuario.findUnique({ where: { username } });
        
        // Verifica que el usuario exista y que la contraseña encriptada coincida
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }
        
        // Crea la sesión
        req.session.userId = user.id; 
        res.status(200).json({ message: 'Login exitoso', userId: user.id });
    } catch (error) {
        res.status(500).json({ error: 'Error en el login.' });
    }
});

// 3. LOGOUT (Cerrar sesión)
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Error al cerrar sesión.' });
        res.status(200).json({ message: 'Sesión cerrada.' });
    });
});

// 4. VERIFICAR SESIÓN (Usado por el frontend para saber si mostrar el editor)
app.get('/api/check-session', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, userId: req.session.userId });
    } else {
        res.json({ loggedIn: false });
    }
});

// ===============================================
// RUTAS DE LIBRO (PROTEGIDAS)
// ===============================================

// CARGAR CONTENIDO (Requiere Login)
app.get('/api/libro', requireLogin, async (req, res) => {
    // Obtenemos el ID del usuario directamente de la sesión
    const userId = req.session.userId; 
    
    try {
        // Buscamos el libro usando el usuarioId (que es la clave primaria)
        const libro = await prisma.libro.findUnique({
            where: { usuarioId: userId }, 
        });

        res.json({ 
            contenido: libro ? libro.contenido : "Empieza a escribir aquí...",
        });
    } catch (error) {
        console.error('Error al obtener el libro:', error);
        res.status(500).json({ error: 'Error al obtener el libro.' });
    }
});

// GUARDAR CONTENIDO (Requiere Login)
app.post('/api/libro', requireLogin, async (req, res) => {
    const { contenido } = req.body;
    const userId = req.session.userId; // Obtenemos el ID del usuario logueado

    try {
        // Usamos upsert: si el libro existe, lo actualiza; si no, lo crea.
        const libroActualizado = await prisma.libro.upsert({
            where: { usuarioId: userId },
            update: { contenido: contenido },
            create: { 
                usuarioId: userId, // Usamos el ID del usuario como clave
                titulo: "Libro Personal", 
                contenido: contenido 
            },
        });

        res.status(200).json({ message: 'Guardado exitoso' });
    } catch (error) {
        console.error('Error al guardar:', error);
        res.status(500).json({ error: 'Error al guardar.' });
    }
});

// Sirve archivos estáticos (index.html)
app.use(express.static(path.join(__dirname, 'public'))); 

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});