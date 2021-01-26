const mongoose = require('mongoose')

var schemaTypes = mongoose.Schema.Types;
const shoppingCartSchema = new mongoose.Schema({  
    user: {
        type: schemaTypes.String,
        ref : 'User'
    },
    totalDeliveryFee: {
        type: schemaTypes.Number
    },
    totalProductCost: {
        type: schemaTypes.Number
    },
    totalCost: {
        type: schemaTypes.Number
    },
    orders: [{
        type: schemaTypes.ObjectId,
        ref:'Order'
    }]
})

module.exports = mongoose.model('ShoppingCart',shoppingCartSchema)