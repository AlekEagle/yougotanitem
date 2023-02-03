import parseArgs from "./parseArgs.js";
import { Worker } from "worker_threads";
import { readFile } from "fs/promises";

let successCount = 0;
const args = parseArgs();
let allWorkers: Array<Worker> = [];

const settings: {
  fromEmail: string;
  count: number;
  sku: string;
  threads: number;
  email: string;
} = {
  fromEmail: args.flags.e || args.flags.email || null,
  count: parseInt(args.flags.c || args.flags.count || "5"),
  sku: args.flags.s || args.flags.sku || "316369949",
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
  -s, --sku         Specify the item shared (default: 316369949).
  -t, --threads     How many threads to use (default: 1).`
    );
    return;
  }

  function spawnThread(threadID: number) {
    const worker = new Worker("./dist/worker.js", {
      workerData: {
        fromEmail: settings.fromEmail,
        count: settings.count,
        sku: parseInt(settings.sku),
        threadID,
        threadCount: settings.threads,
        email: args.args[1],
        successCount,
      },
    });
    allWorkers[threadID] = worker;
    worker.on("message", (message: { threadID: number }) => {
      if (message.threadID === threadID) {
        successCount++;
        allWorkers.forEach((w) => {
          w.postMessage({ successCount, threadID: message.threadID });
        });
        console.log(
          `${successCount} of ${settings.count} or ${(
            (successCount / settings.count) *
            100
          ).toFixed(2)}% emails sent`
        );
        if (successCount === settings.count) {
          console.log(`${successCount} emails sent`);
          process.exit(0);
        }
      }
    });
    worker.on("error", (err) => {
      console.error(err);
    });
    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
        spawnThread(threadID);
      }
    });
  }

  for (let thread = 0; thread < settings.threads; thread++) {
    spawnThread(thread);
  }
}

doThing();
