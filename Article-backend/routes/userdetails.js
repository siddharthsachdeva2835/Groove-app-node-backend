var Follow = require('../models/follow')
var User = require('../models/user')
const { Router } = require('express')
var config = require('../config');
const route = Router()
var jwt1 = require('jwt-simple')
const sqlite3 = require('sqlite3');
var authorization = require('../auth')
let db = new sqlite3.Database('./models/testing.db');

//api to signup using token based authentication
route.post('/users', (req, res) => {
    User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    })
        .then(user => {
            if (user) {
                const playload = {
                    sub: user.id,
                    expiresIn: 86400
                };
                var token = jwt1.encode(playload, config.secret, process.env.TOKEN_SECRET);
                var registereduser = { email: req.body.email, token: token, username: req.body.username, bio: '', image: '' }
                res.status(201).json({ user: registereduser })
            }
            else {
                res.status(400).json({ message: 'User can\'tt be created' })
            }
        })
        .catch(error => {
            res.status(404).json({message:'Not Found'})
        })       
        
});

//api to login the user using token based authentication
route.post('/users/login', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    User.findOne({ where: [{ email: email, password: password }] }).then(function (user) {
        if (!user) {
            res.status(404).json({ message: 'The requested User does not exist' })
        } else {
            const playload = {
                sub: user.id
            };
            var token = jwt1.encode(playload, config.secret, process.env.TOKEN_SECRET);
            var authuser = { email: req.body.email, token: token, username: user.username, bio: user.bio, image: user.image }
            res.status(202).json({ user: authuser })
        }
    })
    .catch(error => {
        res.status(444).json({message:'No Response'})
    }) 
});



//api to get the current user 
route.get('/user', (req, res) => {
    var token = req.headers['token'];
    var id = authorization(token, req, res)
    User.findOne({ where: [{ id: id }] }).then(function (user) {
        if (!user) {
            res.status(404).json({ message: 'The requested User does not exist' })
        } else {
            var authuser = { email: user.email, token: token, username: user.username, bio: user.bio, image: user.image }
            res.status(202).json({ user: authuser })
        }
    })
    .catch(error => {
        res.status(404).json({message:'No Response'})
    }) 

})

//api to follow the particular user
route.post('/profiles/:username/follow', (req, res) => {
    var token = req.headers['token'];
    var id = authorization(token, req, res)
    var username = req.params.username
    User.findOne({ where: [{ id: id }] }).then(function (user) {
        if (!user) {
            res.status(401).json({ message: 'Unauthorised: User does not exist with the provided credentials' })
        } else {
            Follow.create({
                followuser: req.params.username,
                followedby: user.username

            })
            User.findOne({ where: [{ username: username }] }).then(function (user1) {
                if (!user1) {
                    res.status(401).json({ message: 'The requested User does not exist' })
                } else {
                    var follow = user1.following = 'true'
                    var pro = { username: user1.username, bio: user1.bio, image: user1.image, following: follow }
                    res.status(202).json({ profile: pro })
                }
            })
        }
    })
    .catch(error => {
        res.status(403).json({message:'Forbidden'})
    }) 
})

//api to unfollow the user by loggedin user 
route.delete('/profiles/:username/follow', (req, res) => {
    var token = req.headers['token'];
    var id = authorization(token, req, res)
    var username = req.params.username
    User.findOne({ where: [{ id: id }] }).then(function (user) {
        if (!user) {
            res.status(404).json({ message: 'The requested User does not exist' })
        } else {
            console.log('value of user ' + JSON.stringify(user))

            console.log('hye')
            User.findOne({ where: [{ username: username }] }).then(function (user1) {
                if (!user) {
                    res.status(404).json({ message: 'The requested User does not exist' })
                } else {
                    db.run(`delete from follows where followuser=? and followedby=? `, [user1.username, user.username])
                    var follow = user1.following = 'false'
                    var pro = { username: user1.username, bio: user1.bio, image: user1.image, following: follow }
                    res.status(200).json({ profile: pro })
                }
            })
        }
    }) .catch(error => {
        res.status(304).json({message:'Not Modified'})
    }) 
})

//update the current user while updating give the values of email, password, username, image, bio and it is showing the updated result after 2 times click on post button and i really don't know why
route.put('/user', (req, res) => {
    var token = req.headers['token'];
    var token1 = token
    var id = authorization(token, req, res)
    var email;
    var username;
    var password;
    var image;
    var bio=req.body.bio;
    User.findOne({ where: [{ id: id }] }).then(function (user1) {
       
        if (!user1) {
            res.status(404).json({ message: 'The requested User does not exist' })
        } else {
            if(req.body.email==null){
                email=user1.email
            }
            else{
                email=req.body.email
            }
            if(req.body.username==null){
                username=user1.username
            }
            else{
                username=req.body.username
            }
            if(req.body.password==null){
                password=user1.password
            }
            else{
                password=req.body.password
            }
            if(req.body.image==null){
                image=user1.image
            }
            else{
                image=req.body.image
            }
            if(req.body.bio==null){
                bio=user1.bio
            }
            else{
                bio=req.body.bio
            }
            db.run(`update users set username=?,email=?,password=?,image=?,bio=? where id=?`, [username, email, password, image, bio, id])
            User.findOne({where:{email:email}}).then (function(newuser){         
            var updateduser = { email: newuser.email, token: token1, username: newuser.username, bio: newuser.bio, image: newuser.image }
            res.status(202).json({ user: updateduser })  })
        }      
    }
    )
  
     .catch(error => {
        res.status(409).json({message:'Conflict'})
    }) 
});

module.exports = route