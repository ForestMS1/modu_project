const { MongoClient} = require('mongodb');

const url = 'mongodb+srv://daesung:ReJWrIXa1WEzyPBF@cluster0.v4siqil.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
let connectDB = new MongoClient(url).connect()

module.exports = connectDB