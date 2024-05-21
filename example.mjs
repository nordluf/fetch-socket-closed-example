import { Readable } from 'node:stream';
import express from 'express';

const app = init();

await streamFetch(1024, 100);
await streamFetch(10240, 1000);
await streamFetch(10240, 10000);
await streamFetch(10240, 100000);
await streamFetch(10240, 1000000);
await streamFetch(10240, 1000000);
await streamFetch(10240, 1000000);

app.close();

function init () {
  const app = express();

  app.get('/:size/:count', async (req, res) => {
    const size = req.params.size;
    const count = parseInt(req.params.count);

    const obj = {
      a: '123',
      b: []
    };
    while (JSON.stringify(obj).length < size) {
      obj.b.push(Date.now());
    }
    const strObj = JSON.stringify(obj);

    res.write('[');
    for (let i = 0; i < count; i++) {
      res.write(strObj + ',');
    }
    res.write(strObj);
    res.write(']');
    res.send();
  });

  return app.listen(3000);
}

async function streamFetch (size, count) {
  const result = await fetch(`http://127.0.0.1:3000/${size}/${count}`, { isStream: true });
  if (!result.ok) {
    throw new Error(`HTTP error! Status: ${result.status}`);
  }
  if (!result.body) {
    throw new Error('No result body!');
  }
  const stream = Readable.fromWeb(result.body, { encoding: 'utf8' });

  console.log('Reqest sent.');
  let kb = 0, lastkb = 0;
  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.on('data', (chunk) => {
      kb += chunk.length;
      if (kb - lastkb > 10 * 1024 * 1024) {
        console.log('Another 10M received');
        lastkb = kb;
        // console.log(chunk)
      }
    });
  });
}
