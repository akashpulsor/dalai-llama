const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());

// Mock data
let users = [];
let tools = [
    {
        "id": 1,
        "name": "llamaContent",
        "title": "llama-content",
        "creatorId": 1,
        "creatorName": "Akash",
        "createDate": "24-01-1989",
        "updateDate": "24-01-1989",
        "active": true
    },
    // Add other tool objects here
];
let llms = [
    {
        "id": 1,
        "label": "GPT",
        "value": "GPT",
        "creatorId": 1,
        "creatorName": "Akash",
        "createDate": "24-01-1989",
        "updateDate": "24-01-1989",
        "active": true
    },
    {
        "id": 2,
        "label": "gemini",
        "value": "gemini",
        "creatorId": 1,
        "creatorName": "Akash",
        "createDate": "24-01-1989",
        "updateDate": "24-01-1989",
        "active": true
    },
    {
        "id": 3,
        "label": "llama",
        "value": "llama",
        "creatorId": 1,
        "creatorName": "Akash",
        "createDate": "24-01-1989",
        "updateDate": "24-01-1989",
        "active": true
    },
    // Add other llm objects here
];

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    // For simplicity, just return a static token
    res.json({ token: "12345678",user:{id:1,userName:"Akash"} });
});

// Register endpoint
app.post('/register', (req, res) => {
    const { userName, email, password } = req.body;
    // Assuming some registration logic here
    const newUser = { id: users.length + 1, userName, email, password, credit: 234 };
    users.push(newUser);
    res.json({ token: "12345678",user:newUser });
});

// Get tools endpoint
app.get('/getTools', (req, res) => {
    res.json(tools);
});

// Get LLm endpoint
app.get('/getLLm', (req, res) => {
    res.json(llms);
});

app.listen(PORT, () => {
    console.log(`Mock server is running on port ${PORT}`);
});
