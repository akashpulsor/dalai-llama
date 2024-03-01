const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {sleep} = require("yarn/lib/cli");

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

let generateStructure= [{heading:"Heading1",
    points:["point1", "point2", "point3"]},
    {heading:"Heading2", points:['point4', 'point5', 'point6']},
    {heading:"Heading3", points:['point7', 'point8', 'point9']},
    {heading:"Heading4", points:['point10', 'point11', 'point12']},
    {heading:"Heading5", points:['point13', 'point14', 'point15']},
    {heading:"Heading6", points:['point16', 'point17', 'point18']},]


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

app.post('/loginwordpress', (req, res) => {

    //const {email:"", password:"password", saveCredentials:"true"} = req.body
    // For simplicity, just return a static token
    res.json({ token: "12345678",user:{id:1,userName:"Akash"} });
});

app.post('/generateStructure', (req, res) => {
    const { email, password } = req.body;
    // For simplicity, just return a static token
     new Promise(resolve => setTimeout(resolve, 10000));
    res.json(generateStructure);
});

app.post('/generateArticle', (req, res) => {

    // For simplicity, just return a static token
    new Promise(resolve => setTimeout(resolve, 10000));

    res.json({ "title": "aaaaaaaaaaaaaaaaaaaaaaaaaf", "body":"Former cricketer Joginder Sharma – who gave a commendable performance against Pakistan in the final of the inaugural edition of the T20 World Cup in 2007 – is back in the news.\n" +
            "\n" +
            "He hit the headlines after he was heard announcing that the Haryana Police shall initiate legal action and seek the cancellation of passports of those engaging in violence during the ongoing farmer protest at the Haryana-Punjab border.\n" +
            "\n" +
            "Talking to The Indian Express, Sharma, who is now a DSP in the Haryana Police, said, “Some people are misinterpreting the video as if we are going to initiate action against the protestors. It is incorrect. We are taking action against those who are indulging in ‘violence’ during the ongoing protests. I am doing my duty as any other police officer. We have initiated action only against those who are indulging in violence and not against other protestors. So far, nearly 100 such people have been identified and action is being initiated against them.","generationId":1 });
});

app.post('/generateTags', (req, res) => {
    new Promise(resolve => setTimeout(resolve, 10000));
);

app.post('/generateTags', (req, res) => {
    new Promise(resolve => setTimeout(resolve, 10000));
    res.json({"generationId": 1, "tags": ["headline", "good", "modi"]});
});

app.post('/saveArticle', (req, res) => {
    new Promise(resolve => setTimeout(resolve, 10000));
    res.json({"articleId": 1, "title":"aaffa","body":"asfasfsava","tags": ["headline", "good", "modi"]});
});


app.post('/publish', (req, res) => {
    new Promise(resolve => setTimeout(resolve, 10000));
    res.json({articleId:1,partnerId:1,publishId:1});
});

app.post('/loginwordpress', (req, res) => {
    new Promise(resolve => setTimeout(resolve, 10000));
    res.json({partnerId:1});
});

app.listen(PORT, () => {
    console.log(`Mock server is running on port ${PORT}`);
});
