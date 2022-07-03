const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const request = require('request');
const port = process.env.PORT || 5001
let path = require("path");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/views')); //style with css


app.set('view engine', 'ejs')

let tableStr = ""

app.get('/', function (req, res) {
    res.render('index');
})

app.post('/clear', function (req, res) {
    clearDB()

    let str = ""
    lookup(0).catch(console.error).then((json) => {

        tableStr = "<table border='3'> <tr> <th>Name</th>  <th>Meal</th> <th>Link</th> <th>Time\n(minutes)</th> <th>Servings</th> <th>Date Added</th> </table>"
        let variables = {
            tableStr: tableStr
        };

        res.render('saved', variables);
    })

})


app.get('/saved', function (req, res) {
    let str = ""
    lookup(0).catch(console.error).then((json) => {

        json.forEach(element => str += "<tr> " + "<td> " + element.name + "</td> " + "<td> " + element.meal
            + "<td> <a href='" + element.link + "'>" + element.link + "</td> " + "<td> " + element.time + "</td> " +
            "</td> " + "<td> " + element.servings + "</td> " + "<td> " + element.date + "</td> " + "</a> </td> </tr> ");

        tableStr = "<table border='3'> <tr> <th>Name</th>  <th>Meal</th> <th>Link</th> <th>Time\n(minutes)</th> <th>Servings</th> <th>Date Added</th>" + str + "</table>"
        let variables = {
            tableStr: tableStr
        };

        res.render('saved', variables);
    })
})


let tableInnerStr = ""
let search2 = ""
let num2 = ""
let table = ""
let intolerances = ""

app.post("/recipes", (req, res) => {
    let number = req.body.num
    let search = req.body.search

    //if not checked, then it is 'undefined'. if it is checked, it is value's field
    //dairy, egg, gluten, seafood, shellfish, peanut, sesame, soy, sulfite, treenut, wheat, nut 
    let intoleranceArr = []
    let dairy = req.body.dairy
    let egg = req.body.egg
    let gluten = req.body.gluten
    let seafood = req.body.seafood
    let shellfish = req.body.shellfish
    let peanut = req.body.peanut
    let sesame = req.body.sesame
    let soy = req.body.soy
    let sulfite = req.body.sulfite
    let treenut = req.body.treenut
    let wheat = req.body.wheat

    if (dairy != undefined) {
        intoleranceArr.push('dairy')
    }
    if (egg != undefined) {
        intoleranceArr.push('egg')
    }
    if (gluten != undefined) {
        intoleranceArr.push('gluten')
    }
    if (seafood != undefined) {
        intoleranceArr.push('seafood')
    }
    if (shellfish != undefined) {
        intoleranceArr.push('shellfish')
    }
    if (peanut != undefined) {
        intoleranceArr.push('peanut')
    }
    if (sesame != undefined) {
        intoleranceArr.push('sesame')
    }
    if (soy != undefined) {
        intoleranceArr.push('soy')
    }
    if (sulfite != undefined) {
        intoleranceArr.push('sulfite')
    }
    if (treenut != undefined) {
        intoleranceArr.push('tree nut')
    }
    if (wheat != undefined) {
        intoleranceArr.push('wheat')
    }

    let dict = []

    let intoleranceStr = ""
    intoleranceStr += intoleranceArr[0]
    for (let i = 1; i < intoleranceArr.length; i++) {
        intoleranceStr += ", " + intoleranceArr[i]
    }

    if (intoleranceArr.length == 0) {
        intoleranceStr = ""
    }

    const apiKey =  process.env.API_KEY;
    let url = `http://webknox.com:8080/recipes/search?query=${search}&intolerances=${intoleranceStr}&number=${number}&apiKey=apiKey`

    if (intoleranceArr.length == 0) {
        intoleranceStr = "None"
    }

    tableInnerStr = ""
    request(url, function (err, response, body) {
        if (err) {
            console.log("error")
        } else {

            let info = JSON.parse(body)

            for (let i = 0; i < number; i++) {


                let results = info["results"][i]

                dict[i] = results


                if ((results) === undefined) {
                    table = "Could not process. Please try looking for a lower amount of recipes or for a different one."
                } else {

                    let title = String(results["title"])

                    let time = String(results["readyInMinutes"])
                    let servings = String(results["servings"])
                    let url = String(results["sourceUrl"])

                    tableInnerStr = tableInnerStr + "<tr> " + "<td> " + title + "</td> " + "<td> " + time + "</td> " +
                        "<td> " + servings + "</td> " + "<td> <a href='" + url + "'>" + url +
                        "</a> </td> </tr> "
                }
                table = "<table border='3'> <tr> <th>Name</th>  <th>Time\n(minutes)</th>  <th>Servings</th> <th>Link</th> </tr>" + tableInnerStr + "</table>"
            }

            search2 = search
            num2 = number
            intolerances = intoleranceStr

            let variables = {
                search: search,
                num: number,
                intolerances: intoleranceStr,
                tableStr: table

            };

            res.render('recipes', variables);
        }

    });

});


app.post("/save", (req, res) => {
    let name = req.body.name
    let meal = req.body.meal
    let link = req.body.link
    let time = Number(req.body.time)
    let servings = Number(req.body.servings)
    let date = new Date()
    add(name, meal, link, time, servings, String(date))

    let variables = {
        search: search2,
        num: num2,
        intolerances: intolerances,
        tableStr: table

    };

    res.render('recipes', variables);

});




//Mongo DB Code
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })

const userName =  process.env.MONGO_DB_USERNAME;
const password =  process.env.MONGO_DB_PASSWORD;

//Database and collection 
const databaseAndCollection = { db: "CMSC335_DB", collection: "savedRecipes" };

const { MongoClient, ServerApiVersion } = require('mongodb');
const { clear } = require("console");
const uri = `mongodb+srv://${userName}:${password}@cluster0.v271c.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//Clear entire database function
async function clearDB() {
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .deleteMany({});

        return result;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

//Add new entry in database function
async function add(name, meal, link, time, servings, date) {
    try {
        await client.connect();

        let newEntry = { name: name, meal: meal, link: link, time: time, servings: servings, date: date };
        await insertEntry(client, databaseAndCollection, newEntry);


    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function insertEntry(client, databaseAndCollection, newEntry) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newEntry);
}

//Lookup an existing entry based on time in database
async function lookup(time) {
    try {
        await client.connect();

        let filter = { time: { $gte: time } };
        const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);

        const result = await cursor.toArray();
        if (result) {
            return result
        } else {

            console.log(`No entry found with time`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}



app.listen(port)
console.log('Web Application has started!');