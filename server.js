require('dotenv').config()

const express = require('express')
const cors = require('cors')
const connectDB = require('./src/db/connect')
const { swaggerUi, swaggerSpec } = require('./src/docs/swagger')

const usuarioRouter = require('./src/router/usuario.route')
const ConsumoRouter = require('./src/router/consumoE.route')
const CreditoRouter = require('./src/router/creditoC.route')
const EmissaoRouter = require('./src/router/emissao.route')
const FonteEmissaoRouter = require('./src/router/fonteEmissao.route')
const FrotaVeiculoRouter = require('./src/router/frotaVeiculo.route')
const TransacaoCompensacaoRouter = require('./src/router/transacao.route')
const ProjetoEnergeticoRouter = require('./src/router/projeto.route')

const PORT = process.env.PORT || 3000
const app = express()

app.use(cors())
app.use(express.json())

// Documentação disponível sem depender da conexão com o banco.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Reutiliza a conexão e permite nova tentativa em caso de falha.
let dbPromise

const ensureDBConnected = async () => {
    if (!dbPromise) {
        dbPromise = Promise.resolve()
            .then(() => connectDB())
            .catch((error) => {
                dbPromise = null
                throw error
            })
    }

    await dbPromise
}

// Confirma a conexão antes de executar as rotas da API.
app.use('/api', async (req, res, next) => {
    try {
        await ensureDBConnected()
        next()
    } catch (error) {
        console.error('Falha ao conectar ao MongoDB:', error.message)

        return res.status(503).json({
            error: 'Banco de dados temporariamente indisponível.'
        })
    }
})

app.use('/api/usuario', usuarioRouter)
app.use('/api/ConsumoEnergia', ConsumoRouter)
app.use('/api/Credito', CreditoRouter)
app.use('/api/Emissao', EmissaoRouter)
app.use('/api/FonteEmissao', FonteEmissaoRouter)
app.use('/api/FrotaVeiculo', FrotaVeiculoRouter)
app.use('/api/Transacao', TransacaoCompensacaoRouter)
app.use('/api/Projeto', ProjetoEnergeticoRouter)

// Inicia um servidor com porta apenas na execução local.
const startServer = async () => {
    try {
        await ensureDBConnected()

        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`)
        })
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error.message)
        process.exit(1)
    }
}

if (require.main === module && !process.env.VERCEL) {
    startServer()
}

// O Vercel utiliza esta aplicação para atender às requisições.
module.exports = app
