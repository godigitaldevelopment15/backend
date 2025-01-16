const app = require("./app");
// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// create server
const server = app.listen(process.env.PORT, ()=>{
  console.log(
    `Server is running on http://localhost:${process.env.PORT}`
  );
});

