require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

async function main() {

    await mongoose.connect(process.env.MONGO_URI);

    await User.updateOne(
        { usuario: "demo" },
        { rol: "admin" }
    );

    const user = await User.findOne({
        usuario: "demo"
    });

    console.log(user);

    process.exit();

}

main();