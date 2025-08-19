
const fs = require('fs');
const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');

const app = express();
const port = process.env.PORT || 3000;


filetype = require("file-type");




const host = process.env.HOST || "http://127.0.0.1:3000"




// app.use(express.json()); // For JSON bodies
// app.use(express.urlencoded({ extended: true })); // For form data
app.use(fileUpload());

function sendFile(res, relpath) {
    let fullpath = path.join(__dirname, relpath)


    fs.access(fullpath, fs.constants.F_OK, error => {
        if (error) {
            res.writeHead(404, {"Content-type": "text/html"});
            res.end("File " + fullpath + " not found");
            return;
        }
    })
    

    fs.readFile(fullpath, function (error, content) {
        if (error) {
            res.writeHead(404, {"Content-type": "text/html"});
            res.end("File " + fullpath + " not found");
            return;
        }
        // res.writeHead(404, {"Content-type": "text/html"});
        res.end(content);
    })

}

const chars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890/=";
const pw = "helloworld";

function xtoy(bytes, password) {
    let b64 = bytes.toString("base64");

    let final = "";
    for (let i = 0; i < b64.length; i++) {
        char = b64[i];


        target = chars.indexOf(password[i % password.length]);
        final = final + chars[(chars.indexOf(char) + target) % chars.length];
    }

    return final;



}




function ytox(encoded, password) {
    let base64 = "";
    for (let i = 0; i < encoded.length; i++) {
        let char = encoded[i];
        let target = chars.indexOf(password[i % password.length]);
        
        // subtract instead of add
        let idx = (chars.indexOf(char) - target + chars.length) % chars.length;
        base64 += chars[idx];
    }

    return Buffer.from(base64, "base64");
}

function 


app.get('/', (req, res) => {
    sendFile(res, "index.html")
});


app.post("/api/upload", async (req, res) => {
    
    
    let sampleFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    sampleFile = req.files.uploadedFile;

    let type = await filetype.fileTypeFromBuffer(sampleFile.data);

   const mime = type ? type.mime : "text/plain";


     assert(ytox(xtoy(sampleFile.data, pw), pw) === sampleFile.data)



    let encrypted = xtoy(sampleFile.data, pw);


    var stream = fs.createWriteStream(
        path.join(__dirname, "images", "test")
    );
    stream.once("open", function(fd) {
        stream.write(mime + "\n");
        stream.write(encrypted);
        stream.end();
    });

    res.send(host + "/" + "test");


});
app.get("/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "images", filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) return res.status(404).send("File not found");

        fs.readFile(filePath, (err, data) => {
            if (err) return res.status(500).send("Error reading file");

            // Find first newline (MIME type separator)
            const newlineIndex = data.indexOf(10); // 10 = \n in ASCII
            if (newlineIndex === -1) return res.status(500).send("Invalid file format");

            const mime = data.slice(0, newlineIndex).toString().trim();
            const encrypted = data.slice(newlineIndex + 1).toString(); // convert encrypted part to string for ytox

            const decrypted = ytox(encrypted, pw);

            res.setHeader("Content-Type", mime);
            res.send(decrypted);
        });
    });
});




app.listen(port, () => {
    console.log(`Server running! ${host}`);
});