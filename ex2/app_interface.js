const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Configurações do Express
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public'));

// URL da API de dados
const API_URL = process.env.API_URL || "http://localhost:16025";

// Rota principal - lista de todas as reparações
app.get('/', (req, res) => {
    const d = new Date().toISOString().substring(0, 16);

    axios.get(API_URL + '/repairs')
        .then(response => {
            res.render('index', {
                list: response.data,
                date: d
            });
        })
        .catch(err => {
            res.status(500).render('error', {
                message: "Erro ao obter a lista de reparações.",
                error: err,
                date: d
            });
        });
});

// Rota para registo individual ou marca
// Como /:id e /:marca partilham o mesmo segmento de rota,
// tentamos primeiro obter por _id; se falhar (ObjectId inválido ou não encontrado)
// tratamos o parâmetro como nome de marca.
app.get('/:param', (req, res) => {
    const d = new Date().toISOString().substring(0, 16);
    const param = req.params.param;

    // ObjectIds do MongoDB têm exactamente 24 caracteres hexadecimais
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(param);

    if (isObjectId) {
        // Tenta obter o registo pelo _id
        axios.get(`${API_URL}/repairs/${param}`)
            .then(response => {
                res.render('repair', {
                    r: response.data,
                    date: d
                });
            })
            .catch(() => {
                res.status(404).render('error', {
                    message: `Nenhum registo encontrado com o id: ${param}`,
                    error: {},
                    date: d
                });
            });
    } else {
        // Trata o parâmetro como nome de marca
        axios.get(`${API_URL}/repairs?marca=${encodeURIComponent(param)}`)
            .then(response => {
                const registos = response.data;

                if (registos.length === 0) {
                    return res.status(404).render('error', {
                        message: `Nenhuma reparação encontrada para a marca: ${param}`,
                        error: {},
                        date: d
                    });
                }

                // Recolher modelos únicos desta marca
                const modelos = [...new Set(registos.map(r => r.viatura.modelo))].sort();

                res.render('marca', {
                    marca: param,
                    modelos: modelos,
                    list: registos,
                    date: d
                });
            })
            .catch(err => {
                res.status(500).render('error', {
                    message: `Erro ao obter reparações da marca: ${param}`,
                    error: err,
                    date: d
                });
            });
    }
});

const PORT = 16026;
app.listen(PORT, () => {
    console.log(`Interface a correr em http://localhost:${PORT}`);
});