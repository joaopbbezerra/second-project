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
    const searchResult = await imdb.search({name: title}, {apiKey: process.env.imdbKey, timeout: 30000})
    res.render("movie/movies-search", {searchResult})
})

router.post("/movies-search", async (req, res)=>{
    const {title} = req.body //Pegando do form
    // console.log("title post",title)
    const searchResult =  await imdb.search({name: title}, {apiKey: process.env.imdbKey, timeout: 30000})     //Usando o título pra pesquisar na API (método de pesquisa pré feito)
    // console.log(searchResult)
    res.render("movie/movies-search", {searchResult}) //devolve o searchResult (lista de resultados)
})

// router.get("/movies-list", (req, res)=>{ //connecting api
//     res.render("movie/movies-list")
// })

router.get("/movies-details/:movieImdbid", async (req, res)=>{
    const movieDetails =  await imdb.get({id: req.params.movieImdbid}, {apiKey: process.env.imdbKey, timeout: 30000})
    const userDetail = req.session.currentUser
    // res.render("albums", {albums: albumResult.body.items})
    // console.log(movieDetails)
    res.render("movie/movies-details", {movieDetails, userDetail})
})

router.post("/movies-details/:movieImdbid", async (req, res)=>{
    const movieId = req.params.movieImdbid
    // console.log(movieDetails)
    res.redirect("/movie/movies-details")
})

router.post("/favorites/:moviesId/add", async (req, res)=>{
try{
    // console.log("favorites", req.session.currentUser.favorites)
    // console.log("movie id", req.params.moviesId)
    
    let counterSameMovies = 0
    for (let i = 0; i<req.session.currentUser.favorites.length; i++){
        console.log(req.session.currentUser.favorites[i])
        if (req.session.currentUser.favorites[i]===req.params.moviesId){
            counterSameMovies++
        }
    }
    if (counterSameMovies === 0){
        await User.findByIdAndUpdate(req.session.currentUser._id, {
            $push: {favorites: req.params.moviesId}
        })
        console.log("The movies was pushed ", req.params.moviesId)
    } else {
        console.log("No movies were pushed")
    }
    //Achando o primeiro usuário
    let userNow = await User.findById(req.session.currentUser._id);
    console.log("First user: ", userNow.favorites)
    //Achando o segundo usuário a partir do primeiro
    let userOneDate = await User.findOne({username: userNow.date})
    console.log("Second user: ",userOneDate.favorites)
    //For pra checar o match
    for (let i=0; i<userOneDate.favorites.length; i++){
        if (req.params.moviesId === userOneDate.favorites[i]){
            //Usuário logado
            await User.findByIdAndUpdate(req.session.currentUser._id, {
                $push: {matches: req.params.moviesId}
            })
            //Date do usuário
            await User.findOneAndUpdate({username: userNow.date}, {
                $push: {matches: req.params.moviesId}
            })
            console.log("Added in both users")
            
        }
    }
    


    res.redirect(`/movies-details/${req.params.moviesId}`)
} catch(e){
    req.session.destroy()
    res.redirect("/login")
    console.log(e)
}
})



module.exports = router;