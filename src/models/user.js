const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({  
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
})

module.exports = mongoose.model('User',userSchema)