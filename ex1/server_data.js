const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// Logger
app.use(function(req, res, next) {
    var d = new Date().toISOString().substring(0, 16);
    console.log(req.method + " " + req.url + " " + d);
    next();
});

// 1. Conexão ao MongoDB
const nomeBD = "autoRepair";
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`;
mongoose.connect(mongoHost)
    .then(() => console.log(`MongoDB: liguei-me à base de dados ${nomeBD}.`))
    .catch(err => console.error('Erro na ligação ao MongoDB:', err));

// 2. Esquema flexível para a coleção repairs
const repairsSchema = new mongoose.Schema({}, { strict: false, collection: 'repairs', versionKey: false });
const Repairs = mongoose.model('Repairs', repairsSchema);


// 3. Rotas
// IMPORTANTE: as rotas estáticas (/matrículas e /interv) têm de vir
// ANTES da rota dinâmica /:id para não serem interpretadas como um id.

// GET /repairs/matrículas - lista de matrículas (sem repetições, ordenada alfabeticamente)
app.get('/repairs/matrículas', async (req, res) => {
    try {
        const matriculas = await Repairs.distinct('viatura.matricula');
        matriculas.sort();
        res.json(matriculas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /repairs/interv - lista de intervenções (triplos sem repetições, ordenados por código)
app.get('/repairs/interv', async (req, res) => {
    try {
        const results = await Repairs.aggregate([
            { $unwind: '$intervencoes' },
            {
                $group: {
                    _id: '$intervencoes.codigo',
                    nome: { $first: '$intervencoes.nome' },
                    descricao: { $first: '$intervencoes.descricao' }
                }
            },
            {
                $project: {
                    _id: 0,
                    codigo: '$_id',
                    nome: 1,
                    descricao: 1
                }
            },
            { $sort: { codigo: 1 } }
        ]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /repairs - lista de todos os registos
// GET /repairs?ano=YYYY - reparações do ano YYYY
// GET /repairs?marca=VRUM - reparações da marca VRUM
app.get('/repairs', async (req, res) => {
    try {
        const { ano, marca } = req.query;
        let filter = {};

        if (ano) {
            // Filtrar por ano usando regex na string da data (formato YYYY-MM-DD)
            filter['data'] = { $regex: `^${ano}-` };
        }

        if (marca) {
            filter['viatura.marca'] = marca;
        }

        const results = await Repairs.find(filter);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /repairs/:id - registo com o identificador id
app.get('/repairs/:id', async (req, res) => {
    try {
        const doc = await Repairs.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Registo não encontrado.' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ error: 'ID inválido ou erro de sistema.' });
    }
});

// POST /repairs - acrescenta um registo novo à BD
app.post('/repairs', async (req, res) => {
    try {
        // Garantir que nr_intervencoes é consistente com o array
        const body = req.body;
        if (body.intervencoes && Array.isArray(body.intervencoes)) {
            body.nr_intervencoes = body.intervencoes.length;
        }
        const newDoc = new Repairs(body);
        const saved = await newDoc.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /repairs/:id - elimina o registo com o identificador id
app.delete('/repairs/:id', async (req, res) => {
    try {
        const deleted = await Repairs.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Registo não encontrado.' });
        res.json({ message: 'Registo eliminado com sucesso.', id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 4. Arrancar o servidor
app.listen(16025, () => {
    console.log('API de dados a correr em http://localhost:16025');
    console.log('Rotas disponíveis:');
    console.log('  GET    /repairs');
    console.log('  GET    /repairs?ano=YYYY');
    console.log('  GET    /repairs?marca=VRUM');
    console.log('  GET    /repairs/matriculas');
    console.log('  GET    /repairs/interv');
    console.log('  GET    /repairs/:id');
    console.log('  POST   /repairs');
    console.log('  DELETE /repairs/:id');
});