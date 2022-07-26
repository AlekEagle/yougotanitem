import { workerData, parentPort } from 'worker_threads';

import fetch from 'node-fetch';

let {
  fromEmail,
  count,
  sku,
  storeId,
  threadID,
  threadCount,
  email,
  successCount
}: {
  fromEmail: string | null;
  count: number;
  sku: number;
  storeId: number;
  threadID: number;
  threadCount: number;
  email: string;
  successCount: number;
} = workerData;

function makeString(len: number): string {
  let str = '';
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
  }
  return str;
}

async function send() {
  const fromAddress =
      workerData.fromEmail || `${makeString(10)}@${makeString(10)}.com`,
    res = await fetch('https://www.homedepot.com/p/svcs/sendProductEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        fromAddress,
        toAddress: email,
        sku: sku,
        storeId: storeId
      })
    });

  if (res.status !== 204) {
    throw new Error(`${res.status} ${await res.text()}`);
  } else {
    parentPort.postMessage({ threadID });
  }
}

parentPort.on('message', (message: { successCount: number }) => {
  successCount = message.successCount;
  try {
    await send();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

try {
  await send();
} catch (err) {
  console.error(err);
  process.exit(1);
}
