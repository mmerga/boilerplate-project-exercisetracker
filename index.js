const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

///////////////////////////////////////////////////
///////////////////////////////////////////////////

/*
Usuário:
{
  username: "fcc_test",
  _id: "5fb5853f734231456ccb3b05"
}

Exercício:
{
  username: "fcc_test",
  description: "test",
  duration: 60,
  date: "Mon Jan 01 1990",
  _id: "5fb5853f734231456ccb3b05"
}

Log:
{
  username: "fcc_test",
  count: 1,
  _id: "5fb5853f734231456ccb3b05",
  log: [{
    description: "test",
    duration: 60,
    date: "Mon Jan 01 1990",
  }]
}
*/

///////////////////////////////////////////////////
///////////////////////////////////////////////////

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

///////////////////////////////////////////////////
///////////////////////////////////////////////////
/* ------------ USER FUNCTIONS ------------ */
const Schema = mongoose.Schema;

const userSchema = new Schema({
  "username": { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

// Cria um novo usuario
// Salva num banco
// E retorna o usuario
const createNewUser = (userName, callback) => {
  const user = new User({
    "username": userName
  });
  user.save((err, user) => {
    if (err) {
      return callback(err);
    }
    return callback(null, user);
  });
};

// Cria um novo usuario
// E retorna um JSON
/*
{
  username: "fcc_test",
  _id: "5fb5853f734231456ccb3b05"
}
*/
app.post("/api/users", (req, res) => {
  const userName = req.body.username;
  createNewUser(userName, (err, newUser) => {
    if (err) {
      return res.json({ error: err.message });
    }
    res.json({
      "username": newUser.username,
      "_id": newUser._id
    });
  });
});

// Retorna um array de usuarios
app.get("/api/users", (req, res) => {
  //let done = [];
  // retorna todos os username e _id
  User.find({}, "username _id", (err, done) => {
    if (err) {
      return res.json({ error: err.message });
    }
    res.json(done);
  });
});

///////////////////////////////////////////////////
///////////////////////////////////////////////////
/* ------------ EXERCISES FUNCTIONS ------------ */

const exerciseSchema = new Schema({
  "username": { type: String, required: true },
  "description": { type: String, required: true },
  "duration": { type: Number, required: true },
  "date": { type: Date }
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

// Cria um novo exercicio 
// Salva num banco
// E retorna o exercicio
const createExercise = (userId, description, duration, date, callback) => {
  const exercise = new Exercise({
    "username": userId,
    "description": description,
    "duration": duration,
    "date": date
  });
  exercise.save((err, exercise) => {
    if (err) {
      return callback(err);
    }
    return callback(null, exercise);
  });
};

// Recebe um novo exercicio
// E associa ao um userId
// Retorna um JSON
/*
{
  username: "fcc_test",
  description: "test",
  duration: 60,
  date: "Mon Jan 01 1990",
  _id: "5fb5853f734231456ccb3b05"
}
*/
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  let date = req.body.date;
  if (!date) {
    // Se o parâmetro da data estiver ausente, use a data atual
    date = Date.now();
  } else {
    date = new Date(date);
    if (isNaN(date.getTime())) {
      return res.json({ error: "Invalid Date" });
    }
  }
  User.findById(userId, (err, user) => {
    if (err) {
      return res.json({ error: err.message });
    }
    createExercise(user.username, description, duration, date, (err, newExercise) => {
      if (err) {
        return res.json({ error: err.message });
      }
      res.json({
        "username": user.username,
        "_id": user._id,
        "description": newExercise.description,
        "duration": newExercise.duration,
        "date": newExercise.date.toDateString()
      });
    });
  });
});

///////////////////////////////////////////////////
///////////////////////////////////////////////////
/* ------------ LOGS FUNCTIONS ------------ */

// Recebe um idUser 
// Procura todos os exercicios associados
// Pode ter limitadores de busca
// FROM date TO date LIMIT de exercicios
// E retorna um JSON
/*
{
  username: "fcc_test",
  count: 1,
  _id: "5fb5853f734231456ccb3b05",
  log: [{
    description: "test",
    duration: 60,
    date: "Mon Jan 01 1990",
  }]
}
*/
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  // Obter os parâmetros da consulta
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  // Obter os parâmetros da consulta
  User.findById(userId, (err, user) => {
    if (err) {
      return res.json({ error: err.message });
    }
    let query = { "username": user.username };
    // Aplicar filtro de data 'from' se fornecido
    if (from) {
      query.date = { $gte: new Date(from) };
    } 
    // Aplicar filtro de data 'to' se fornecido
    if (to) {
      if (!query.date) {
        query.date = {};
      }
      query.date.$lte = new Date(to);
    }
    // Consulta limitada se 'limit' for fornecido
    const limitNumber = (limit) => {
      const x = parseInt(limit, 10);
      if (!isNaN(x)) {
        return x;
      } else {
        return 0;
      }
    }
    ////////////////////////    
    Exercise.find(query)
      .limit(limitNumber(limit))
      .exec((err, exercises) => {
        if (err) {
          return res.json({ error: err.message });
        }
        res.json({
          "username": user.username,
          "count": exercises.length,
          "_id": user._id,
          "log": exercises.map(x => ({
            "description": x.description,
            "duration": x.duration,
            "date": x.date.toDateString()
          }))
        });
      });
  });
});



