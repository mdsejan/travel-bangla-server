const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
        await client.connect();

        const packageCollection = client.db('travelBangla').collection('packages');
        const userCollection = client.db('travelBangla').collection('users');

        // JWT Related API
        app.post('/api/v1/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        // packages Related API
        app.get('/api/v1/packages', async (req, res) => {
            const result = await packageCollection.find().toArray();
            res.send(result);
        })

        // User Related API
        app.get('/api/v1/users', async (req, res) => {
            const result = await userCollection.find().toArray();
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