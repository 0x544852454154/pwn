const express = require('express');
const app = express();
app.use(express.json());

const ENC = Buffer.from('70776e6c61627b7072307430747970335f70306c6c757431306e5f3473745f7263335f303037377d', 'hex');

function merge(target, source) {
    for (let key in source) {
        if (key in source && key in target) {
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

app.post('/api/settings', (req, res) => {
    let config = {};
    merge(config, req.body);
    if (Object.prototype.isAdmin) {
        return res.json({ status: 'admin', flag: ENC.toString() });
    }
    res.json({ status: 'saved' });
});

if (require.main === module) {
    app.listen(3001);
}
