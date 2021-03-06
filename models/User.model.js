const { Schema, model, SchemaTypes } = require("mongoose");

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    // unique: true -> Ideally, should be unique, but its up to you
  },
  password: {
    type: String,
    required: true,
  },
  image:{
    type:String,
    default:"https://media.giphy.com/media/jRlP4zbERYW5HoCLvX/giphy.gif"
  },
  favorites: Array,
  date:String,
  matches: Array,
  name: String,
});

const User = model("User", userSchema);

module.exports = User;
