require('dotenv').config();
const express = require('express');
const http = require('http');
const mysql = require('mysql2/promise');
const { Server } = require("socket.io");
const cors = require('cors');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});


app.use(cors());
app.use(express.json()); 


const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'votacao_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
const pool = mysql.createPool(dbConfig);


app.use((req, res, next) => {
    req.io = io;
    req.db = pool;
    return next();
});


io.on('connection', (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);

    socket.on('join_enquete', (enqueteId) => {
        socket.join(String(enqueteId)); // Garante que o ID da sala é uma string
        console.log(`Usuário ${socket.id} entrou na sala da enquete ${enqueteId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Usuário desconectado: ${socket.id}`);
    });
});




// Get, lista todas as enquetes
app.get('/api/enquetes', async (req, res) => {
    try {
        const [enquetes] = await req.db.query(`
            SELECT e.id, e.titulo, e.data_inicio, e.data_fim,
                   (CASE
                        WHEN NOW() < e.data_inicio THEN 'Não iniciada'
                        WHEN NOW() BETWEEN e.data_inicio AND e.data_fim THEN 'Em andamento'
                        ELSE 'Finalizada'
                    END) AS status
            FROM enquetes e
            ORDER BY e.data_inicio DESC
        `);
        res.json(enquetes);
    } catch (error) {
        console.error("Erro ao buscar enquetes:", error);
        res.status(500).json({ message: "Erro no servidor" });
    }
});

// Get, obtem uma enquete especifica e todas suas caracteristas pelo ID
app.get('/api/enquetes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [enquetes] = await req.db.query('SELECT * FROM enquetes WHERE id = ?', [id]);
        if (enquetes.length === 0) {
            return res.status(404).json({ message: "Enquete não encontrada" });
        }
        const [opcoes] = await req.db.query('SELECT id, descricao, votos FROM opcoes WHERE enquete_id = ?', [id]);
        res.json({ ...enquetes[0], opcoes });
    } catch (error) {
        console.error("Erro ao buscar detalhes da enquete:", error);
        res.status(500).json({ message: "Erro no servidor" });
    }
});

// Post, cria uma nova enquete
app.post('/api/enquetes', async (req, res) => {
    const { titulo, data_inicio, data_fim, opcoes } = req.body;

    if (!titulo || !data_inicio || !data_fim || !opcoes || opcoes.length < 3) {
        return res.status(400).json({ message: "Dados inválidos. A enquete precisa de um título, datas e no mínimo 3 opções." });
    }

    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO enquetes (titulo, data_inicio, data_fim) VALUES (?, ?, ?)',
            [titulo, data_inicio, data_fim]
        );
        const enqueteId = result.insertId;

        const opcoesValues = opcoes.map(desc => [enqueteId, desc]);
        await connection.query('INSERT INTO opcoes (enquete_id, descricao) VALUES ?', [opcoesValues]);

        await connection.commit();
        res.status(201).json({ message: "Enquete criada com sucesso!", id: enqueteId });
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao criar enquete:", error);
        res.status(500).json({ message: "Erro no servidor" });
    } finally {
        connection.release();
    }
});

// Atualiza enquete
app.put('/api/enquetes/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, data_inicio, data_fim } = req.body;

    if (!titulo || !data_inicio || !data_fim) {
        return res.status(400).json({ message: "Dados inválidos." });
    }

    try {
        await req.db.query(
            'UPDATE enquetes SET titulo = ?, data_inicio = ?, data_fim = ? WHERE id = ?',
            [titulo, data_inicio, data_fim, id]
        );
        res.status(200).json({ message: "Enquete atualizada com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar enquete:", error);
        res.status(500).json({ message: "Erro no servidor" });
    }
});

// [DELETE]
app.delete('/api/enquetes/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM opcoes WHERE enquete_id = ?', [id]);
        await connection.query('DELETE FROM enquetes WHERE id = ?', [id]);
        await connection.commit();
        res.status(200).json({ message: "Enquete deletada com sucesso." });
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao deletar enquete:", error);
        res.status(500).json({ message: "Erro no servidor." });
    } finally {
        connection.release();
    }
});

// Vote
app.post('/api/opcoes/:id_opcao/votar', async (req, res) => {
    const { id_opcao } = req.params;
    const { io, db } = req;

    try {
        const [rows] = await db.query(
            `SELECT e.data_inicio, e.data_fim, o.enquete_id FROM opcoes o JOIN enquetes e ON o.enquete_id = e.id WHERE o.id = ?`,
            [id_opcao]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Opção não encontrada." });
        }

        const enquete = rows[0];
        const agora = new Date();
        if (agora < new Date(enquete.data_inicio) || agora > new Date(enquete.data_fim)) {
            return res.status(403).json({ message: "Esta enquete não está ativa para votação." });
        }

        await db.query('UPDATE opcoes SET votos = votos + 1 WHERE id = ?', [id_opcao]);
        const [novosResultados] = await db.query('SELECT id, descricao, votos FROM opcoes WHERE enquete_id = ?', [enquete.enquete_id]);
        
        io.to(String(enquete.enquete_id)).emit('atualizacao_votos', novosResultados);

        res.status(200).json({ message: "Voto computado com sucesso!" });
    } catch (error) {
        console.error("Erro ao votar:", error);
        res.status(500).json({ message: "Erro no servidor ao processar o voto." });
    }
});


// Incialiazacao
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

