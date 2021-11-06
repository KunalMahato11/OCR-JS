// Imports
const express = require('express');
const app = express();
const fs = require('fs');
const multer = require('multer');
const { createWorker } = require('tesseract.js');

const worker = createWorker();

// Storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './uploads');
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
});

const upload = multer({ storage: storage }).single('avatar');
app.set('view engine', 'ejs');

// Utility functions
const Data = [];
let total = 0;

function buildData(text) {
	text = text.split('\n');
	for (let i = 0; i < text.length - 1; i++) {
		let a = text[i].indexOf(' ');
		if (a != -1) {
			let b = text[i].substring(a + 1, text[i].length);
			b = b.split('-');
			let c = {};
			c.name = b[0];
			c.price = b[1];
			let num = parseInt(b[1], 10);
			total += num;
			Data.push(c);
		}
	}
	console.log(Data);
	console.log('total : ' + total);
}

// Routes
app.get('/', (req, res) => {
	res.render('index');
});

app.post('/cart', (req, res) => {
	upload(req, res, (err) => {
		fs.readFile(`./uploads/${req.file.originalname}`, (err, data) => {
			if (err) return console.log('This is your error : ', err);
			(async () => {
				await worker.load();
				await worker.loadLanguage('eng');
				await worker.initialize('eng');
				const {
					data: { text },
				} = await worker.recognize(data);
				buildData(text);
				res.render('cart', { total: total, data: Data });
				await worker.terminate();
			})();
		});
	});
});

//server
const PORT = 5000;
app.listen(PORT, () => {
	console.log('server is listening on PORT ' + PORT);
});
