const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Movies = require("../models/Movie.model");
const bcrypt = require("bcryptjs");
const imdb = require('imdb-api')

// function requireLogin(req, res, next){
//     if (req.session.currentUser){
//         next()
//     }
//     else {
//         res.redirect("/login")
//     }
// }

router.get("/movies-list", async (req, res)=>{ //connecting api
    let test = await imdb.search({name: 'The Toxic Avenger'}, {apiKey: '94f5077f', timeout: 30000})    
    res.render("movie/movies-list", {test})
})

module.exports = router;