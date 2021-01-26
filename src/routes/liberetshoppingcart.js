const express = require('express')
const mongoose = require('mongoose');
const router = express.Router()
const User = require('../models/user')
const Product = require('../models/product')
const ShoppingCart = require('../models/shoppingcart')
const Order = require('../models/order')
const UserHistory = require('../models/userhistory')

router.get('/users',async(req,res) => {
    try{
        const user = await User.find()
        res.json(user)
    }  catch (err) {
        res.send('Error ' + err)
    }
})

router.post('/users',async(req,res) => {
    const user = new User({
        _id: req.body._id,
        name: req.body.name
    })
    try{
        const u = await user.save()
        res.json(u)
    } catch (err) {
        res.send('Error' +err)
    }
})

router.post('/products',async(req,res) => {
    const product = new Product({
        _id: req.body._id,
        name: req.body.name,
        amount: req.body.amount,
        productPrice: req.body.productPrice
    })
    try{
        const p = await product.save()
        res.json(p)
    } catch (err) {
        res.send('Error'+err)
    }
})

router.get('/products',async(req,res) => {
    try{
        const products = await Product.find()
        res.json(products)
    }catch (err) {
        res.send('Error' +err)
    }
})

router.get('/orders',async(req,res) => {
    try{
        const orders = await Order.find()
        res.json(orders)
    } catch (err) {
        res.send('Error' +err)
    }
})

router.get('/:userId', async(req, res) => {

    const userId = req.params.userId
    
    await ShoppingCart.find({user:{$in:[userId]}},async(err,shoppingCarts)=> {
        shoppingCart = shoppingCarts[0]
       
        await Order.find({_id:{$in:shoppingCart.orders}},async(errs, orders)=> {
            var productRefs = []
            for (i=0; i<orders.length; i++) {
                productRefs = productRefs.concat(orders[i].products)
            }
            await Product.find({_id:{$in: productRefs}},async(errs, products)=> {
                var userhistory = {
                    totalDeliveryFee : parseFloat(shoppingCart.totalDeliveryFee.toFixed(2)),
                    totalProductCost : parseFloat(shoppingCart.totalProductCost.toFixed(2)),
                    totalCost : parseFloat(shoppingCart.totalCost.toFixed(2))
                }
                var orderArr = []
                for (i=0; i<orders.length; i++) {
                    var orderJsonObj = {
                        orderId : String(orders[i]._id),
                        orderCost : parseFloat(orders[i].orderCost.toFixed(2)),
                        orderDeliveryFee : parseFloat(orders[i].orderDeliveryFee.toFixed(2))
                    }
                    const filteredProduct = products.filter(function(product){
                        return String(product.orderId) == String(orders[i]._id);
                    })
                    var productArr = []  
                    for (j=0; j<filteredProduct.length; j++){
                        var productJsonObj = {
                            productId : filteredProduct[j].productId,
                            amount: filteredProduct[j].amount,
                            productCost : parseFloat(filteredProduct[j].productCost.toFixed(2)),
                            currency : filteredProduct[j].currency
                        }
                        productArr.push(productJsonObj)
                    }
                    orderJsonObj.products = productArr
                    orderArr.push(orderJsonObj)
                }
                userhistory.orders = orderArr

                res.json(userhistory)
            })
        })
    })
})

router.post('/:userId/complete', async(req, res) => {
    const userId = req.params.userId
    
    await ShoppingCart.find({user:{$in:[userId]}},async(err,shoppingCarts)=> {
        shoppingCart = shoppingCarts[0]
       
        await Order.find({_id:{$in:shoppingCart.orders}},async(errs, orders)=> {
            var productRefs = []
            for (i=0; i<orders.length; i++) {
                productRefs = productRefs.concat(orders[i].products)
            }
            await Product.find({_id:{$in: productRefs}},async(errs, products)=> {
                var userhistory = new UserHistory({})
                userhistory.user = userId
                userhistory.totalDeliveryFee = shoppingCart.totalDeliveryFee
                userhistory.totalProductCost = shoppingCart.totalProductCost
                userhistory.totalCost = shoppingCart.totalCost
                var orderArr = []
                for (i=0; i<orders.length; i++) {
                    var orderJsonObj = {
                        todayIs : orders[i].todayIs,
                        serviceDate : orders[i].serviceDate,
                        serviceSchedule : orders[i].serviceSchedule,
                        supplier : orders[i].supplier,
                        deliveryType : orders[i].deliveryType,
                        orderCost : orders[i].orderCost,
                        orderDeliveryFee : orders[i].orderDeliveryFee
                    }
                    const filteredProduct = products.filter(function(product){
                        return String(product.orderId) == String(orders[i]._id);
                    })
                    var productArr = []  
                    for (j=0; j<filteredProduct.length; j++){
                        var productJsonObj = {
                            productId : filteredProduct[j].productId,
                            amount: filteredProduct[j].amount,
                            productCost : filteredProduct[j].productCost,
                            productTotalCost : (filteredProduct[j].amount*filteredProduct[j].productCost),
                            currency : filteredProduct[j].currency
                        }
                        productArr.push(productJsonObj)
                    }
                    orderJsonObj.products = productArr
                    orderArr.push(orderJsonObj)
                }
                userhistory.orders = orderArr
                await userhistory.save();

                for (i=0;i<products.length;i++){
                    await products[i].remove()
                }
                for (i=0;i<orders.length;i++){
                    await orders[i].remove()
                }
                for (i=0;i<shoppingCarts.length;i++){
                    await shoppingCarts[i].remove()
                }
                res.sendStatus(204)
            })
        })
    })
})

router.delete('/:userId/remove/:orderId/:productId', async(req, res) => {
    try{
        const userId = req.params.userId
        const orderId = req.params.orderId
        const productId = req.params.productId

        const orderObjId =  mongoose.Types.ObjectId(orderId);
        
        await Product.aggregate([{$match:{productId: productId,orderId: orderObjId}}], 
                                async(err,data) => {
            const matchProductInfo = data[0]
            if (matchProductInfo == null){
                console.log(data)
                res.sendStatus(204)
                return
            }
            await ShoppingCart.aggregate([{$match:{user: userId}}],async(err,data)=> {
                const userCart = data[0];
                var cartObject = await ShoppingCart.findById(userCart._id);
                var orderArr = cartObject.orders;
                for (i=0;i<orderArr.length;i++) {
                    if (orderArr[i] == orderId) {
                        const orderObject = await Order.findById(orderId);
                        var productArr = orderObject.products;
                        j = 0
                        productobjectId = String(matchProductInfo._id)
                        while (j<productArr.length) {
                            if (String(productArr[j]) === productobjectId) {
                                break
                            }
                            j++
                        }
                        if (j!=productArr.length) {
                            productArr.splice(j,1)
                            if (productArr.length>0) {
                                orderObject.products = productArr
                                await orderObject.save()
                                console.log('Product array updated successfully...')
                            } else {
                                await orderObject.remove()
                                console.log('Order object removed successfully...')
                                cartObject = await ShoppingCart.findById(userCart._id);
                                var orderArr = cartObject.orders;
                                j = 0
                                while (j<orderArr.length) {
                                    if (String(orderArr[j]) === String(orderId)) {
                                        break;
                                    }
                                    j++;
                                }
                                if (j!=orderArr.length) {
                                    orderArr.splice(j,1)
                                    if (orderArr.length > 0) {
                                        console.log('Order array updated successfully...')
                                        cartObject.orders = orderArr;
                                        await cartObject.save()
                                    } else {
                                        console.log('Cart object removed successfully...')
                                        await cartObject.remove()
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
                if (matchProductInfo!=null){
                    const product = await Product.findById(matchProductInfo._id)
                    const c =await product.remove()
                    console.log('Product removed successfully...')
                }
                await ShoppingCart.aggregate([{$match:{user: userId}}], async(err,data) => {
                    var userCart = data
                    if (userCart!=null && userCart.length > 0) {
                        const cart = userCart[0]
                        calculateCost(cart._id).then(()=>{
                            res.sendStatus(204)
                        })
                    } else{
                        res.sendStatus(204)
                    }
                })  
            })
        })
    } catch (err) {
        res.send('Error')
    }
})

router.post('/:userId/add',async(req,res) => {
    try {
        await ShoppingCart.aggregate([{$match:{user: req.params.userId}}], async(err,data) => {
            var userCart = data
            if (userCart!=null && userCart.length > 0) {
                const cart = userCart[0]
                orderArr = cart.orders
                await Order.find({_id:{$in:orderArr}},async(err, data)=> {
                    orderArr = data
                    orderArr = orderArr.filter(function (order) {
                        console.log( order.serviceDate.toISOString() +' '+ req.body.serviceDate)
                        return  order.serviceDate.toISOString() === req.body.serviceDate &&
                                order.serviceSchedule === req.body.serviceSchedule &&
                                order.supplier === req.body.supplier &&
                                order.deliveryType === req.body.deliveryType
                    })
                    if (orderArr.length > 0) {
                        var order = orderArr[0]
                        await Product.find({_id:{$in:order.products}},async(errs, data)=> {
                            productArr = data
                            productArr = productArr.filter(function (product) {
                                return product.productId === req.body.productId
                            })
                            if (productArr.length > 0) {
                                console.log('Products Available and Updating')
                                var product = await Product.findById(productArr[0]._id)
                                product.amount = product.amount + req.body.amount
                                product = await product.save()
                            } else {
                                console.log('Creating the new product')
                                order = await Order.findById(order._id)
                                var product = createProduct(order._id,req)
                                product = await product.save()
                                order.products.push(product._id)
                                order = await order.save()
                            }
                            calculateCost(cart._id).then(() =>{
                                res.status(200);
                                res.json({ orderId : order._id})
                            })
                        })
                    } else {
                        console.log('Creating new order')
                        var order = createOrder(req.params.userId,req)
                        order = await order.save()
                        var product = createProduct(order._id,req)
                        product = await product.save()
                        order.products = [product._id]
                        order = await order.save()
                        var shoppingCart = await ShoppingCart.findById(cart._id)
                        shoppingCart.orders.push(order._id)
                        shoppingCart = await shoppingCart.save()
                        calculateCost(shoppingCart._id)
                        res.status(200);
                        res.json({ orderId : order._id})
                    }
                })
            } else {
                initiateCart(req).then((result) =>{
                    res.status(200);
                    res.json({ orderId : result})
                })
            }         
        })
    } catch (err) {
        res.send('Error' +err)
    }
})

function createDateObj (dateString) {
    var pattern = /^(\d{4})\-(\d{2})\-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})\.(\d{3})Z$/
    var arr = dateString.match(pattern)
    var dateObj = new Date()
    dateObj.setUTCFullYear(parseInt(arr[1]))
    dateObj.setUTCMonth(parseInt(arr[2]-1))
    dateObj.setUTCDate(parseInt(arr[3]))
    dateObj.setUTCHours(parseInt(arr[4]))
    dateObj.setUTCMinutes(parseInt(arr[5]))
    dateObj.setUTCSeconds(parseInt(arr[6]))
    dateObj.setUTCMilliseconds(parseInt(arr[7]))
    console.log(dateObj)
    return dateObj
}

function getDate() {
    var dateObj = new Date();
    dateObj.setUTCFullYear(dateObj.getFullYear())
    dateObj.setUTCMonth(dateObj.getMonth())
    dateObj.setUTCDate(dateObj.getDate())
    dateObj.setUTCHours(dateObj.getHours())
    dateObj.setUTCMinutes(dateObj.getMinutes())
    dateObj.setUTCSeconds(dateObj.getSeconds())
    return dateObj;
}

async function initiateCart(req) {
    console.log('Initiating cart...')
    var user = await User.findById(req.params.userId)

    var order = createOrder(user._id,req)
    order = await order.save()

    var product = createProduct(order._id,req)
    product = await product.save()

    order.products = [product._id]
    order = await order.save()
    
    var shoppingCart = new ShoppingCart({})
    shoppingCart.user = user
    shoppingCart.orders = [order._id]
    shoppingCart = await shoppingCart.save()
    calculateCost(shoppingCart._id)
    console.log('Cart initiated successfully...')
    return order._id
}



function createOrder(userId,req) {
    var order = new Order({})
    order.user = userId
    order.todayIs = getDate()
    order.serviceDate = createDateObj(req.body.serviceDate)
    order.serviceSchedule = req.body.serviceSchedule
    order.supplier = req.body.supplier
    order.deliveryType = req.body.deliveryType
    return order
}

function createProduct(orderId,req){
    var product = new Product({})
    product.orderId = orderId
    product.productId =req.body.productId
    product.amount = req.body.amount
    product.productCost = parseFloat(req.body.productCost)
    return product
}

async function calculateCost(shoppingCartId) { 

    var shoppingCart = await ShoppingCart.findById(shoppingCartId)
    if (shoppingCart==null){
        return
    }
    var orderArr = shoppingCart.orders
    
    totalDeliveryFee =0
    totalProductCost = 0
    totalCost = 0

    for (i = 0 ; i<orderArr.length ;i++) {
        var order = await Order.findById(orderArr[i])
        var productArr = order.products
        var orderCost = 0
        var orderDeliveryFee = 0
        var isHigher = false  
        for (j = 0 ; j<productArr.length ; j++){
            var product = await Product.findById(productArr[j])
            if (product == null){
                continue
            }
            orderCost = orderCost+(product.amount * product.productCost)
            if ((product.amount * product.productCost)>= 2000){
                isHigher = true
            }
        }
        if (order.deliveryType.toLowerCase() === 'delivery') {
            if (isHigher){
                orderDeliveryFee = 199
            } else {
                var todayIs = order.todayIs
                var serviceDate = order.serviceDate
                var hours = Math.abs(serviceDate - todayIs) / 36e5
                console.log(hours)
                if (hours > 4) {
                    if (orderCost< 60){
                        orderDeliveryFee = 28
                    } else {
                        orderDeliveryFee = 19
                    }
                } else {
                    if (orderCost< 60){
                        orderDeliveryFee = 38
                    } else {
                        orderDeliveryFee = 28
                    }
                }
            }
        }
        order.orderCost = orderCost
        order.orderDeliveryFee = orderDeliveryFee
        order = await order.save()
        totalProductCost = totalProductCost + orderCost
        totalDeliveryFee = totalDeliveryFee + orderDeliveryFee
        totalCost = totalCost +(orderCost+orderDeliveryFee)
    }

    shoppingCart.totalProductCost = totalProductCost
    shoppingCart.totalDeliveryFee = totalDeliveryFee
    shoppingCart.totalCost = totalCost

    shoppingCart = await shoppingCart.save()
    console.log('Cost value calculated successfully...')
}
module.exports = router