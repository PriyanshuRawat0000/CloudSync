const app = require('./app');

dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`AWS mock provider running on port ${PORT}`);
});


app.get("/", (req, res) => {
    res.json({
        message: "Cloud 1 Server is running"
    });
});