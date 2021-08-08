/*********************************************************************************
 * WEB322 – Assignment 05
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
 * of this assignment has been copied manually or electronically from any other source
 * (including 3rd party web sites) or distributed to other students.
 *
 * Name: Hayaturehman Ahmadzai Student ID: 122539166_____ Date: 2021/08/07
 *
 * Online (Heroku) Link: https://a3ahmadzai.herokuapp.com/
 *
 ********************************************************************************/
if (process.env.NODE_ENV != 'production') require('dotenv').config()
const express = require("express");
const path = require("path");
const dataService = require("./data-service.js");
const fs = require("fs");
const multer = require("multer");
const exphbs = require('express-handlebars')
const dataServiceAuth = require("./data-service-auth")
const clientSessions = require("client-sessions")

const app = express();
let hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: require('./helpers/helpers')(app)
});
app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs');

app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "web322a5Secret!:D", // this should be a long un-guessable string.
    duration: 10 * 60 * 1000, // duration of the session in milliseconds (10 minutes)
    activeDuration: 5000 * 60 // the session will be extended by this many ms each request (5 minute)
}));

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

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user)
        res.redirect("/login");
    else next();
}

app.get("/", (req,res) => {
    res.render("home");
});

app.get("/about", (req,res) => {
    res.render("about");
});

app.get("/images/add", ensureLogin, (req,res) => {
    res.render("addImage");
});

app.get("/employees/add", ensureLogin, (req,res) => {
    dataService.getDepartments().then((data)=>{
        res.render("addEmployee", {departments: data});
    }).catch(()=>{
        res.render("addEmployee", {departments: []});
    })
});

app.get("/images", ensureLogin, (req,res) => {
    fs.readdir("./public/images/uploaded", function(err, items) {
        res.render('images',{images:items});
    });
});



/** Employees **/
app.get("/employees", ensureLogin, (req, res) => {
    if (req.query.status) {
        dataService.getEmployeesByStatus(req.query.status).then((data) => {
            res.render('employees', data.length > 0 ? {employees: data} : { message: "no results" });
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    } else if (req.query.department) {
        dataService.getEmployeesByDepartment(req.query.department).then((data) => {
            res.render('employees', data.length > 0 ? {employees: data} : { message: "no results" });
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    } else if (req.query.manager) {
        dataService.getEmployeesByManager(req.query.manager).then((data) => {
            res.render('employees', data.length > 0 ? {employees: data} : { message: "no results" });
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    } else {
        dataService.getAllEmployees().then((data) => {
            res.render('employees', data.length > 0 ? {employees: data} : { message: "no results" });
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    }
});

app.get("/employee/:empNum", ensureLogin, (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
    dataService.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
            viewData.employee = data; //store employee data in the "viewData" object as "employee"
        } else {
            viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
        viewData.employee = null; // set employee to null if there was an error
    }).then(dataService.getDepartments)
        .then((data) => {
            viewData.departments = data; // store department data in the "viewData" object as "departments"
            // loop through viewData.departments and once we have found the departmentId that matches
            // the employee's "department" value, add a "selected" property to the matching
            // viewData.departments object
            for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.employee.department) {
                    viewData.departments[i].selected = true;
                }
            }
        }).catch(() => {
        viewData.departments = []; // set departments to empty if there was an error
    }).then(() => {
        if (viewData.employee == null) { // if no employee - return an error
            res.status(404).send("Employee Not Found");
        } else {
            res.render("employee", { viewData: viewData }); // render the "employee" view
        }
    });
});

app.post("/employee/update", ensureLogin, (req, res) => {
    dataService.updateEmployee(req.body).then(()=>{
        res.redirect("/employees");
    }).catch((err)=>{
        res.status(500).send("Unable to Update Employee");
    });
});

app.post("/employees/add", ensureLogin, (req, res) => {
    dataService.addEmployee(req.body).then(()=>{
      res.redirect("/employees");
    }).catch((err)=>{
        res.status(500).send("Unable to Add Employee");
    });;
  });

app.get("/employees/delete/:empNum", ensureLogin, (req, res) => {
    dataService.deleteEmployeeByNum(req.params.empNum).then(() => {
        res.redirect("/employees")
    }).catch(() => {
        res.status(500).send("Unable to Remove Employee / Employee not found)");
    });
});






/** IMAGES **/


app.post("/images/add", ensureLogin, upload.single("imageFile"), (req,res) =>{
    res.redirect("/images");
});









/** Departments **/

app.get("/departments", ensureLogin, (req,res) => {
    dataService.getDepartments().then((data)=>{
        res.render('departments', data?.length > 0 ? {departments: data} : { message: "no results" });
    });
});

app.get("/departments/add", ensureLogin, (req,res) => {
    res.render("addDepartment");
});

app.post("/departments/add", ensureLogin, (req, res) => {
    dataService.addDepartment(req.body).then(()=>{
        res.redirect("/departments");
    }).catch((err)=>{
        res.status(500).send("Unable to Add Department");
    });;
});

app.post("/department/update", ensureLogin, (req, res) => {
    dataService.updateDepartment(req.body).then(()=>{
        res.redirect("/departments");
    }).catch((err)=>{
        res.status(500).send("Unable to Update Department");
    });
});

app.get("/department/:departmentId", ensureLogin, (req, res) => {
    dataService.getDepartmentById(req.params.departmentId).then((data) => {
        data ? res.render('department', {department: data})
        : res.status(404).send("Department Not Found");
    }).catch(() => {
        res.status(404).send("Department Not Found");
    });
});

app.get("/departments/delete/:departmentId", ensureLogin, (req, res) => {
    dataService.deleteDepartmentById(req.params.departmentId).then((data) => {
        res.redirect("/departments")
    }).catch(() => {
        res.status(500).send("Unable to Remove Department / Department not found)");
    });
});

//Authorization Routes
app.get("/login",  (req, res) => {
    res.render("login")
});

app.get("/register",  (req, res) => {
    res.render("register")
});

app.post("/register",  (req, res) => {
    dataServiceAuth.registerUser(req.body).then(()=>{
        res.render("register", {successMessage: "User created"})
    }).catch(err=>{
        res.render("register", {errorMessage: err, userName: req.body.userName})
    })
});

app.post("/login",  (req, res) => {
    req.body.userAgent = req.get('User-Agent');

    dataServiceAuth.checkUser(req.body).then((user)=>{
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        res.redirect('/employees');
    }).catch(err=>{
        res.render('login',  {errorMessage: err, userName: req.body.userName})
    })
});

app.get("/logout",  (req, res) => {
    req.session.reset();
    res.redirect("/login");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render('userHistory');
});





app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });

dataService.initialize()
    .then(dataServiceAuth.initialize)
    .then(function(){
        app.listen(HTTP_PORT, function(){
            console.log("app listening on: " + HTTP_PORT)
        });
    }).catch(function(err){
    console.log("unable to start server: " + err);
})
