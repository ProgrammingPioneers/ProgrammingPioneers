const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3');

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

//Setting up body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// SQLite database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

//Creating Tables
// Create categories table
db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS subCategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT
  )
`);


db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    price INTEGER,
    stock INTEGER,
    category TEXT,
    subCategory TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS salesRecord (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prodTitle TEXT,
    prodCat TEXT,
    prodSubCat TEXT,
    date TEXT,
    time TEXT
  )
`);


//Required varibles
let CatAddRes = { message: "", category: "", data: [], status: 0 };
let subCatAddRes = { message: "", category: "", subCategory: "", status: 0 };
let prodAddRes = { message: "", category: "", subCategory: "", status: 0 };
let prodEditRes = { product: "", category: "", subCategory: "" };



app.get("/", (req, res) => {

    const query1 = "SELECT * FROM products";

    db.all(query1, (err, rows) => {
        if (err) {
            console.log(err.message);
        }

        res.render("index", { rows });
    });

});


app.get("/addNew", (req, res) => {
    res.render("addNew");
});

app.get("/addNew/category", (req, res) => {
    CatAddRes = { message: "", category: "", status: 0 }
    res.render("addCategory", { CatAddRes });
});

app.get("/CatMgr", (req, res) => {

    const query = "SELECT * FROM categories";
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send(err.message);
        }

        res.render("CatMgr", { rows });
    })
});

app.get("/addNew/:category/subCategory", (req, res) => {
    const ReqCat = req.params.category;

    const query = 'SELECT * FROM subCategories WHERE category = ?';

    db.all(query, [ReqCat], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        //Render the data or send it as JSON, depending on your needs
        //res.json(rows);

        subCatAddRes = { message: "", category: ReqCat, subCategory: "", status: 0 }
        res.render("addSubCategory", { subCatAddRes, rows });
    });

});

app.get("/addNew/:category/:subCategory/product", (req, res) => {
    const ReqCat = req.params.category;
    const ReqSubCat = req.params.subCategory;

    const query = "SELECT * FROM products WHERE category = ? AND subCategory = ?";

    db.all(query, [ReqCat, ReqSubCat], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        prodAddRes = { message: "", category: ReqCat, subCategory: ReqSubCat, status: 0 }
        res.render("addProduct", { prodAddRes, rows });
    });

});


app.get("/edit/:category/:subCategory/:product", (req, res) => {
    const ReqCat = req.params.category;
    const ReqSubCat = req.params.subCategory;
    const ReqProd = req.params.product;

    const query = "SELECT * FROM products WHERE title = ? AND category = ? AND subCategory = ? ";

    db.all(query, [ReqProd, ReqCat, ReqSubCat], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        prodEditRes = { product: ReqProd, category: ReqCat, subCategory: ReqSubCat, status: 1 }
        res.render("editProd", { prodEditRes, rows });

    });

});

app.get("/editSub/:category/:subCategory/:product", (req, res) => {
    const ReqCat = req.params.category;
    const ReqSubCat = req.params.subCategory;
    const ReqProd = req.params.product;

    const query = "SELECT * FROM products WHERE title = ? AND category = ? AND subCategory = ? ";

    db.all(query, [ReqProd, ReqCat, ReqSubCat], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        prodEditRes = { product: ReqProd, category: ReqCat, subCategory: ReqSubCat, status: 0 }
        res.render("editProdSub", { prodEditRes, rows });

    });

});

//Add Independent Product
app.get('/addInd', (req, res) => {

    const response = "";
    res.render('AddProdInd', { response });
})


//Sales Record

app.get('/salesRecord', (req, res) => {

    db.all("SELECT * FROM salesRecord" ,  (err , rows)=>{
        if(err) {
            console.log(err);
        }

        res.render("SalesRecord" , { rows });
    })

})

app.get('/addSalesRecord/:category/:subCategory/:title', (req, res)=>{
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var today = new Date();
    let date = today.toLocaleDateString("en-US");
    let hours = today.getHours();
    let minutes = today.getMinutes();
    let time = `${hours} : ${minutes}`

    const prodTitle = req.params.title;
    const prodCat = req.params.category;
    const prodSubCat = req.params.subCategory;

    db.get('SELECT * FROM products WHERE title = ? AND category = ? AND subCategory = ?' , [prodTitle , prodCat , prodSubCat] , (err , result)=>{
        
        if(err) {
            console.log(err);
        }
        const newStock = result.stock - 1;
        db.run('UPDATE products SET stock = ? WHERE title = ? AND category = ? AND subCategory = ?' , [newStock , prodTitle , prodCat , prodSubCat] , (err)=>{
            if(err) {
                console.log(err);
            }

            db.run('INSERT INTO salesRecord (prodTitle, prodCat , prodSubCat , date , time) VALUES (?,?,?,?,?)', [prodTitle , prodCat , prodSubCat , date , time] , (err)=>{
                if(err) {
                    console.log(err);
                }
                res.redirect("/salesRecord");
            });

        });
    });
    
})



//Search Query
app.get('/search', (req, res) => {
    const searchQuery = req.query.searchQuery;

    let query = 'SELECT * FROM products';

    // If search query is provided, modify the query to search by title
    if (searchQuery) {
        query = `SELECT * FROM products WHERE title LIKE '%${searchQuery}%' OR
        category LIKE '%${searchQuery}%' OR
        subCategory LIKE '%${searchQuery}%'`;
    }

    db.all(query, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        res.render('index', { rows });
    });
});


//Put Req's

//Edit product form home
app.post("/edit/:category/:subCategory/:product", (req, res) => {
    const ReqCat = req.params.category;
    const ReqSubCat = req.params.subCategory;
    const ReqProd = req.params.product;

    const UpTitle = req.body.UpTitle;
    const UpStock = req.body.UpStock;
    const UpPrice = req.body.UpPrice;

    console.log();
    const query = 'UPDATE products SET title = ?, price = ?, stock = ? WHERE title = ? AND category = ? AND subCategory = ?';

    db.run(query, [UpTitle, UpStock, UpPrice, ReqProd, ReqCat, ReqSubCat], (err) => {
        if (err) {
            console.log(err.message);
        }

        res.redirect('/');
    })
})

//Edit product while managing subcategory
app.post("/editSub/:category/:subCategory/:product", (req, res) => {
    const ReqCat = req.params.category;
    const ReqSubCat = req.params.subCategory;
    const ReqProd = req.params.product;

    const UpTitle = req.body.UpTitle;
    const UpStock = req.body.UpStock;
    const UpPrice = req.body.UpPrice;

    console.log();
    const query = 'UPDATE products SET title = ?, price = ?, stock = ? WHERE title = ? AND category = ? AND subCategory = ?';

    db.run(query, [UpTitle, UpStock, UpPrice, ReqProd, ReqCat, ReqSubCat], (err) => {
        if (err) {
            console.log(err.message);
        }

        res.redirect(`/addNew/${ReqCat}/${ReqSubCat}/product`);
    })
})


//delete Req's

//Compelete Category delete
app.get("/delete/:category", (req, res) => {
    const ReqCat = req.params.category;

    const query1 = "DELETE FROM products WHERE category = ?";
    const query2 = "DELETE FROM subCategories WHERE category = ? ";
    const query3 = "DELETE FROM categories WHERE title = ? ";

    db.run(query1, [ReqCat], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        db.run(query2, [ReqCat], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }

            db.run(query3, [ReqCat], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Internal Server Error');
                }

                res.redirect('/CatMgr')
            });
        });
    });


});

//Compelete Subcategory delete
app.get("/delete/:category/:subCategory/", (req, res) => {
    const ReqCat = req.params.category;
    const ReqSubCat = req.params.subCategory;

    const query1 = "DELETE FROM products WHERE subCategory = ? AND category = ? ";
    const query2 = "DELETE FROM subCategories WHERE title = ? AND category = ? ";

    db.run(query1, [ReqSubCat, ReqCat], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        db.run(query2, [ReqSubCat, ReqCat], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }

            res.redirect(`/addNew/ard/subCategory`);
        });
    });

});

//Compelete Product delete
app.get("/delete/:category/:subCategory/:product", (req, res) => {
    const ReqCat = req.params.category;
    const ReqSubCat = req.params.subCategory;
    const ReqProd = req.params.product;

    const query = "DELETE FROM products WHERE title = ? AND category = ? AND subCategory = ? ";

    db.run(query, [ReqProd, ReqCat, ReqSubCat], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        res.redirect("/");
    });

});

//Compelete Product delete while managing a sub-category
app.get("/deleteSub/:category/:subCategory/:product", (req, res) => {
    const ReqCat = req.params.category;
    const ReqSubCat = req.params.subCategory;
    const ReqProd = req.params.product;



    const query = "DELETE FROM products WHERE title = ? AND category = ? AND subCategory = ? ";

    db.run(query, [ReqProd, ReqCat, ReqSubCat], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        res.redirect(`/addNew/${ReqCat}/${ReqSubCat}/product`);
    });

});


//Add category
app.post("/addNew/category", (req, res) => {

    try {
        let catTitle = req.body.categoryTitle;

        db.get('SELECT * FROM categories WHERE title = ?', [catTitle], (err, result) => {
            if (err) {
                console.log(err.message);
                return res.status(500).send('Internal Server Error');
            }

            if (result == undefined) {
                db.run('INSERT INTO categories (title) VALUES (?)', [catTitle], (err) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).send('Internal Server Error');
                    }
                });

                CatAddRes = { message: "Category added successfuly!", category: catTitle, status: 1 };

            } else {
                CatAddRes = { message: "Category exists already", category: catTitle, status: 1 };
            }

            res.render("addCategory", { CatAddRes });

        });



    } catch (error) {
        console.log(error.message)
    }

});


//Add sub-category
app.post("/addNew/:category/subCategory", async (req, res) => {

    try {
        let subCatTitle = req.body.subCategoryTitle;
        let SubCat_Cat = req.params.category;

        db.get('SELECT * FROM subCategories WHERE title = ? AND category = ?', [subCatTitle, SubCat_Cat], async (err, result) => {
            if (err) {
                console.log(err.message);
                return res.status(500).send('Internal Server Error');
            }

            if (result == undefined) {
                db.run('INSERT INTO subCategories (title , category) VALUES (?,?)', [subCatTitle, SubCat_Cat], (err) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal Server Error');
                    }

                    subCatAddRes = { message: "Subcategory created", category: SubCat_Cat, subCategory: subCatTitle, status: 1 };
                    res.redirect(`/addNew/${SubCat_Cat}/subCategory`);
                });
            } else {

                const query = 'SELECT * FROM subCategories WHERE category = ?';

                db.all(query, [SubCat_Cat], (err, rows) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).send('Internal Server Error');
                    }

                    subCatAddRes = { message: "Subcategory exists already!", category: SubCat_Cat, subCategory: subCatTitle, status: 1 };
                    res.render("addSubCategory", { subCatAddRes, rows });
                });


            }

        })






    } catch (error) {
        console.log(error.message)
    }

});

//Add product
app.post("/addNew/:category/:subCategory/product", async (req, res) => {

    try {
        let prodTitle = req.body.productTitle;
        let prodPrice = req.body.productPrice;
        let prodStock = req.body.productStock;

        let prodCat = req.params.category
        let prodSubCat = req.params.subCategory;

        db.get('SELECT * FROM products WHERE title = ? AND category = ? AND subCategory = ?', [prodTitle, prodCat, prodSubCat], async (err, result) => {
            if (err) {
                console.log(err.message);
                return res.status(500).send('Internal Server Error');
            }

            if (result == undefined) {
                db.run('INSERT INTO products (title , price , stock , category , subCategory) VALUES (?,?,?,?,?)', [prodTitle, prodPrice, prodStock, prodCat, prodSubCat], (err) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal Server Error');
                    }

                    res.redirect(`/addNew/${prodCat}/${prodSubCat}/product`)
                });
            } else {
                const query = "SELECT * FROM products WHERE category = ? AND subCategory = ?";

                db.all(query, [ReqCat, ReqSubCat], (err, rows) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).send('Internal Server Error');
                    }

                    //Render the data or send it as JSON, depending on your needs
                    //res.json(rows);

                    prodAddRes = { message: "Product exists already!", category: prodCat, subCategory: prodSubCat, status: 1 };
                    res.render("addProduct", { prodAddRes, rows });
                });
            }

        })

    } catch (error) {
        console.log(error.message)
    }

});



app.post('/addInd', (req, res) => {

    const ReqCat = req.body.category;
    const ReqSubCat = req.body.subCategory;
    const ReqTitle = req.body.title;
    const ReqPrice = req.body.price;
    const ReqStock = req.body.stock;
    let response = "";

    db.get("Select * FROM categories WHERE title = ?", [ReqCat], (err, Cat) => {

        if (err) {
            console.log(err);
        }

        if (!Cat) {
            response = "Category not found!"
            res.render("AddProdInd", { response });
        } else {

            db.get("Select * FROM subCategories WHERE title = ?", [ReqSubCat], (err, subCat) => {

                if (err) {
                    console.log(err);
                }

                if (!subCat) {
                    response = "Sub-Category not found!";
                    res.render("AddProdInd", { response });
                } else {

                    db.run("INSERT INTO products (title , price , stock , category , subCategory) VALUES (?,?,?,?,?)",
                        [ReqTitle, ReqPrice, ReqStock, ReqCat, ReqSubCat], (err, result) => {

                            if (err) {
                                console.log(err);
                            }

                            res.redirect('/');

                        })

                }

            })

        }

    })

})


app.listen(3000, () => {
    console.log('hurah!');
});