require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const shortid= require('shortid');

const cors = require('cors');

const User = require('./models/user');
const Exercise = require('./models/exercise');

const mongoose = require('mongoose');
let url = process.env.MONGODB_URI || 'mongodb://localhost/exerciseTracker';
mongoose.connect(url, { useUnifiedTopology: true, useNewUrlParser: true });

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('public'))

app.post('/api/exercise/new-user', (req, res)=>{
  const username = req.body.username;
  let newUser = new User({
    username: username,
  })

  //Checking if user already exist or not
  User.findOne({ username: username }, (err, user)=>{
    if(err){
      console.error(err);
      res.redirect('/');
    }
    if(user) return res.send("Username alerady taken");
    else{
      // if user doesn't exist then create a new user
      User.create(newUser, (err, user)=>{
        console.log("New User Created", user);
        res.json({ username: user.username, _id: user._id });
      });
    }
  });
});

app.post('/api/exercise/add', (req, res)=>{
  let newExercise = new Exercise({
    description: req.body.description,
    duration: req.body.duration,
    date: new Date(req.body.date)
  })
  // Checking if the user exist for which new exercise is created
  User.findById(req.body.userId, (err, user)=>{
    if(err){
      console.error(err);
      return res.redirect('/');
    }
    if(!user) return res.send("User Does Not Exist");
    // Since the user exist we will create a exercise
    Exercise.create(newExercise, (err, exercise)=>{
      if(err){
        console.error(err);
        res.redirect('/');
      }
      console.log("New Exercise Created", exercise);
      user.logs.push(exercise);
      user.count = user.logs.length;
      user.save();
      res.json({
        _id: user._id,
        username: user.username,
        date: exercise.date.toDateString(),
        duration: exercise.duration,
        description: exercise.description
      });
    });
  });
});

app.get('/api/exercise/log', (req, res)=>{
  let userId = req.query.userId;
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  if(limit) limit = parseInt(limit);
  User.findById(userId).populate("logs").exec((err, user)=>{
    if(err){
      console.error(err);
      return res.redirect('/');
    }
    if(!user){
      return res.send("User Doesn't exist");
    }

    let result = {};
    result._id = user._id;
    result.username = user.username;
    result.count = 0;
    result.logs = [];

    // If there is no query of from and to
    if(!from && !to){  
      if((limit && limit > 0) || !limit){
        user.logs.forEach((log, i)=>{
          let temp = {};
          temp.description = log.description;
          temp.duration = log.duration;
          temp.date = log.date.toDateString();
          result.logs.push(temp);
        }) 
        return res.send(result);
      }
      return res.send(result);
    }

    // If there exist a from query
    if(from){
      from = new Date(from).getTime();
      // If there is a limit query > 0 or not any query
      if((limit && limit > 0) || !limit){
        user.logs.forEach((log, i)=>{
          if(from > log.date.getTime() || (limit && result.logs.length >= limit)) return;
          // If there exist a  to query along with the from query
          if(to){
            to = new Date(to).getTime();
            if(to < log.date.getTime() || to < from) return;
          }
          let temp = {};
          temp.description = log.description;
          temp.duration = log.duration;
          temp.date = log.date.toDateString();
          result.logs.push(temp);
        })
        result.count = result.logs.length;
        return res.send(result);
      }
      res.send(result);
    }
    // If there is a to query without a from query
    else if(to){
      to = new Date(to).getTime();
      if((limit && limit > 0) || !limit){
        user.logs.forEach((log, i)=>{
          if(to < log.date.getTime() || (limit && result.logs.length >= limit)) return;
          let temp = {};
          temp.description = log.description;
          temp.duration = log.duration;
          temp.date = log.date.toDateString();
          result.logs.push(temp);
        })
        return res.send(result);
      }
      return res.send(result);
    }
  })
})

app.get('/*', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'Page not found'})
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
