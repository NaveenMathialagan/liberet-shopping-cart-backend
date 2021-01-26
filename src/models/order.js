const mongoose = require('mongoose')

var schemaTypes = mongoose.Schema.Types;
const orderSchema = new mongoose.Schema({  
    user: {
        type: schemaTypes.String, 
        ref: 'User'
    },
    todayIs: {
        type: Date
    },
    serviceDate: {
        type: Date
    },
    serviceSchedule: {
        type: String
    },
    supplier: {
        type: String
    },
    deliveryType:{
        type: String
    },
    products: [{
        type: schemaTypes.ObjectId, 
        ref: 'Product',
    }],
    orderCost:{
        type: schemaTypes.Number
    },
    orderDeliveryFee:{
        type: schemaTypes.Number
    }
})

module.exports = mongoose.model('Order',orderSchema)