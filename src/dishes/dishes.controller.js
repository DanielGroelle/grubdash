const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//finds the dish based on the :dishId
function findDish(req, res, next) {
    const {dishId} = req.params;
    res.locals.foundDish = dishes.find((dish)=>dish.id === dishId);
    if(res.locals.foundDish) {
        next();
    }
    else {
        next({message: `couldnt find dish: ${dishId}`, status: 404});
    }
}

//lists all of the dishs
function list(req, res, next) {
    res.status(200).json({data: dishes});
}

//reads a specific dish based on the :dishId
function read(req, res, next) {
    const foundDish = res.locals.foundDish;
    res.status(200).json({data: foundDish});
}

//validates that the body has a name key that isnt empty
function hasName(req, res, next) {
    const {name} = req.body.data;
    if (name && name !== "") {
        next();
    }
    else {
        next({message: "Dish must include a name", status: 400})
    }
}

//validates that the body has a description key that isnt empty
function hasDescription(req, res, next) {
    const {description} = req.body.data;
    if (description && description !== "") {
        next();
    }
    else {
        next({message: "Dish must include a description", status: 400})
    }
}

//validates that the body has a price key that is greater than 0
function hasPrice(req, res, next) {
    const {price} = req.body.data;
    if (typeof price === "number") {
        if (price > 0) {
            next();
        }
        else {
            next({message: "Dish must have a price that is an integer greater than 0", status: 400});
        }
    }
    else {
        next({message: "Dish must include a price", status: 400});
    }
}

//validates that the body has an image_url key that isnt empty
function hasImageUrl(req, res, next) {
    const {image_url} = req.body.data;
    if (image_url && image_url !== "") {
        next();
    }
    else {
        next({message: "Dish must include a image_url", status: 400})
    }
}

//creates a new dish based on the body data
function create(req, res, next) {
    const {data} = req.body;
    const newData = {...data, id: nextId()};
    dishes.push(newData);
    res.status(201).json({data: newData});
}

//updates a dish based on the data in the body
function update(req, res, next) {
    let foundDish = res.locals.foundDish;
    const {data} = req.body;
    //validating that if an id was included in the body, it is the same as the id in the route
    //or is not a string, or is empty, to allow for the update to take place
    if (foundDish.id === data.id || typeof data.id !== "string" || data.id === "") {
        const newDish = {...data, id: foundDish.id};
        dishes[dishes.findIndex((dish)=>foundDish.id===dish.id)] = newDish;

        res.status(200).json({data: newDish});
    }
    else {
        if (data.id) {
            next({message: `Dish id does not match route id. Dish: ${data.id}, Route: ${foundDish.id}`, status: 400})
        }
        else {
            next({message: `Dish does not exist: ${foundDish.id}`, status: 400});
        }
    }
}

module.exports = {
    list,
    read: [findDish, read],
    create: [
        hasName,
        hasDescription,
        hasPrice,
        hasImageUrl,
        create,
    ],
    update: [
        findDish,
        hasName,
        hasDescription,
        hasPrice,
        hasImageUrl,
        update,
    ],
    findDish,
};