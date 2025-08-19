
const fs = require('fs');
const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
const crypto = require('crypto');

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

const alphabet = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890/=";
assert(alphabet.length == 64)
const pw = "helloworld";

function xtoy(dataBuffer, password) {
   const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Combine: salt + iv + tag + encrypted
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    return combined.toString('base64'); // encode as string
}

/**
 * Decrypts a string into a Buffer.
 * @param {string} encoded - The encrypted string.
 * @param {string} encryption_key - The key used for encryption.
 * @returns {Buffer|null} The decrypted buffer, or null if decoding fails.
 */
function ytox(encryptedString, password) {
     const combined = Buffer.from(encryptedString, 'base64');

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const tag = combined.slice(28, 44);
    const encrypted = combined.slice(44);

    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted; // returns a Buffer
}


function assert(condition) {
    if (!condition) {
        throw new Error("condition is false"); // ????
    }
}


app.get('/', (req, res) => {
    sendFile(res, "index.html")
});

function genID(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        result += chars[idx];
    }
    return result;
}



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


    id = genID()

    let encrypted = xtoy(sampleFile.data, pw);


    var stream = fs.createWriteStream(
        path.join(__dirname, "files", id)
    );
    stream.once("open", function(fd) {
        stream.write(mime + "\n");
        stream.write(encrypted);
        stream.end();
    });

    res.send(host + "/" + id);


});
app.get("/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "files", filename);

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