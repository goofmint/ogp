const ogp = require('ogp-parser');
const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');

const app = express();
const port = 3000;

// 環境変数からトークンを取得
const API_TOKEN = process.env.API_TOKEN;
if (!API_TOKEN) {
	console.error('API_TOKEN environment variable is not set');
	process.exit(1);
}

app.get('/', async (req, res) => {
	// トークン認証
	const authHeader = req.headers.authorization;
	const requestToken = authHeader && authHeader.startsWith('Bearer ')
		? authHeader.substring(7)
		: null;
	if (!requestToken || requestToken !== API_TOKEN) {
		return res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
	}

	if (!req.query.url || req.query.url === '') {
		return res.status(400).json({ error: 'url is required' });
	}
	const { url, force } = req.query;
	const hash = crypto.createHash('sha256').update(url).digest('hex');
	const cachePath = `/cache/${hash}.json`;
	try {
		let data;
		if (!force && fs.existsSync(cachePath)) {
			// キャッシュが存在し、強制取得でない場合はキャッシュから読み込み
			data = JSON.parse(await promisify(fs.readFile)(cachePath, 'utf8'));
		} else {
			// キャッシュが存在しないか、強制取得の場合は新規取得
			data = await ogp(url, { skipOembed: true });
		}
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