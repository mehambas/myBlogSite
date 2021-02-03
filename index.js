/* paketlerin projeye cagirilmasi */
const express = require("express");
// const ejs = require("ejs");
const mysql = require("mysql");
const app = express(); // express function app ye atadik, bundan sonra app yazinca express func kullanmis olacaz.
const port = 4000; // 8000 portunu degiskene atadik
const multer = require("multer");
const bodyParser = require("body-parser");
const session = require('express-session') // sayfaya giris yapildiginda bir daha sifre istemesin diye
var chalk = require('chalk');
var err = chalk.bold.red;
/* DATABASE ILE ILGLI KODLAR  */

var connection = mysql.createConnection({ // mysql projede kullanmak icin yukarida require ettik burda da bilgileri girdik
    host: 'localhost',
    user: 'root',
    password: '12344321',
    database: 'blogSitesi'
});

connection.connect((err) => { // Databse e baglandik, eger hata varsa bize yaz dedk.
    if (err) throw err;
    console.log("sql connection successed")
});

app.set("view engine", "ejs"); // ejs kullanacagimizi söyledik
app.use(express.static(__dirname + '/public')); // projede kulllanacagimiz ana klasörün public oldugunu söyledik

/* MULTER */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/public/img')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.jpg')
    }
})

var upload = multer({
    storage: storage
})
/* body parser */
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

/* express session */

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'blogy web site'
    //   resave: false,                 // bu ücü daha sonra anlatilacak
    //   saveUninitialized: true,
    //   cookie: { secure: true }
}))

/* callbak functions  */

function getAllArticles(callback) {

    let sql = `SELECT * FROM articles`;

    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        callback(results);
    })

}

function getAllCategories(callback) {
    let sql = `SELECT * FROM categories`;

    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        callback(results);
    })
}

function getJourneyReadNumber(callback) {
    let sql = `SELECT readnumber, header, id, category FROM articles WHERE category='Journey' ORDER BY readnumber DESC LIMIT 3`;

    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        callback(results)
    });
}

function getDesignReadNumber(callback) {
    let sql = `SELECT readnumber, header, id, category FROM articles WHERE category='Design' ORDER BY readnumber DESC LIMIT 3`;

    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        callback(results)
    });
}

function getWebDevReadNumber(callback) {
    let sql = `SELECT readnumber, header, id, category FROM articles WHERE category='Web Development' ORDER BY readnumber DESC LIMIT 3`;

    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        callback(results)
    });
}

function latestArticles(callback) {
    let sql = `SELECT header, id FROM articles ORDER BY date DESC LIMIT 3`;

    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        callback(results);
    })
}

function getMostReadArticles(callback) {

    let sql = `SELECT header, readnumber, id FROM articles ORDER BY readnumber DESC LIMIT 5`;

    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        callback(results);
    })
}


/* APP GET SAYFALARIN RENDER EDILMESI  */

app.get("/", (req, res) => {

    getAllArticles((allArticles) => {
        getAllCategories((allCategories) => {
            getJourneyReadNumber((journeyDescNumber) => {
                latestArticles((myLatestArticles) => {
                    getMostReadArticles((mostReadArtic) => {
                        getDesignReadNumber((designDescNumber) => {
                            getWebDevReadNumber((webDevDescNumber) => {

                                res.render("index", {
                                    articles: allArticles,
                                    categories: allCategories,
                                    journeyNumber: journeyDescNumber,
                                    designNumber: designDescNumber,
                                    webDevNumber: webDevDescNumber,
                                    latestArticle: myLatestArticles,
                                    mostReadArticles: mostReadArtic

                                })


                            })
                        })
                    })
                })
            })
        })
    })
})


app.get("/category/:link", (req, res) => {


    getAllCategories((allCategories) => {
        latestArticles((myLatestArticles) => {

            let tempLink = req.params.link;
            let sql = `SELECT blogSitesi.articles.* FROM articles LEFT JOIN categories ON categories.link = '${tempLink}' WHERE blogSitesi.categories.name = blogSitesi.articles.category`
            connection.query(sql, (err, results, fields) => {

                res.render("category", {
                    latestArticle: myLatestArticles,
                    categories: allCategories,
                    articles: results
                })
            })


        })
    })
})

app.get("/article/:id", (req, res) => {

    getAllCategories((allCategories) => {
        latestArticles((myLatestArticles) => {
            var today = new Date();
            var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
            var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            var dateTime = date + ' ' + time;
            let id = req.params.id;

            
            connection.query(`SELECT * FROM COMMENTS WHERE article_id='${id}' AND confirm=1`, (err, results, fields) => {
                if (err) throw err;
                let commentsAll = results;



                let sql = `SELECT * FROM articles WHERE id='${id}'`
                let sql2 = `UPDATE articles SET readnumber = readnumber + 1 WHERE id=${id}`;
                connection.query(sql2)
                connection.query(sql, (err, results, fields) => {
                    if (err) throw err;
                    res.render("article", {
                        latestArticle: myLatestArticles,
                        categories: allCategories,
                        header: results[0].header,
                        category: results[0].category,
                        article: results[0].article,
                        pic: results[0].pic,
                        id: results[0].id,
                        date: dateTime,
                        comments : commentsAll


                    })
                })
            })

        })
    })
})

app.get("/photogallery", (req, res) => {
    getAllCategories((allCategories) => {
        latestArticles((myLatestArticles) => {

            res.render("photogallery", {
                latestArticle: myLatestArticles,
                categories: allCategories
            })
        })
    })
})

app.get("/articleadd", (req, res) => {

    getAllCategories((allCategories) => {
        latestArticles((myLatestArticles) => {
            res.render("articleadd", {
                categories: allCategories,
                latestArticle: myLatestArticles
            })
        })
    })
})

app.post("/newarticle-add", upload.single("folder"), (req, res) => {

    let photoLink = "";
    if (req.file) {
        photoLink = "/img/" + req.file.filename;
    }

    let header = req.body.header;
    let article = req.body.article;
    let category = req.body.category;

    var datee = new Date();


    var myDate = `${datee.getFullYear()}-${(datee.getMonth()+1)}-${datee.getDate()}`;


    let values = `'${header}','${article}', '${photoLink}', '${category}','${myDate}','0'`;

    let sql = `INSERT INTO articles (header, article, pic, category, date, readnumber) VALUES (${values})`;

    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        res.redirect("/admin-add")
    })
})

app.get("/signin", (req, res) => {

    if (req.session.user) {
        res.redirect("/admin")
    } else {
        getAllCategories((allCategories) => {
            latestArticles((myLatestArticles) => {

                res.render("signin", {
                    latestArticle: myLatestArticles,
                    categories: allCategories
                })
            })
        })
    }


})

app.post("/register-control", (req, res) => {


    let sql = `SELECT * FROM profile`

    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        let name = req.body.name;
        let email = req.body.email;
        let password = req.body.pass;
        let re_pass = req.body.re_pass;
        let sqlname = results[0].userName;
        let sqlemail = results[0].email;
        let sqlpassword = results[0].password;

        if (name == sqlname && email == sqlemail && password == sqlpassword && re_pass == sqlpassword) {
            req.session.user = sqlname; // burda kullaniciyi sqldeki kullanciya esitledik, bu sayede cikis yapmadan bir daha girmesine gerek kalmayacak

            res.redirect("/admin")

        } else {
            res.redirect("/signin")
        }

    })



})

app.get("/exit", (req, res) => { // saayfadan cikis yapmak icin kullaniyoruz
    delete req.session.user;
    res.redirect("/")
})

app.get("/admin", (req, res) => {
    res.render("admin")
})

app.post("/comment", (req, res) => {
    
    let comment = req.body.comment;
    let email = req.body.email;
    let name = req.body.name;
    let artic_id = req.body.id;

    let sql = `INSERT INTO COMMENTS (name, comment, article_id, user_email) VALUES ('${name}', '${comment}','${artic_id}','${email}')`

    connection.query(sql, (err, results, fields) => {
        if(err) throw err;
        res.redirect("/article/"+artic_id)
    })

})

/* admin sayfalari */

app.get("/admin-all", (req, res) => {
    res.render("admin-all")
})

app.get("/admin-add", (req, res) => {
    res.render("admin-add")
})

app.get("/admin-alter", (req, res) => {
    res.render("admin-alter")
})

app.get("/admin-com", (req, res) => {
    res.render("admin-com")
})

app.get("/admin-del", (req, res) => {
    res.render("admin-del")
})



// hangi port icinde calisacagimizi belirttik,
app.listen(port, () => {
    console.log("SERVER ACTIVE")
});