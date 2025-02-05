import express from 'express';

const app = express();
const port = 3000;

app.get('/api', (req, res) => {
    res.send("Hello from the backend!");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
