const express = require('express')
const mongose = require('mongoose')
const url = 'mongodb://localhost/Liberet'

const app = express()

mongose.connect(url, {useNewUrlParser:true})
const con = mongose.connection

con.on('open', () => {
    console.log('Database connection established...')
})

app.use(express.json())

app.listen(9000, () => {
    console.log('Server started')
})

const shoppingCartsRouter = require('./routes/liberetshoppingcart')
app.use('/shoppingCarts',shoppingCartsRouter)