const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// MiddleWare

app.use(cors());
app.use(express.json());

//DB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0viwxwm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const packageCollection = client.db('travelBangla').collection('packages');
        const userCollection = client.db('travelBangla').collection('users');
        const wishListCollection = client.db('travelBangla').collection('wishList');
        const tourTypeCollection = client.db('travelBangla').collection('tourType');

        // JWT Related API
        app.post('/api/v1/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })


        // middlewares
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1]

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next()
            });
        }

        // use verifyAdmin after verifyToken
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }

        // packages Related API
        app.get('/api/v1/packages', async (req, res) => {
            const tourType = req.query.type;
            const item = req.query.id;

            let query = {}

            if (tourType) {
                query.tourType = tourType
            }

            if (item) {
                query._id = new ObjectId(item)
            }

            const result = await packageCollection.find(query).toArray();
            res.send(result);
        })

        // User Related API
        app.get('/api/v1/users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        //verify admin
        app.get('/api/v1/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            // if (email !== req.decoded.email) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const query = { email: email }
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin });
        })

        //verify tourist
        app.get('/api/v1/user/tourist/:email', async (req, res) => {
            const email = req.params.email;
            // if (email !== req.decoded.email) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const query = { email: email }
            const user = await userCollection.findOne(query);
            let tourist = false;
            if (user) {
                tourist = user?.role === 'tourist'
            }
            res.send({ tourist });
        })


        // verify tour guide
        app.get('/api/v1/user/tourguide/:email', async (req, res) => {
            const email = req.params.email;
            // if (email !== req.decoded.email) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const query = { email: email }
            const user = await userCollection.findOne(query);
            let tourGuide = false;
            if (user) {
                tourGuide = user?.role === 'tourGuide'
            }
            res.send({ tourGuide });
        })

        app.get('/api/v1/tourguide', async (req, res) => {
            const query = { role: "tourGuide" }
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })


        app.post('/api/v1/user', async (req, res) => {
            const user = req.body;

            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result)
        })

        app.patch('/api/v1/user/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }

            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.patch('/api/v1/user/guide/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }

            const updatedDoc = {
                $set: {
                    role: 'tourGuide'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })


        // wishlist Related API
        app.get('/api/v1/wishList', async (req, res) => {

            const user = req.query.user;

            const query = {}

            if (user) {
                query.userEmail = user
            }

            const result = await wishListCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/api/v1/wishList', async (req, res) => {
            const wishPackage = req.body;

            const result = await wishListCollection.insertOne(wishPackage);
            res.send(result)
        })


        app.delete('/api/v1/delWishList/:listId', async (req, res) => {
            const id = req.params.listId;
            const query = { _id: new ObjectId(id) }
            const result = await wishListCollection.deleteOne(query)
            res.send(result)
        })

        // Tour Type API
        app.get('/api/v1/tourTypes', async (req, res) => {
            const result = await tourTypeCollection.find().toArray();
            res.send(result);
        })





    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('TravelBangla server is running')
})

app.listen(port, () => {
    console.log(`TravelBangla is running on port: ${port}`);
})