const mongoose = require('mongoose')


const URI="mongodb+srv://Moses:Moses2003@Cluster0.pxw5lns.mongodb.net/Notes?retryWrites=true&w=majority"

async function connect(){
    try{
        await mongoose.connect(URI);
        console.log("Connected to DB");
    }
    catch(err){
        console.log(err);
    }
}
connect();