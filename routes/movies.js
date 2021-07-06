const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Movies = require("../models/Movie.model");
const bcrypt = require("bcryptjs");
const imdb = require('imdb-api')
// const main = document.getElementById("main");
// function requireLogin(req, res, next){
//     if (req.session.currentUser){
//         next()
//     }
//     else {
//         res.redirect("/login")
//     }
// }
function requireLogin(req, res, next){
    if (req.session.currentUser){
        next()
    }
    else {
        res.redirect("/login")
    }
}


router.get("/movies-search", async (req, res)=>{
    const {title} = req.query
    const searchResult = await imdb.search({name: title}, {apiKey: process.env.imdbKey, timeout: 30000})
    console.log("Entrou",searchResult.poster)
    res.render("movie/movies-search", {searchResult})
})

router.post("/movies-search", async (req, res)=>{
    const {title} = req.body //Pegando do form
    const searchResult =  await imdb.search({name: title}, {apiKey: process.env.imdbKey, timeout: 30000})     //Usando o título pra pesquisar na API (método de pesquisa pré feito)
    // console.log(searchResult)
    const arraySearchs = searchResult.results
    console.log("Entrou", arraySearchs[0].imdbid)
    // for (let i = 0; i<arraySearchs.length; i++){
    //     const movieDetails =  await imdb.get({id: arraySearchs[i].imdbid}, {apiKey: process.env.imdbKey, timeout: 30000})
    //     console.log(movieDetails.rating)
    //     const moviesAdd = document.createElement("div");
    //     moviesAdd.classList.add("movie");

    //     moviesAdd.innerHTML = `
    //         <img
    //             src="${movieDetails[i].poster}"
    //             alt="${movieDetails[i].title}"
    //         />
    //         <div class="movie-info">
    //             <h3>${movieDetails[i].title}</h3>
    //             <span class="${getClassByRate(
    //                 movieDetails[i].rating
    //             )}">${movieDetails[i].rating}</span>
    //         </div>
    //         <div class="overview">
    //             <h3>Overview:</h3>
    //             ${movieDetails[i].plot}
    //         </div>
    //     `;

    //     main.appendChild(moviesAdd);

    // }
    // function getClassByRate(vote) {
    //     if (vote >= 8) {
    //         return "green";
    //     } else if (vote >= 5) {
    //         return "orange";
    //     } else {
    //         return "red";
    //     }
    // }
    res.render("movie/movies-search", {searchResult}) //devolve o searchResult (lista de resultados)
})

// router.get("/movies-list", (req, res)=>{ //connecting api
//     res.render("movie/movies-list")
// })

router.get("/movies-details/:movieImdbid", async (req, res)=>{
    const movieDetails =  await imdb.get({id: req.params.movieImdbid}, {apiKey: process.env.imdbKey, timeout: 30000})
    
    const userDetail = await User.findById(req.session.currentUser._id);
    let testToDelete = false
    let greyFav = false
    if (userDetail && userDetail.favorites){
        for (let i = 0; i<userDetail.favorites.length; i++){
            console.log("Favortes: ", userDetail.favorites[i])
            console.log("Req params: ", req.params.movieImdbid)
            if (userDetail.favorites[i] === req.params.movieImdbid){
                testToDelete = true
                greyFav = true
            }
        }
    }
    console.log("Test Delete Button: ", testToDelete)
    // res.render("albums", {albums: albumResult.body.items})
    // console.log(movieDetails)
    if (testToDelete){
        console.log("Entrou no test")
        res.render("movie/movies-details", {movieDetails, testToDelete, greyFav, userDetail})
    }
    else {
        res.render("movie/movies-details", {movieDetails, userDetail})
    }
    
})

router.post("/movies-details/:movieImdbid", async (req, res)=>{
    const movieId = req.params.movieImdbid
    // console.log(movieDetails)
    res.redirect("/movie/movies-details")
})



//Adicionar filmes, checar/fazer matches

router.post("/favorites/:moviesId/add", requireLogin, async (req, res)=>{
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

router.get("/favorites-details/:movieImdbid", requireLogin, async (req, res)=>{
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

router.get("/matches-details/:movieImdbid", requireLogin, async (req, res)=>{
    const movieDetails =  await imdb.get({id: req.params.movieImdbid}, {apiKey: process.env.imdbKey, timeout: 30000})
    const userDetail = req.session.currentUser
    res.render("auth/matches-details", {movieDetails, userDetail})
})


router.post("/matches-details/:movieImdbid/delete", async (req, res)=>{
    console.log("Botão clicado")
    const userDetail = req.session.currentUser
    for (let i=0; i<userDetail.matches.length; i++){
        console.log("Checando se entrou no for pra testar se o filme tá nos favoritos do date: ", userDetail.favorites[i])
        if (req.params.movieImdbid === userDetail.matches[i]){
            console.log("Achou igual")
            //Usuário logado
            await User.findByIdAndUpdate(req.session.currentUser._id, {
                $pull: {matches: req.params.movieImdbid}
            })
        }
    }
    res.redirect(`/matches`);
    // favorites/${userDetail._id}
})


module.exports = router;