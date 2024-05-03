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
        "subject": "bhabhi porn",
        "topStories": null,
        "organicResults": [
            {
                "snippet": "Check out free Bhabhi porn videos on xHamster. Watch all Bhabhi XXX vids right now!",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/6632510566440ae477bdc65c/images/4e6498d6f7febba740fd47655c09c62ee64324752170c6bf2990ec7df37587a3.png",
                "link": "https://xhamster.desi/tags/bhabhi",
                "sitelinks": null,
                "position": "1",
                "source": "xhamster.desi",
                "title": "Free Bhabhi Porn Videos - xHamster",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://xhamster.desi/tags/bhabhi&ved=2ahUKEwiqptSm1OyFAxWCr5UCHR2qAbMQFnoECAYQAQ",
                "displayed_link": "xhamster.desi › tags › bhabhi",
                "snippet_highlighted_words": [
                    "Bhabhi porn"
                ]
            },
            {
                "snippet": "Indian bhabhi porn videos @ DinoTube. We provide you with free porn, so visit now!",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/6632510566440ae477bdc65c/images/4e6498d6f7febba740fd47655c09c62e74ceb6d3a628720b284ddaa139c2f7fa.png",
                "link": "https://www.dinotube.com/search/a/indian%20bhabhi",
                "sitelinks": null,
                "position": "2",
                "source": "dinotube.com",
                "title": "Indian Bhabhi Porn @ Dino Tube",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.dinotube.com/search/a/indian%2520bhabhi&ved=2ahUKEwiqptSm1OyFAxWCr5UCHR2qAbMQFnoECBEQAQ",
                "displayed_link": "www.dinotube.com › search › indian bhabhi",
                "snippet_highlighted_words": [
                    "bhabhi porn"
                ]
            },
            {
                "snippet": "Indian hot milf bhabhi and her stepcousin fucking with devar!! 13.1M 99% 21min - 1080p.",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/6632510566440ae477bdc65c/images/4e6498d6f7febba740fd47655c09c62e8c4bfb873e86045c9f9b645ebe8a5190.png",
                "link": "https://xnxx.health/search/indian+bhabhi?top",
                "sitelinks": null,
                "position": "3",
                "source": "xnxx.health",
                "title": "'indian bhabhi' Search - XNXX.COM",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://xnxx.health/search/indian%2Bbhabhi%3Ftop&ved=2ahUKEwiqptSm1OyFAxWCr5UCHR2qAbMQFnoECB0QAQ",
                "displayed_link": "xnxx.health › search › indian+bhabhi › top",
                "snippet_highlighted_words": [
                    "bhabhi"
                ]
            },
            {
                "snippet": "Check out free Desi Bhabhi porn videos on xHamster. Watch all Desi Bhabhi XXX vids right now!",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/6632510566440ae477bdc65c/images/4e6498d6f7febba740fd47655c09c62e0ca12592d3f10a8214dc3d5c6bb2e241.png",
                "link": "https://xhamster.com/tags/desi-bhabhi",
                "sitelinks": null,
                "position": "4",
                "source": "xhamster.com",
                "title": "Free Desi Bhabhi Porn Videos - xHamster",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://xhamster.com/tags/desi-bhabhi&ved=2ahUKEwiqptSm1OyFAxWCr5UCHR2qAbMQFnoECB4QAQ",
                "displayed_link": "xhamster.com › tags › desi-bhabhi",
                "snippet_highlighted_words": [
                    "Bhabhi porn"
                ]
            },
            {
                "snippet": "The best indian bhabhi xxx videos and pictures in HD quality for free.",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/6632510566440ae477bdc65c/images/4e6498d6f7febba740fd47655c09c62ef7073813e28e18592cbde4b3703aad1e.png",
                "link": "https://okxxx2.com/search/indian-bhabhi/",
                "sitelinks": null,
                "position": "5",
                "source": "OK.XXX",
                "title": "Hot 🌶️ indian bhabhi free porn videos",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://okxxx2.com/search/indian-bhabhi/&ved=2ahUKEwiqptSm1OyFAxWCr5UCHR2qAbMQFnoECBgQAQ",
                "displayed_link": "okxxx2.com › search › indian-bhabhi",
                "snippet_highlighted_words": [
                    "bhabhi"
                ]
            },
            {
                "snippet": "Bhabhi Porn Videos! - Desi Bhabhi, Bhabhi Ki Chudai, Indian Bhabhi Porn - SpankBang. ... Bhabhi creampie Bhabhi blowjob Bhabhi indian bhabhi Bhabhi cumshot Bhabhi ...",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/6632510566440ae477bdc65c/images/4e6498d6f7febba740fd47655c09c62ea37ff6e969065f87c96ae4326989c36b.png",
                "link": "https://spankbang.party/s/bhabhi/",
                "sitelinks": null,
                "position": "6",
                "source": "SpankBang",
                "title": "Bhabhi Porn - Desi Bhabhi & Bhabhi Ki Chudai Videos",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://spankbang.party/s/bhabhi/&ved=2ahUKEwiqptSm1OyFAxWCr5UCHR2qAbMQFnoECBcQAQ",
                "displayed_link": "spankbang.party › Watch",
                "snippet_highlighted_words": [
                    "Bhabhi Porn",
                    "Bhabhi Porn"
                ]
            },
            {
                "snippet": "Watch Devar Bhabhi Chudiye tube sex video for free on xHamster, with the superior collection of Asian Indian, Housewife & Beauty HD porn ...",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/6632510566440ae477bdc65c/images/4e6498d6f7febba740fd47655c09c62e41835364574a2a7c1b19adee5d5b9899.png",
                "link": "https://xhamster.desi/videos/devar-bhabhi-chudiye-xh1fbMq",
                "sitelinks": null,
                "position": "7",
                "source": "xhamster.desi",
                "title": "Devar bhabhi chudiye - xHamster",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://xhamster.desi/videos/devar-bhabhi-chudiye-xh1fbMq&ved=2ahUKEwiqptSm1OyFAxWCr5UCHR2qAbMQFnoECBIQAQ",
                "displayed_link": "xhamster.desi › videos › devar-bhabhi-chudiye-...",
                "snippet_highlighted_words": [
                    "Bhabhi",
                    "porn"
                ]
            },
            {
                "snippet": "HELLO PORN - A must see porn tube. OK PORN - The best porn videos. OK XXX - Fast. Simple. HD. MAX PORN - Porn channels. HOMO XXX - GAY Porn Tube ...",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/6632510566440ae477bdc65c/images/4e6498d6f7febba740fd47655c09c62e8f2613aa2167fba19570bc47d1c38ed4.png",
                "link": "https://www.pornhat.one/video/verified-amateurs-desi-bhabhi-smut/",
                "sitelinks": null,
                "position": "8",
                "source": "PornHat",
                "title": "HD ▶️ video Verified Amateurs - desi bhabhi smut",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.pornhat.one/video/verified-amateurs-desi-bhabhi-smut/&ved=2ahUKEwiqptSm1OyFAxWCr5UCHR2qAbMQFnoECCoQAQ",
                "displayed_link": "www.pornhat.one › video › verified-amateurs-de...",
                "snippet_highlighted_words": [
                    "PORN",
                    "porn",
                    "PORN",
                    "porn",
                    "PORN",
                    "Porn",
                    "Porn"
                ]
            },
            {
                "snippet": "Looking for the hottest Indian Bhabhi sex clips with the most popular porn stars? Then this free XXX tube is exactly what you need!",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/6632510566440ae477bdc65c/images/4e6498d6f7febba740fd47655c09c62e9ad34f7a5bfe36d8d1a466444d649342.png",
                "link": "https://zbporn.tv/search/indian+bhabhi/",
                "sitelinks": null,
                "position": "9",
                "source": "ZBPorn",
                "title": "Indian Bhabhi Porn Videos",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://zbporn.tv/search/indian%2Bbhabhi/&ved=2ahUKEwiqptSm1OyFAxWCr5UCHR2qAbMQFnoECCQQAQ",
                "displayed_link": "zbporn.tv › search › indian+bhabhi",
                "snippet_highlighted_words": [
                    "Bhabhi",
                    "porn"
                ]
            },
            {
                "snippet": "indian bhabhi porn videos - Porn TV is your source for free HQ porn videos. Porn TV offers more quality sex movies and hardcore porno than anyone ...",
                "thumbnail": null,
                "favicon": "https://serpapi.com/searches/6632510566440ae477bdc65c/images/4e6498d6f7febba740fd47655c09c62eb6e5f03a6195dd302aeedc2905523a1f.png",
                "link": "https://www.porntv.com/search/a/indian%20bhabhi",
                "sitelinks": null,
                "position": "10",
                "source": "Porn TV",
                "title": "Indian Bhabhi Porn Videos",
                "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.porntv.com/search/a/indian%2520bhabhi&ved=2ahUKEwiqptSm1OyFAxWCr5UCHR2qAbMQFnoECCUQAQ",
                "displayed_link": "www.porntv.com › search › indian bhabhi",
                "snippet_highlighted_words": [
                    "bhabhi porn"
                ]
            }
        ],
        "twitterResults": {},
        "summary": null
    });
}




);

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
