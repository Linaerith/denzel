//Setting GraphQL
const { GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = require('graphql');
const _ = require('lodash');

const {movieType} = require('./src/types.js');

//Setting MongoDB
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


//Define the Query
const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        populate: {
            type: GraphQLString,

            resolve: async function () {
              var movies = await imdb(DENZEL_IMDB_ID);
              await collection.insertMany(movies);
                return "DB populated";
            }
        },

        fetchRandomMovie: {
            type: movieType,
            args: {
                id: { type: GraphQLString }
            },
            resolve: async function (source, args) {
              var res =  await collection.aggregate([{
                $match: {   "metascore": { $gt: 70 } } },
                { $sample: {   size: 1   } }]).toArray();
              return res[0];
            }
        },
        fetchMovieById: {
          type: movieType,
          args: {
            id: {type: GraphQLString}
          },
          resolve: async function(source, args){
            var res = await collection.findOne({ id: args.id });
            return res;
          }
        },
        searchMovie: {
          type: new GraphQLList(movieType),
          args: {
              limit: { type: GraphQLInt },
              metascore: { type: GraphQLInt }
          },
          resolve: async function (source, args) {
            if(args.limit !== null){
              var limit1 = args.limit;
            }
            else { var limit1 = 5; }
            if(args.metascore !== null)
            {
              var metascore1 = args.metascore;
            }
            else { var metascore1 = 0; }
            const res = await collection.find(
              { metascore: { $gte: Number(metascore1)  } }
            ).limit(Number(limit1)).toArray();
            return res;
          }
        }
    }
});
exports.queryType = queryType;
