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
        "id": 2,
        "name": "llamaContent",
        "title": "llama-content",
        "creatorId": 1,
        "creatorName": "Akash",
        "createDate": "24-01-1989",
        "updateDate": "24-01-1989",
        "active": true
    },
    {
        "id": 1,
        "name": "Search",
        "title": "Search",
        "creatorId": 1,
        "creatorName": "Akash",
        "createDate": "24-01-1989",
        "updateDate": "24-01-1989",
        "active": true
    }
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

app.post('/search', (req, res) => {
    const { email, password } = req.body;
    // For simplicity, just return a static token
     new Promise(resolve => setTimeout(resolve, 10000));
    //res.json({"answer":"Today's Temparature is 39 degree celcius in kanpur, \n it looks like summer has come, \n I hope you are prepared for it \n please let me know in case you need help "});


    res.json({
        "subject": "News on trump today",
        "topStories": [
            {
                "date": "45 minutes ago",
                "thumbnail": "https://serpapi.com/searches/663e3685ce87f8674b69d572/images/64dae0e4297fda5fa880d4a6f45389883dab98903a1e13a0.jpeg",
                "link": "https://www.nbcnews.com/politics/donald-trump/live-blog/trump-hush-money-trial-day-15-live-updates-rcna150795",
                "source": "NBC News",
                "title": "Live updates: Trump fixer Michael Cohen to testify Monday at hush money trial"
            },
            {
                "date": "1 hour ago",
                "thumbnail": "https://serpapi.com/searches/663e3685ce87f8674b69d572/images/64dae0e4297fda5fd0afd7176369f3eab286ac38c5437c70.jpeg",
                "link": "https://apnews.com/article/trump-trial-hush-money-stormy-daniels-cohen-ddef05884265e4d6217b55a89304b878",
                "source": "AP News",
                "title": "Trump hush money trial: Michael Cohen awaits turn after graphic Stormy Daniels account"
            },
            {
                "date": "46 minutes ago",
                "thumbnail": "https://serpapi.com/searches/663e3685ce87f8674b69d572/images/64dae0e4297fda5f025740c03d669c2e735cf228ea59082e.jpeg",
                "link": "https://www.usatoday.com/story/news/politics/2024/05/10/donald-trump-trial-news-hush-money-case-live-updates/73635879007/",
                "source": "USA Today",
                "title": "Trump trial live updates: Ex-Oval Office aide who testified on checks returns to stand"
            }
        ],
        "organicResults": [
            {
                "snippet": "Read the latest news and analysis on President Donald Trump. Follow today's top stories and breaking news from inside Washington D.C. and beyond.",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/663e3685ce87f8674b69d572/images/46493b5ddc8ac9302f4a430cac31ed35610e59d0a38d710b94957e73fac173ed.png",
                "link": "https://www.politico.com/news/donald-trump",
                "sitelinks": null,
                "position": "1",
                "source": "Politico",
                "title": "Donald Trump: Latest News, Top Stories & Analysis",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.politico.com/news/donald-trump&ved=2ahUKEwj7jNHbrIOGAxXHIkQIHXGeBUUQFnoECBkQAQ&usg=AOvVaw32nxNiMFBtZH_hmpRgGAQy",
                "displayed_link": "www.politico.com",
                "snippet_highlighted_words": [
                    "latest news",
                    "Trump",
                    "today's",
                    "news"
                ]
            },
            {
                "snippet": "News about Donald Trump, the 45th US president, including comment and features from the Guardian.",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/663e3685ce87f8674b69d572/images/46493b5ddc8ac9302f4a430cac31ed35a55148f5d309a9602b59e4bac4f45b56.png",
                "link": "https://www.theguardian.com/us-news/donaldtrump",
                "sitelinks": null,
                "position": "2",
                "source": "The Guardian",
                "title": "Donald Trump | US news",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.theguardian.com/us-news/donaldtrump&ved=2ahUKEwj7jNHbrIOGAxXHIkQIHXGeBUUQFnoECCAQAQ&usg=AOvVaw01oO5zt_z8hWqnGYLmuX69",
                "displayed_link": "www.theguardian.com",
                "snippet_highlighted_words": [
                    "News",
                    "Trump"
                ]
            }
        ],
        "twitterResults": null,
        "summary": null
    });
}




);

app.post('/generateArticle', (req, res) => {

    // For simplicity, just return a static token
    new Promise(resolve => setTimeout(resolve, 10000));

    res.json({ "title": "Cricketer-turned-cop DSP Joginder Sharma back in news, now for announcing police action against ‘violent protestors", "body":"Former cricketer Joginder Sharma – who gave a commendable performance against Pakistan in the final of the inaugural edition of the T20 World Cup in 2007 – is back in the news.\n" +
            "\n" +
            "He hit the headlines after he was heard announcing that the Haryana Police shall initiate legal action and seek the cancellation of passports of those engaging in violence during the ongoing farmer protest at the Haryana-Punjab border.\n" +
            "\n" +
            "Talking to The Indian Express, Sharma, who is now a DSP in the Haryana Police, said, “Some people are misinterpreting the video as if we are going to initiate action against the protestors. It is incorrect. We are taking action against those who are indulging in ‘violence’ during the ongoing protests. I am doing my duty as any other police officer. We have initiated action only against those who are indulging in violence and not against other protestors. So far, nearly 100 such people have been identified and action is being initiated against them.","generationId":1 });
});


app.post('/generateTags', (req, res) => {
    new Promise(resolve => setTimeout(resolve, 10000));
    res.json({"userId":1,"generationId": 1, "tags": ["headline", "good", "modi"]});
});

app.post('/saveArticle', (req, res) => {
    new Promise(resolve => setTimeout(resolve, 10000));
    res.json({"userId":1,"articleId": 1, "title":"aaffa","body":"asfasfsava","tags": ["headline", "good", "modi"]});
});

app.post('/publish', (req, res) => {
    new Promise(resolve => setTimeout(resolve, 10000));
    res.json({"userId":1,articleId:1,partnerId:1,publishId:1});
});

app.post('/loginwordpress', (req, res) => {
    new Promise(resolve => setTimeout(resolve, 10000));
    res.json({"userId":1,partnerId:1});
});

app.listen(PORT, () => {
    console.log(`Mock server is running on port ${PORT}`);
});
