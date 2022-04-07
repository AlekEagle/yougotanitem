import parseArgs from "./parseArgs.js";
import { Worker } from "worker_threads";
import { readFile } from "fs/promises";

let successCount = 0;
const args = parseArgs();

const settings: {
  fromEmail: string;
  count: number;
  sku: string;
  storeId: string;
  threads: number;
  email: string;
} = {
  fromEmail: args.flags.e || args.flags.email || null,
  count: parseInt(args.flags.c || args.flags.count || "5"),
  sku: args.flags.s || args.flags.sku || "206541015",
  storeId: args.flags.S || args.flags.store || "2676",
  threads: parseInt(args.flags.t || args.flags.threads || "1"),
  email: args.args[1],
};

async function doThing() {
  const packageJSON = JSON.parse(await readFile("./package.json", "utf8"));
  if (args.args.length < 2 || args.flags.h === "" || args.flags.help === "") {
    console.log(
      `yougotanitem v${packageJSON.version} by ${packageJSON.author}

Usage: yougotanitem email

  -h, --help        Show this help message
  -e, --email       Specify a specific email instead of random garbage.
  -c, --count       How many emails should be sent (default: 5).
  -s, --sku         Specify the item shared (default: 206541015).
  -S, --store       Specify the store the item comes from  (default: 2676).
  -t, --threads     How many threads to use (default: 1).`
    );
    return;
  }

  for (
    let threads = 0;
    threads <
    (args.flags.t || args.flags.threads
      ? parseInt(args.flags.t || args.flags.threads)
      : 1);
    threads++
  ) {
    const worker = new Worker("./dist/worker.js", {
      workerData: {
        ...settings,
        threadID: threads,
      },
    });
    worker.on("message", (message: { threadID: number }) => {
      if (message.threadID === threads) {
        successCount++;
        console.log(
          `${successCount} of ${settings.count} or ${(
            (successCount / settings.count) *
            100
          ).toFixed(2)}% emails sent`
        );
      }
    });
    worker.on("error", (err) => {
      console.error(err);
    });
    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
    });
  }
}

doThing();
