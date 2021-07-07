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

router.get("/movies-details/:movieImdbid", requireLogin, async (req, res)=>{
    const movieDetails =  await imdb.get({id: req.params.movieImdbid}, {apiKey: process.env.imdbKey, timeout: 30000})
    const userDetail = await User.findById(req.session.currentUser._id);
    let userOneDate = await User.findOne({username: userDetail.date})
    let testMatch = false
    let testToDelete = false
    let greyFav = false
    if (userDetail && userDetail.favorites){
        for (let i = 0; i<userDetail.favorites.length; i++){
            console.log("Favorites: ", userDetail.favorites[i])
            console.log("Req params: ", req.params.movieImdbid)
            if (userDetail.favorites[i] === req.params.movieImdbid){
                testToDelete = true
                greyFav = true
            }
        }
    }
    for (let i = 0; i<userOneDate.favorites.length; i++){
        if (movieDetails.imdbid === userOneDate.favorites[i]){
            testMatch = true
        }
    }
    console.log("Test Delete Button: ", testToDelete)
    // res.render("albums", {albums: albumResult.body.items})
    // console.log(movieDetails)

    if (testToDelete){
        if (testMatch){
            console.log("Entrou no test")
            res.render("movie/movies-details", {movieDetails, testToDelete, greyFav, userDetail, testMatch})
        } else{
            res.render("movie/movies-details", {movieDetails, testToDelete, greyFav, userDetail, testMatch})
        }
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

//Testar popup





router.get("/matches-popup", requireLogin, async (req, res)=>{
    const testMatch = true
    const checkUserInfo = await User.findById(req.session.currentUser._id);
    console.log("checkUserInfo",checkUserInfo)
    if (checkUserInfo.date && checkUserInfo.matches.length > 0){
        const checkDateInfo = await User.findOne({username: checkUserInfo.date})
        console.log("CheckInfo", checkDateInfo)
        const lastMovie = checkUserInfo.matches[checkUserInfo.matches.length -1]
        console.log("Ultimo Filme", lastMovie)
        const movieDetails =  await imdb.get({id: lastMovie}, {apiKey: process.env.imdbKey, timeout: 30000})
        res.render("movie/match-popup", {checkUserInfo, checkDateInfo, movieDetails, testMatch})
    }
    else {
        res.render("movie/match-popup", {checkUserInfo, checkDateInfo, movieDetails})
    }
    
    
})





//Adicionar filmes, checar/fazer matches

router.post("/favorites/:moviesId/add", requireLogin, async (req, res)=>{
try{
    // console.log("favorites", req.session.currentUser.favorites)
    // console.log("movie id", req.params.moviesId)
    const checkUserInfo = await User.findById(req.session.currentUser._id);
    let counterSameMovies = 0
    console.log("User Info: ", checkUserInfo)
    if (checkUserInfo.favorites.length < 1){
        await User.findByIdAndUpdate(req.session.currentUser._id, {
            $push: {favorites: req.params.moviesId}  
        })
        // res.redirect(`/movies-details/${req.params.moviesId}`)
    } else {

        for (let i = 0; i<checkUserInfo.favorites.length; i++){
            console.log(checkUserInfo.favorites[i])
            const userCheck = await User.findByIdAndUpdate(req.session.currentUser._id)
            if (userCheck.favorites[i]===req.params.moviesId){
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
    // console.log("First user: ", userNow.favorites)

    //Achando o segundo usuário a partir do primeiro
    
    let userOneDate = await User.findOne({username: userNow.date})
    // console.log("Checando se há o date: ", userOneDate)
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
                    // console.log("Checando se entrou no for pra testar se o filme tá nos favoritos do date: ", userOneDate.favorites[i])
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

router.post("/favorites-details/:movieImdbid/delete", requireLogin, async (req, res)=>{
    console.log("Botão clicado")
    const userDetail = await User.findById(req.session.currentUser._id);
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
    // console.log("Botão clicado")
    const userDetail = req.session.currentUser
    for (let i=0; i<userDetail.matches.length; i++){
        // console.log("Checando se entrou no for pra testar se o filme tá nos favoritos do date: ", userDetail.favorites[i])
        if (req.params.movieImdbid === userDetail.matches[i]){
            // console.log("Achou igual")
            //Usuário logado
            await User.findByIdAndUpdate(req.session.currentUser._id, {
                $pull: {matches: req.params.movieImdbid}
            })
        }
    }
    res.redirect(`/login`);
    // favorites/${userDetail._id}
})



// RESTART FROM HERE

router.get("/pass-feeling-lucky", requireLogin, async (req, res)=>{
    const userDetail = await User.findById(req.session.currentUser._id);
    // const searchResult =  await imdb.search({name: title}, {apiKey: process.env.imdbKey, timeout: 30000})     //Usando o título pra pesquisar na API (método de pesquisa pré feito)
    const arrayFavDate = []
    if (userDetail.date){
        console.log("AChou o date")
        const dateDetail = await User.findOne({username: userDetail.date})
        if (dateDetail.favorites){
            const firstMovie = dateDetail.favorites[0]
            res.redirect(`/feeling-lucky-details/${firstMovie}`)
        }
    }
    res.redirect("/")
})

router.get("/feeling-lucky-details/:imdbId", requireLogin, async (req, res)=>{
    const userDetail = await User.findById(req.session.currentUser._id);
    const dateDetail = await User.findOne({username: userDetail.date})
    let idMovie = req.params.imdbId
    console.log(dateDetail.favorites[0])
    firstFav = dateDetail.favorites[0]
    console.log("Id movieeeeeee", idMovie)
    const movieDetails =  await imdb.get({id: idMovie}, {apiKey: process.env.imdbKey, timeout: 30000})
    console.log("Movie detailsssss", movieDetails)
    let testMatch = false
    for (let i = 0; i<userDetail.favorites.length; i++){
        if (req.params.imdbId == userDetail.favorites[i]){
            testMatch = true
        }
    }
    console.log("CADE MEU MATCHHHHHHH")
    if (testMatch){
        console.log("TESTOU MATCH")
        res.render("movie/feeling-lucky-details", {movieDetails, testMatch})
    } else{
        res.render("movie/feeling-lucky-details", {movieDetails})
    }
})

router.post("/feeling-lucky-details/:imdbId/fav", requireLogin, async (req, res)=>{
    const userDetail = await User.findById(req.session.currentUser._id);
    const dateDetail = await User.findOne({username: userDetail.date})
    let idMovie = req.params.imdbId
    console.log("POST Id movieeeeeee", idMovie)
    let findNewIndex = dateDetail.favorites.indexOf(idMovie)
    let nextIndex = findNewIndex
    let counterSameMovies = 0
    if(userDetail.favorites.length < 1){
        await User.findByIdAndUpdate(req.session.currentUser._id, {
            $push: {favorites: req.params.imdbId}  
        })
    } else{
        for (let i = 0; i<userDetail.favorites.length; i++){
            const userCheck = await User.findByIdAndUpdate(req.session.currentUser._id)
            if (userCheck.favorites[i] === req.params.imdbId){
                counterSameMovies++
            }
        }
        if (counterSameMovies === 0){
            await User.findByIdAndUpdate(req.session.currentUser._id, {
                $push: {favorites: req.params.imdbId}
            })
            console.log("The movie was pushed", req.params.imdbId)
        } else{
            console.log("The movie was not pushed")
        }
    }
    let userNow = await User.findById(req.session.currentUser._id)
    let userOneDate = await User.findOne({username: userNow.date})

    if (userOneDate){
        let repeatedMatches = 0
        for (let i = 0; i<userOneDate.matches.length; i++){
            if(req.params.imdbId === userOneDate.matches[i]){
                repeatedMatches++
            }
        }
        if (repeatedMatches !== 0){
            console.log("Não foi adicionada nada! Repeated matches: ", repeatedMatches)
        }
        else {
            for (let i = 0; i<userOneDate.favorites.length; i++){
                if (req.params.imdbId === userOneDate.favorites[i]){
                    await User.findByIdAndUpdate(req.session.currentUser._id, {
                        $push: {matches: req.params.imdbId}
                    })
                    //Retirar o fav do User
                    await User.findByIdAndUpdate(req.session.currentUser._id, {
                        $pull: {favorites: req.params.imdbId}
                    })
                    //Retirar o fav do Date
                    await User.findOneAndUpdate({username: userNow.date}, {
                        $push: {matches: req.params.imdbId}
                    })
                    //Retirar o fav do Date
                    await User.findOneAndUpdate({username: userNow.date}, {
                        $pull: {favorites: req.params.imdbId}
                    })

                }
            }
        }
    }
    // console.log("Next movieeeee", nextMovie)
    if (findNewIndex < dateDetail.favorites.length -1){
        nextIndex++
        let nextMovie = dateDetail.favorites[nextIndex]
        res.redirect(`/feeling-lucky-details/${nextMovie}`)
    } else {
        res.redirect("/")
    }
    // let index = dateDetail.favorites.findIndex(idMovie)


    res.render("movie/feeling-lucky-details")
})

//rota intermediária




//delete route
router.post("/feeling-lucky-details/:imdbId/del", requireLogin, async (req, res)=>{
    const userDetail = await User.findById(req.session.currentUser._id);
    const dateDetail = await User.findOne({username: userDetail.date})
    let idMovie = req.params.imdbId
    console.log("POST Id movieeeeeee", idMovie)
    let findNewIndex = dateDetail.favorites.indexOf(idMovie)
    let nextIndex = findNewIndex
    
    if (findNewIndex < dateDetail.favorites.length -1){
        nextIndex++
        let nextMovie = dateDetail.favorites[nextIndex]
        res.redirect(`/feeling-lucky-details/${nextMovie}`)
    } else {
        res.redirect("/")
    }

})
module.exports = router;
