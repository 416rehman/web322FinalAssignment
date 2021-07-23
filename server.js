/*********************************************************************************
 * WEB322 – Assignment 04
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
 * of this assignment has been copied manually or electronically from any other source
 * (including 3rd party web sites) or distributed to other students.
 *
 * Name: Hayaturehman Ahmadzai Student ID: 122539166_____ Date: 2021/07/09
 *
 * Online (Heroku) Link: https://a3ahmadzai.herokuapp.com/
 *
 ********************************************************************************/
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
    data.getDepartments().then((data)=>{
        res.render("addEmployee", {departments: data});
    }).catch(()=>{
        res.render("addEmployee", {departments: []});
    })
});

app.get("/images", (req,res) => {
    fs.readdir("./public/images/uploaded", function(err, items) {
        res.render('images',{images:items});
    });
});



/** Employees **/
app.get("/employees", (req, res) => {
    if (req.query.status) {
        data.getEmployeesByStatus(req.query.status).then((data) => {
            res.render('employees', data.length > 0 ? {employees: data} : { message: "no results" });
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    } else if (req.query.department) {
        data.getEmployeesByDepartment(req.query.department).then((data) => {
            res.render('employees', data.length > 0 ? {employees: data} : { message: "no results" });
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    } else if (req.query.manager) {
        data.getEmployeesByManager(req.query.manager).then((data) => {
            res.render('employees', data.length > 0 ? {employees: data} : { message: "no results" });
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    } else {
        data.getAllEmployees().then((data) => {
            res.render('employees', data.length > 0 ? {employees: data} : { message: "no results" });
        }).catch((err) => {
            res.render('employees',{ message: "no results" });
        });
    }
});

app.get("/employee/:empNum", (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
    data.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
            viewData.employee = data; //store employee data in the "viewData" object as "employee"
        } else {
            viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
        viewData.employee = null; // set employee to null if there was an error
    }).then(data.getDepartments)
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

app.post("/employee/update", (req, res) => {
    data.updateEmployee(req.body).then(()=>{
        res.redirect("/employees");
    }).catch((err)=>{
        res.status(500).send("Unable to Update Employee");
    });
});

app.post("/employees/add", (req, res) => {
    console.log(req.body)
    data.addEmployee(req.body).then(()=>{
      res.redirect("/employees");
    }).catch((err)=>{
        res.status(500).send("Unable to Add Employee");
    });;
  });

app.get("/employees/delete/:empNum", (req, res) => {
    data.deleteEmployeeByNum(req.params.empNum).then(() => {
        res.redirect("/employees")
    }).catch(() => {
        res.status(500).send("Unable to Remove Employee / Employee not found)");
    });
});






/** IMAGES **/


app.post("/images/add", upload.single("imageFile"), (req,res) =>{
    res.redirect("/images");
});









/** Departments **/

app.get("/departments", (req,res) => {
    data.getDepartments().then((data)=>{
        res.render('departments', data?.length > 0 ? {departments: data} : { message: "no results" });
    });
});

app.get("/departments/add", (req,res) => {
    res.render("addDepartment");
});

app.post("/departments/add", (req, res) => {
    console.log(req.body)
    data.addDepartment(req.body).then(()=>{
        res.redirect("/departments");
    }).catch((err)=>{
        res.status(500).send("Unable to Add Department");
    });;
});

app.post("/departments/update", (req, res) => {
    data.updateDepartment(req.body).then(()=>{
        res.redirect("/deparments");
    }).catch((err)=>{
        res.status(500).send("Unable to Update Department");
    });
});

app.get("/departments/:departmentId", (req, res) => {
    data.getDepartmentById(req.params.departmentId).then((data) => {
        data.length > 0 ? res.render('department', {department: data})
        : res.status(404).send("Department Not Found");
    }).catch(() => {
        res.status(404).send("Department Not Found");
    });
});

app.get("/departments/delete/:departmentId", (req, res) => {
    data.deleteDepartmentById(req.params.departmentId).then((data) => {
        res.redirect("/departments")
    }).catch(() => {
        res.status(500).send("Unable to Remove Department / Department not found)");
    });
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
