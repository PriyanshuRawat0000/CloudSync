const app = require('./app');

dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Azure mock provider running on port ${PORT}`);
});
app.get("/", (req, res) => {
    res.json({
        message: "Cloud 2 Server is running"
    });
});