import { workerData, parentPort } from "worker_threads";

let {
  fromEmail,
  count,
  sku,
  storeId,
  threadID,
  threadCount,
  email,
  successCount,
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
  let str = "";
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
  }
  return str;
}
async function send() {
  const fromAddress = fromEmail || `${makeString(10)}@${makeString(10)}.com`,
    res = await fetch(
      "https://www.homedepot.com/federation-gateway/graphql?opname=emailProduct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
          "x-experience-name": "general-merchandise",
        },
        body: JSON.stringify({
          operationName: "emailProduct",
          variables: {
            fromAddress,
            toAddress: email,
            itemId: sku,
          },
          query:
            "query emailProduct($fromAddress: String!, $toAddress: String!, $itemId: String!) {\n  emailProduct(fromAddress: $fromAddress, toAddress: $toAddress, itemId: $itemId) {\n    responseMessageId\n    message\n    __typename\n  }\n}\n",
        }),
      }
    ),
    json = await res.json();

  if (res.status !== 200 && json.data.emailProduct?.message !== "Success") {
    console.error(json);
    throw new Error(`${res.status}`);
  } else {
    parentPort.postMessage({ threadID });
  }
}

parentPort.on(
  "message",
  async (message: { successCount: number; threadID: number }) => {
    successCount = message.successCount;
    if (successCount === count) process.exit(0);
    else if (message.threadID === threadID) {
      try {
        await send();
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    }
  }
);

try {
  await send();
} catch (err) {
  console.error(err);
  process.exit(1);
}
