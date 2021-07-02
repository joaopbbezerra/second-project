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



router.get("/movies-search", async (req, res)=>{
    const {title} = req.query
    console.log("title",title)
    const searchResult = await imdb.search({name: title}, {apiKey: '94f5077f', timeout: 30000})
    res.render("movie/movies-search", {searchResult})
})

router.post("/movies-search", async (req, res)=>{
    const {title} = req.body
    console.log("title post",title)
    const searchResult =  await imdb.search({name: title}, {apiKey: process.env.imdbKey, timeout: 30000})    
    console.log(searchResult)
    res.render("movie/movies-search", {searchResult})
})

router.get("/movies-list", (req, res)=>{ //connecting api
    res.render("movie/movies-list")
})



module.exports = router;