//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

connectToDB().catch(err => console.log(err));

async function connectToDB () {
  await mongoose.connect("mongodb+srv://admin-rohit:Test123@cluster0.r8rmil6.mongodb.net/todolistDB")
  .then(()=>console.log("Connected Successfully"))
  .catch(err=>console.log(err));
}


const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name:"Welcome to your todolist!"
});
const item2 = new Item({
  name:"Hit the + button to add a new item."
});
const item3 = new Item({
  name:"<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

// Item.insertMany(defaultItems).then(function() {
//   console.log("Successfully savved default items to db.");
// }).catch(function() {
//   console.log(err);
// });

// let items = [];

// await Item.find().then(function(elements) {
//   console.log(elements);
//   items = elements;
//   console.log(items);
// }).catch(function(err){
//   console.log(err);
// });

// console.log(items);

async function saveDefaultItems() {
  await Item.insertMany(defaultItems)
  .then(()=> console.log("Default Items inserted sucessfully"))
  .catch((err) => console.log(err));
}


async function findItems(callback) {
  await Item.find()
  .then((elements)=>{
    callback(elements);
  })
  .catch((err) => {
    console.log(err);
  });
}

async function listExists(listItem,callback) {
  await List.findOne({name:listItem})
  .then((item)=>{
    callback(item);
  })
  .catch(err => console.log(err));
}


app.get("/", function(req, res) {
  findItems((items) => {
    if(items.length === 0) {
      saveDefaultItems().catch(err => console.log(err));
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  })
  .catch((err) => console.log(err));
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  listExists(customListName, (foundList) => {
    if(foundList === null) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save().then(()=>console.log("list saved sucessfully"));
      res.redirect("/"+customListName);
    }
    else {
      res.render("list",{listTitle: foundList.name,newListItems: foundList.items});
    }
  });
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save().then(()=> console.log("New Item Saved Sucessfully")).catch(err => console.log(err));
    res.redirect("/");
  } 
  else {
    listExists(listName, function(foundList) {
      if(foundList !== null) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);
      }
    });
  }
});


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId)
    .then(() => console.log("Sucessfully deleted checked Item"))
    .catch(err => console.log(err));
    res.redirect("/");
  }
  else {
    List.findOneAndUpdate({name:listName},{$pull: {items:{_id:checkedItemId}}})  // $pull is an operator of mongoDB and can be used to delete item from an array
    .then(function(item) {
      console.log("removed " + item.name);
      res.redirect("/"+ listName);
    })
    .catch(error => console.log(error));
  }

})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
