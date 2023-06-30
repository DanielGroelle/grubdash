const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//finds the order based on the :orderId in the route
function findOrder(req, res, next) {
    const {orderId} = req.params;
    res.locals.foundOrder = orders.find((order)=>order.id === orderId);
    if(res.locals.foundOrder) {
        next();
    }
    else {
        next({message: `Couldnt find order: ${orderId}`, status: 404});
    }
}

//lists all of the orders
function list(req, res, next) {
    res.status(200).json({data: orders});
}

//reads a specific order based on the :orderId in the route
function read(req, res, next) {
    const foundOrder = res.locals.foundOrder;
    res.status(200).json({data: foundOrder});
}

//validates that the body has a deliverTo key that isnt empty
function hasDeliverTo(req, res, next) {
    const {deliverTo} = req.body.data;
    if (deliverTo && deliverTo !== "") {
        next();
    }
    else {
        next({message: "Order must include a deliverTo", status: 400});
    }
}

//validates that the body has a mobileNumber key that isnt empty
function hasMobileNumber (req, res, next) {
    const {mobileNumber} = req.body.data;
    if (mobileNumber && mobileNumber !== "") {
        next();
    }
    else {
        next({message: "Order must include a mobileNumber", status: 400});
    }
}

//validates that the body has a dishes key that is an array with at least one element
function hasDishes(req, res, next) {
    const {dishes} = req.body.data;
    if (Array.isArray(dishes)) {
        if (dishes.length > 0) {
            next();
        }
        else {
            next({message: "Order must include at least one dish", status: 400});
        }
    }
    else {
        next({message: "Order must include a dish", status: 400});
    }
}

//validates that the each dish in the dishes array has a quantity key that is greater than 0
function hasQuantity(req, res, next) {
    const {dishes} = req.body.data;
    
    let bad = false;
    let index;
    dishes.forEach((dish, currentIndex)=>{
        if (typeof dish.quantity !== "number" || dish.quantity <= 0) {
            bad = true;
            index = currentIndex;
        }
    });

    if (bad) {
        next({message: `Dish ${index} must have a quantity that is an integer greater than 0`, status: 400});
    }
    else {
        next();
    }
}

//creates a new order based on the body data
function create(req, res, next) {
    const {data} = req.body;
    const newData = {...data, id: nextId()};
    orders.push(newData);
    res.status(201).json({data: newData});
}

//validates that the body has a status key is not delivered
function hasStatus(req, res, next) {
    const {status} = req.body.data
    if (status && status !== "") {
        switch(status) {
            case "pending":
                next();
                break;
            case "preparing":
                next();
                break;
            case "out-for=delivery":
                next();
                break;
            case "delivered":
                next({message: "A delivered order cannot be changed", status: 400});
                break;
            default:
                next({message: "Order must have a status of pending, preparing, out-for-delivery, delivered", status: 400});
        }
    }
    else {
        next({message: "Order must have a status of pending, preparing, out-for-delivery, delivered", status: 400});
    }
}

//updates an order based on the data in the body
function update(req, res, next) {
    let foundOrder = res.locals.foundOrder;
    const {data} = req.body;
    //validating that if an id was included in the body, it is the same as the id in the route
    //or is not a string, or is empty, to allow for the update to take place
    if (foundOrder.id === data.id || typeof data.id !== "string" || data.id === "") {
        const newOrder = {...data, id: foundOrder.id};
        orders[orders.findIndex((order)=>foundOrder.id===order.id)] = newOrder;

        res.status(200).json({data: newOrder});
    }
    else {
        if (data.id) {
            next({message: `Order id does not match route id. Order: ${data.id}, Route: ${foundOrder.id}.`, status: 400})
        }
        else {
            next({message: `Order does not exist: ${foundOrder.id}`, status: 400});
        }
    }
}

//deletes an order based on the :orderId
//validates that the order is pending, as only pending orders can be deleted
function destroy(req, res, next) {
    let foundOrder = res.locals.foundOrder;
    if (foundOrder.status === "pending") {
        orders.splice(orders.findIndex((order)=>foundOrder.id===order.id), 1);
        res.sendStatus(204);
    }
    else {
        next({message: "An order cannot be deleted unless it is pending.", status: 400});
    }
}

module.exports = {
    list,
    read: [findOrder, read],
    create: [
        hasDeliverTo,
        hasMobileNumber,
        hasDishes,
        hasQuantity,
        create,
    ],
    update: [
        findOrder,
        hasStatus,
        hasDishes,
        hasDeliverTo,
        hasMobileNumber,
        hasDishes,
        hasQuantity,
        update,
    ],
    destroy: [findOrder, destroy],
    findOrder,
};