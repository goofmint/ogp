const ogp = require('ogp-parser');
const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  if (!req.query.url || req.query.url === '') {
		return res.status(400).json({ error: 'url is required' });
	}
	const { url, force } = req.query;
	const hash = crypto.createHash('sha256').update(url).digest('hex');
	const cachePath = `./cache/${hash}.json`;
	try {
		const data = await ((force && fs.existsSync(cachePath)) ? promisify(fs.readFile)(cachePath, 'utf8') : ogp(url, { skipOembed: true }));
		if (data) {
			await promisify(fs.writeFile)(cachePath, JSON.stringify(data));
		}
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})