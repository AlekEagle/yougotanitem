#!/usr/bin/env node
// random_bullshit@random_bullshit.com thought you'd be interested in this item!
// usage: yougotanitem email

const fetch = require('node-fetch'),
  args = require('./parseArgs')();

let successCount = 0;

function makeid(length) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function send(email) {
  let faked = `${makeid(10)}@${makeid(10)}.com`;
  let res = await fetch('https://www.homedepot.com/p/svcs/sendProductEmail', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      fromAddress: args.flags.e || args.flags.email || faked,
      sku: args.flags.s || args.flags.sku || '206541015',
      storeId: args.flags.S || args.flags.store || '2676',
      toAddress: email
    })
  });
  if (res.status === 204)
    console.log(
      `Sent! ${++successCount} of ${
        args.flags.c || args.flags.count || 5
      } ${Math.floor(
        (successCount / (args.flags.c || args.flags.count || 5)) * 100
      )}%`
    );
  else console.error('An unknown error occurred!');
}

async function doThing() {
  if (args.args.length < 2 || args.flags.h === '' || args.flags.help === '') {
    console.log(
      `yougotanitem v${require('./package.json').version} by ${
        require('./package.json').author
      }

Usage: yougotanitem email

-e --email   Specify a specific email instead of random garbage.
-c --count   How many emails should be sent (default: 5).
-s --sku     Specify the item shared (default: 206541015).
-S --store   Specify the store the item comes from  (default: 2676).`
    );
    return;
  }
  const amount = parseInt(args.flags.c || args.flags.count) || 5;
  const target = args.args[1];
  for (let i = 0; i < amount; i++) await send(target);
}

doThing();
