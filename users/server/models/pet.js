
import mongoose from "mongoose";


var schema = mongoose.Schema;

var PetSchema = schema({
    name: String,
    age: Number,
    img: String,
    sex: String,
    kind: String,
    subkind: String,
    tags: Array,
    description: String,
    owner: {type: schema.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Pet', PetSchema);