const {Schema, model, SchemaTypes} = require ("mongoose")

const MovieSchema = new Schema ({
    title:String,
    genre: String,
    plot: String,
    rating: Number,
})

module.exports = model ("MoviesList", MovieSchema)