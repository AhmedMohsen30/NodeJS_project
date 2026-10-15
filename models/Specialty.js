const mongoose = require ('mongoose');

const specialtyschema = new mongoose.Schema({
    name: {type:String, required : true, unique: true, trim : true},
    icon:{type:String, default:''}
});

module.exports = mongoose.model('Specialty',specialtyschema);