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



const uri = process.env.MONGODB_URI || `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PSS}@cluster0.mndvni1.mongodb.net/?appName=Cluster0`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(new URL(`${process.env.NEXT_CLIENT_SITE}/api/auth/jwks`))

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).send({ message: 'unauthorize' })
  }
  const token = authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).send({ message: 'unauthorize' })
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload
    next()

  }
  catch (err) {

    res.status(401).send({ message: 'unauthorize' })
  }



}


const verifyBuyer = async (req, res, next) => {


  if (!req.user.role === 'buyer') {
    return res.status(403).send({ message: 'Forbidden' })
  }

  next();
}

// verify seller
const verifySeller = async (req, res, next) => {


  if (!req.user.role === 'seller') {
    return res.status(403).send({ message: 'Forbidden' })
  }

  next();
}
// verify seller
const verifyAdmin = async (req, res, next) => {


  if (!req.user.role === 'admin') {
    return res.status(403).send({ message: 'Forbidden' })
  }

  next();
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const database = client.db("monkey")
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const wishListCollection = database.collection("wish-list");
    const userCollection = database.collection("user");



    app.get('/api/products', async (req, res) => {

      const query = {

      }
      let sortQuery = {

      }
      console.log(req.query);

      const sort = req.query.sort
      if (req.query.sort) {
        if (sort === "highToLow") {
          sortQuery = { price: - 1 }
        }
        else {
          sortQuery = { price: 1 }
        }
      }

      if (req.query.category) {
        query.category = req.query.category
      }

      if (req.query.search) {
        query.$or = [
          {
            title: {
              $regex: req.query.search,
              $options: "i", // case-insensitive
            },
          },
          {
            category: {
              $regex: req.query.search,
              $options: "i",
            },
          },
        ];
      }


      const { page = 1, limit = 8 } = req.query;
      const skip = (Number(page) - 1) * Number(limit)

      const result = await productsCollection.find(query).sort(sortQuery).skip(skip).limit(Number(limit)).toArray()

      const totalData = await productsCollection.countDocuments();
      const totalPage = Math.ceil(totalData / Number(limit))

      res.send({ products: result, page: Number(page), totalPage });
    })

    // get single product by id

    app.get('/api/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      }
      const result = await productsCollection.findOne(query);
      res.send(result)

    })

    // post products
    app.post('/api/products', verifyToken, verifySeller, async (req, res) => {
      const data = req.body;
      const result = await productsCollection.insertOne(data);
      res.send(result);
    })


    // get seller information
    app.get('/api/seller', verifyToken, verifySeller, async (req, res) => {
      const id = req.query?.id;
      const query = {};

      if (id) {
        query["sellerInfo.userId"] = id;
      }

      const totalProducts = await productsCollection.countDocuments(query);
      const totalSales = await ordersCollection.countDocuments(query);
      const totalOrders = await ordersCollection.countDocuments(query);

      const [stats] = await ordersCollection.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: "$price" },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "processing"] }, 1, 0],
              },
            },
            processingOrders: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0],
              },
            },

            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0],
              },
            },
          },
        },
      ]).toArray();

      res.send({
        totalProducts,
        totalSales: stats?.totalSales || 0,
        totalRevenue: stats?.totalRevenue || 0,
        totalOrders,
        pendingOrders: stats?.pendingOrders || 0,
        processingOrders: stats?.processingOrders || 0,
        deliveredOrders: stats?.deliveredOrders || 0,
      });
    });




    app.get('/api/seller-product', verifyToken, async (req, res) => {
      try {
        const query = {};

        // seller products
        if (req.query.id) {
          query["sellerInfo.userId"] = req.query.id;
        }

        // search by title
        if (req.query.search) {
          query.title = {
            $regex: req.query.search,
            $options: "i",
          };
        }

        // filter by status
        if (req.query.status && req.query.status !== "all") {
          query.status = req.query.status;
        }

        let cursor = productsCollection.find(query);

        // sort by category
        if (req.query.category && req.query.category !== "all") {
          query.category = req.query.category;
        }

        const result = await cursor.toArray();

        res.send(result);
      } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Server error" });
      }
    });


    

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('server is getting colder')
})


app.listen(port, () => {
  console.log(`server is running on ${port}`);

})