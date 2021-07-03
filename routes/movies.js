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
    // console.log("title",title)
    const searchResult = await imdb.search({name: title}, {apiKey: '94f5077f', timeout: 30000})
    res.render("movie/movies-search", {searchResult})
})

router.post("/movies-search", async (req, res)=>{
    const {title} = req.body //Pegando do form
    // console.log("title post",title)
    const searchResult =  await imdb.search({name: title}, {apiKey: process.env.imdbKey, timeout: 30000})     //Usando o título pra pesquisar na API (método de pesquisa pré feito)
    console.log(searchResult)
    res.render("movie/movies-search", {searchResult}) //devolve o searchResult (lista de resultados)
})

// router.get("/movies-list", (req, res)=>{ //connecting api
//     res.render("movie/movies-list")
// })

router.get("/movies-details/:movieImdbid", async (req, res)=>{
    const movieDetails =  await imdb.get({id: req.params.movieImdbid}, {apiKey: process.env.imdbKey, timeout: 30000})
    const userDetail = req.session.currentUser
    // res.render("albums", {albums: albumResult.body.items})
    console.log(movieDetails)
    res.render("movie/movies-details", {movieDetails, userDetail})
})

router.post("/movies-details/:movieImdbid", async (req, res)=>{
    const movieId = req.params.movieImdbid
    console.log(movieDetails)
    res.redirect("/movie/movies-details")
})




module.exports = router;