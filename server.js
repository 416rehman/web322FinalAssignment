const express = require("express");
const path = require("path");
const data = require("./data-service.js");
const bodyParser = require('body-parser');
const fs = require("fs");
const multer = require("multer");
const exphbs = require('express-handlebars')
const app = express();

let hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: require('./helpers/helpers')(app)
});
app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs');

const HTTP_PORT = process.env.PORT || 8080;

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  
  // tell multer to use the diskStorage function for naming files instead of the default.
  const upload = multer({ storage: storage });


app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(function(req,res,next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

app.get("/", (req,res) => {
    res.render("home");
});

app.get("/about", (req,res) => {
    res.render("about");
});

app.get("/images/add", (req,res) => {
    res.render("addImage");
});

app.get("/employees/add", (req,res) => {
    res.render("addEmployee");
});

app.get("/images", (req,res) => {
    fs.readdir("./public/images/uploaded", function(err, items) {
        res.render('images',{images:items});
    });
});

app.get("/employees", (req, res) => {
    if (req.query.status) {
        data.getEmployeesByStatus(req.query.status).then((data) => {
            res.render('employees', {employees: data});
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    } else if (req.query.department) {
        data.getEmployeesByDepartment(req.query.department).then((data) => {
            res.render('employees', {employees: data});
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    } else if (req.query.manager) {
        data.getEmployeesByManager(req.query.manager).then((data) => {
            res.render('employees', {employees: data});
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    } else {
        data.getAllEmployees().then((data) => {
            res.render('employees', {employees: data});
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    }
});

app.get("/employee/:empNum", (req, res) => {
    data.getEmployeeByNum(req.params.empNum).then((data) => {
        res.render('employee', {employee: data});
    }).catch((err) => {
        res.render('employees',{message:"no results"});
    });
});

app.post("/employee/update", (req, res) => {
    console.log(req.body);
    data.updateEmployee(req.body).then(()=>{
        res.redirect("/employees");
    })

});

app.get("/departments", (req,res) => {
    data.getDepartments().then((data)=>{
        res.render('departments', {departments: data});
    });
});


app.post("/employees/add", (req, res) => {
    data.addEmployee(req.body).then(()=>{
      res.redirect("/employees");
    });
  });

app.post("/images/add", upload.single("imageFile"), (req,res) =>{
    res.redirect("/images");
});


app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });

data.initialize().then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});
