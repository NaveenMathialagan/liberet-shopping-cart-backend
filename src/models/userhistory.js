const mongoose = require('mongoose')
var schemaTypes = mongoose.Schema.Types;

const productSchema = new mongoose.Schema({  
    
    productId: {
        type: String
    },
    amount: {
        type: schemaTypes.Number
    },
    productCost: {
        type: schemaTypes.Number,
    },
    productTotalCost: {
        type: schemaTypes.Number,
    },
    currency: {
        type:String,
        default: 'MXN'
    }
})

const orderSchema = new mongoose.Schema({
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
    products: [productSchema],

    orderCost:{
        type: schemaTypes.Number
    },
    orderDeliveryFee:{
        type: schemaTypes.Number
    }
})

const userCartHistorySchema = new mongoose.Schema({  
    user: {
        type: schemaTypes.String,
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
    orders: [orderSchema]
})


module.exports = mongoose.model('UserCartHistory',userCartHistorySchema)