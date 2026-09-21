const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`CloudSync Core Server running on port ${port}`);
});

app.get("/", (req, res) => {
    res.json({
        message: "CloudSync Core Server is running"
    });
});