const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
require('dotenv').config()


const app = express();

const port = process.env.PORT || 5000

// middleware
app.use(express.json());
app.use(cors());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PSS}@cluster0.mndvni1.mongodb.net/?appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});





const JWKS = createRemoteJWKSet(new URL(`${process.env.NEXT_CLIENT_SITE}/api/auth/jwks`))



async function run() {
    
}







app.get('/', (req, res) => {
  res.send('server is getting colder')
})


app.listen(port, () => {
  console.log(`server is running on ${port}`);

})