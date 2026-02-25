const express = require('express');
const app = express();

app.get('/', (req,res) =>{
    res.send('REN: Skill Tracking Started');
});

app.listen(3000, () => {
    console.log("Ren is running on port 3000");
})