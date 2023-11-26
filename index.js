const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('TravelBangla server is running')
})

app.listen(port, () => {
    console.log(`TravelBangla is running on port: ${port}`);
})