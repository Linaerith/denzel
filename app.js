const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const imdb = require("./src/imdb.js")
const DENZEL_IMDB_ID = 'nm0000243';

const CONNECTION_URL = "mongodb+srv://Linaerith:denzelapi@denzeldb-chgmp.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "denzelDB";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

app.listen(9292, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("people");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

//create / add a movie in the database
app.post("/movies", (request, response) => {
    collection.insert(request.body, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result.result);
    });
});

//to populate the database with the scrapped movies
app.get("/movies/populate", async (request, response) => {
  const movies = await imdb(DENZEL_IMDB_ID);
  collection.insertMany(movies, (err, result) => {
    if (err) {
      return response.status(500).send(err);
    }
    response.send(`Total movies added : ${movies.length}`);
  });
});

//to return all data in our collection representing movies that are the must-watch

//Fetch a random must-watch movie
app.get("/movies", (request, response) => {
  collection
    .aggregate([
      { $match: { metascore: { $gte: 70 } } },
      { $sample: { size: 1 } } // pour en avoir un random
    ])
    .toArray((error, result) => {
      if (error) {
        return response.status(500).send(error);
      }
      response.send(result);
    });
});
//Fetch a movie with a score greater than 0 and limiting the result to 5 movies
app.get("/movies/search", (request, response) => {
  collection.find(
    { metascore: { $gte: 0 }}
  ).limit(5).toArray((error, result) => {
    if (error) {
      return response.status(500).send(error);
    }
    response.send(result);
  });
});
//Fetch a specific movie according to its id
app.get("/movies/:id", (request, response) => {
  collection.find({ id: request.params.id }).toArray((error, result) => {
    if (error) {
      return response.status(500).send(error);
    }
    response.send(result);
  });
});

//Fetch a movie according to its score and limit the search result
app.get("/movies/search/:limit/:metascore", (request, response) => {
  collection.find(
    { metascore: { $gte: request.params.metascore  } }
  ).limit(parseInt(request.params.limit)).toArray((error, result) => {
    if (error) {
      return response.status(500).send(error);
    }
    response.send(result);
  });
});
