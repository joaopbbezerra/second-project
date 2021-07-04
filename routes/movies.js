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



//Adicionar filmes, checar/fazer matches

router.post("/favorites/:moviesId/add", async (req, res)=>{
try{
    // console.log("favorites", req.session.currentUser.favorites)
    // console.log("movie id", req.params.moviesId)
    
    let counterSameMovies = 0
    if (req.session.currentUser.favorites.length < 1){
        await User.findByIdAndUpdate(req.session.currentUser._id, {
            $push: {favorites: req.params.moviesId}  
        })
        // res.redirect(`/movies-details/${req.params.moviesId}`)
    } else {
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
    }
        //Achando o primeiro usuário
    let userNow = await User.findById(req.session.currentUser._id);
    console.log("First user: ", userNow.favorites)

    //Achando o segundo usuário a partir do primeiro
    
    let userOneDate = await User.findOne({username: userNow.date})
    console.log("Checando se há o date: ", userOneDate)
    //Checando se há um date pro usuário
    if (userOneDate){
        let repeatedMatches = 0
        //For pra checar se já está dentro - Tentativa de evitar nested for
            for (let i = 0; i<userOneDate.matches.length; i++){
                if (req.params.moviesId === userOneDate.matches[i]){
                    repeatedMatches++
                }
            }
        console.log("Repeated Matches: ",repeatedMatches)
        if (repeatedMatches !== 0){
            console.log("Não foi adicionado! Repeated Matches: ", repeatedMatches)
        }
        else {
            //For pra checar o match
                for (let i=0; i<userOneDate.favorites.length; i++){
                    console.log("Checando se entrou no for pra testar se o filme tá nos favoritos do date: ", userOneDate.favorites[i])
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
        }
        console.log("Second user: ",userOneDate)
        res.redirect(`/movies-details/${req.params.moviesId}`)
    }
    else {
        console.log("Não foi true")
        res.redirect(`/movies-details/${req.params.moviesId}`)
    }

} catch(e){
    req.session.destroy()
    res.redirect("/login")
    console.log(e)
}
})

//DELETE
// router.post("/movies-details/:movieImdbid/delete", async (req, res) => {
//     try{
//         await User.findByIdAndUpdate(req.session.currentUser._id,{
//             $pull: {favorites: req.params.moviesImdbid}
//         });
//         res.redirect("/movie/movies-details");
//     } catch (e){
//         req.session.destroy()
//         res.redirect("/login")
//         console.log(e)
//     }
//   });

// router.get("/favorites-details/:moviesId", async (req, res) => {
    // const movieDetails =  await imdb.get({id: req.params.movieImdbid}, {apiKey: process.env.imdbKey, timeout: 30000})
    // const userDetail = req.session.currentUser
//     res.render("movie/movies-favorites-details", {movieDetails, userDetail})
// })

router.get("/favorites-details/:movieImdbid", async (req, res)=>{
    const movieDetails =  await imdb.get({id: req.params.movieImdbid}, {apiKey: process.env.imdbKey, timeout: 30000})
    const userDetail = req.session.currentUser
    res.render("movie/movies-favorites-details", {movieDetails, userDetail})
})

router.post("/favorites-details/:movieImdbid/delete", async (req, res)=>{
    console.log("Botão clicado")
    const userDetail = req.session.currentUser
    for (let i=0; i<userDetail.favorites.length; i++){
        console.log("Checando se entrou no for pra testar se o filme tá nos favoritos do date: ", userDetail.favorites[i])
        if (req.params.movieImdbid === userDetail.favorites[i]){
            console.log("Achou igual")
            //Usuário logado
            await User.findByIdAndUpdate(req.session.currentUser._id, {
                $pull: {favorites: req.params.movieImdbid}
            })
        }
    }
    res.redirect(`/favorites/${userDetail._id}`);
})

module.exports = router;