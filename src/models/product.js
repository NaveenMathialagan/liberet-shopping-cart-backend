const mongoose = require('mongoose')

var schemaTypes = mongoose.Schema.Types;
const productSchema = new mongoose.Schema({  
    
    orderId: {
        type: schemaTypes.ObjectId
    },
    productId: {
        type: String
    },
    amount: {
        type: schemaTypes.Number
    },
    productCost: {
        type: schemaTypes.Number,
    },
    currency: {
        type:String,
        default: 'MXN'
    }
})

module.exports = mongoose.model('Product',productSchema)