const dotenv = require("dotenv")
const {app}= require("./app")

const{initModels}= require(`./models/initModels`)  
const{db} = require("./utils/database.utils")

dotenv.config({path: "./config.env"})

const startServer=async()=>{
    try {
        await db.authenticate()
        initModels()
        await db.sync()

        const PORT = process.env.PORT || 4000

         app.listen(PORT, ()=>{
            console.log("expres app runing!", PORT)
         })

    } catch (error) {
        console.log(error)
    }
}

startServer()