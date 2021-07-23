if (process.env.NODE_ENV == 'development') require('dotenv').config()
const Sequelize = require('sequelize')

var sequelize = new Sequelize(process.env.DB_Database, process.env.DB_User, process.env.DB_Password, {
    host: process.env.DB_Host,
    dialect: 'postgres',
    port: process.env.DB_Port,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    }
});

sequelize.authenticate().then(function() {
    console.log('Connection has been established successfully.');
})
    .catch(function(err) {
        console.log('Unable to connect to the database:', err);
    });

var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    hireDate: Sequelize.STRING
});

var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING,
});

Department.hasMany(Employee, {foreignKey: 'department'})

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function () {
            resolve();
        }).catch(()=>{
            resolve("unable to sync the database");
        })
    });
}

module.exports.getAllEmployees = function(){
    return new Promise(function (resolve, reject) {
        Employee.findAll().then((results)=>{
            resolve(results);
        }).catch(()=>{
            reject("no results returned");
        })
    });
}

module.exports.getEmployeesByStatus = function (status) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({ where: { status } }).then(r=>{
                resolve(r)
        }).catch(()=>{
            reject("no results returned")
        });
    });
};

module.exports.getEmployeesByDepartment = function (department) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({ where: { department } }).then(r=>{
            resolve(r)
        }).catch(()=>{
            reject("no results returned")
        });
    });
};

module.exports.getEmployeesByManager = function (employeeManagerNum) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({ where: { employeeManagerNum } }).then(r=>{
            resolve(r)
        }).catch(()=>{
            reject("no results returned")
        });
    });
};


module.exports.getEmployeeByNum = function (employeeNum) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({ where: { employeeNum } }).then(r=>{
            resolve(r[0])
        }).catch(()=>{
            reject("no results returned")
        });
    });
};

module.exports.getDepartments = function(){
    return new Promise(function (resolve, reject) {
        Department.findAll().then(r=>{
            resolve(r)
        }).catch(()=>{
            reject("no results returned")
        });
    });
}

module.exports.addEmployee = function (employeeData) {
    return new Promise(function (resolve, reject) {
        employeeData.isManager = employeeData.isManager ? "true" : "false";
        for (let attr in employeeData) {
            if (!employeeData[attr].length) employeeData[attr] = null;
        }

        Employee.create(employeeData).then(()=>{
            resolve();
        }).catch(()=>{reject("unable to create employee")})
    });
};


module.exports.updateEmployee = function(employeeData){
    return new Promise(function (resolve, reject) {
        employeeData.isManager = employeeData.isManager ? "true" : "false";
        for (let attr in employeeData) {
            if (!employeeData[attr].length) employeeData[attr] = null;
        }
        console.log(employeeData)

        Employee.update(employeeData, { where: { employeeNum: employeeData.employeeNum } }).then(()=>{
            resolve();
        }).catch(()=>{reject("unable to update employee")})
    });
}

module.exports.addDepartment = function (departmentData) {
    return new Promise(function (resolve, reject) {
        for (let attr in departmentData) {
            if (!departmentData[attr].length) departmentData[attr] = null;
        }

        Department.create(departmentData).then(()=>{
            console.log("added")
            resolve();
        }).catch(()=>{reject("unable to create department")})
    });
};

module.exports.updateDepartment = function(departmentData){
    return new Promise(function (resolve, reject) {
        for (let attr in departmentData) {
            if (!departmentData[attr].length) departmentData[attr] = null;
        }

        Department.update(departmentData, { where: { departmentId: departmentData.departmentId } }).then(()=>{
            resolve();
        }).catch(()=>{reject("unable to update department")})
    });
}

module.exports.getDepartmentById = function (id) {
    return new Promise(function (resolve, reject) {
        Department.findAll({ where: { departmentId: id } }).then(r=>{
            resolve(r[0])
        }).catch(()=>{
            reject("no results returned")
        });
    });
};

module.exports.deleteDepartmentById = function (id) {
    return new Promise(function (resolve, reject) {
        Department.destroy({ where: { departmentId: id } }).then(()=>{
            resolve()
        }).catch(()=>{
            reject()
        });
    });
};

module.exports.deleteEmployeeByNum = function (empNum) {
    return new Promise(function (resolve, reject) {
        Employee.destroy({ where: { employeeNum: empNum } }).then(()=>{
            resolve("destroyed")
        }).catch(()=>{
            reject("was rejected")
        });
    });
};