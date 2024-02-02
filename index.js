const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const port = process.env.PORT || 5000;

//CORS CONFIG FILE
const corsConfig = {
  origin: [
      'http://localhost:3000',
      'https://dream-finder.vercel.app',
      'https://dream-finder-development.netlify.app/'
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
};

// middleware
app.use(cors());
app.use(express.json());
app.use(cors(corsConfig));

//MONGODB CONNECTION
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.hyjkkob.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    ///////////////////////////////////
    ///////////   DATABASE   //////////
    ///////////////////////////////////
    const userCollection = client
      .db("DreamFinder")
      .collection("UserCollection");

    ///////////   MY  MIDDLEWARE     //////////

    // token verify middleware
    const verifyToken = (req, res, next) => {
      const tokenWithBearer = req?.headers?.authorization;
      console.log("inside verifyToken middleware //////=>", tokenWithBearer);
      if (!tokenWithBearer) {
        return res.status(401).send({ message: "Unauthorized access" });
      }
      const token = tokenWithBearer.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decodedToken = decoded;
        console.log("decoded email:", decoded.email);
        next();
      });
    };

    ///////////////////////////////////
    ///////////     API     //////////
    ///////////////////////////////////

    ///////////     JWT     //////////

    // create jwt token
    app.post("/create/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "3h",
      });
      res.send({ token });
    });

    ///////////     USERS     //////////

    // create user
    app.post("/create/user", async (req, res) => {
      // get user email form client side
      const user = req.body;
      // create user email query
      const query = { email: user.email };
      // get user from DB
      const isUserExist = await userCollection.findOne(query);
      // if user already exist in DB, then return with insertedId: null
      if (isUserExist) {
        return res.send({
          message: "user already exists in DreamFinder",
          insertedId: null,
        });
      }
      // if user don't exist in DB, then insert user in DB
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // get all user
    app.get("/get/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.delete("/delete/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // end-point finished
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}

run().catch(console.dir);

// SERVER STARTING POINT
app.get("/", (req, res) => {
  res.send("Dream Finder Server Is Running");
});
app.listen(port, () => {
  console.log(`Dream Finder Server Is Sitting On Port ${port}`);
});
