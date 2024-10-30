// src/index.js
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const cors = require('cors'); // Importar cors



dotenv.config(); // Cargar variables de entorno

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 3000;

// Crear un pool de conexiones
const pool = new Pool({
    host: 'localhost',
    port: '5433',
    user: 'postgres',
    password: '1234',
    database: 'TokenTia',
});

const generateToken = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

app.post('/tokens', async (req, res) => {
    const newToken = generateToken(); // Generar un nuevo token

    try {
        // Verificar si el token ya existe
        const checkResult = await pool.query('SELECT * FROM tokens WHERE token = $1', [newToken]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ error: 'Token duplicado. Generando uno nuevo.' });
        }

        // Insertar el nuevo token en la base de datos
        await pool.query('INSERT INTO tokens (token,utilizado,estado) VALUES ($1,$2,$3)', [newToken,'NO','S']);
        res.status(201).json({ token: newToken });
    } catch (error) {
        console.error('Error al crear el token:', error);
        res.status(500).send('Error al crear el token');
    }
});

app.post('/tokens/update-status', async (req, res) => {
    const { token } = req.body; // Obtener el token del cuerpo de la petición

    if (!token) {
        return res.status(400).json({ error: 'Token no proporcionado' });
    }

    try {
        // Actualizar el estado del token a 'S'
        const result = await pool.query(
            'UPDATE tokens SET estado = $1 WHERE token = $2',
            ['N', token]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Token no encontrado' });
        }

        res.status(200).json({ message: 'Estado del token actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el estado del token:', error);
        res.status(500).send('Error al actualizar el estado del token');
    }
});

app.put('/tokens/update-status', async (req, res) => {
    const { token, cliente } = req.body; // Obtener el token y cliente del cuerpo de la petición

    if (!token || !cliente) {
        return res.status(400).json({ error: 'Token y cliente no proporcionados' });
    }

    try {
        // Verificar el estado del token antes de actualizar
        const checkResult = await pool.query(
            'SELECT * FROM tokens WHERE token = $1 AND utilizado = $2 AND estado = $3',
            [token, 'N', 'S']
        );

        if (checkResult.rowCount === 0) {
            return res.status(400).json({ error: 'Token no válido para actualización' });
        }

        // Actualizar el token con el cliente y cambiar los estados
        await pool.query(
            'UPDATE tokens SET cliente = $1, estado = $2, utilizado = $3 WHERE token = $4',
            [cliente, 'N', true, token]
        );

        res.status(200).json({ message: 'Token actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el estado del token:', error);
        res.status(500).send('Error al actualizar el estado del token');
    }
});


// Ruta de ejemplo
app.get('/tokens', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tokens');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener tokens:', error);
        res.status(500).send('Error al obtener tokens');
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
