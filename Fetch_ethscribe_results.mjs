import fs from "node:fs/promises";
import pMap from "p-map";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = path.join(__dirname, "your folder name here"); //add the directory of your images

const items = Array.from({ length: 420 }) // change to total number of files
  .fill(0)
  .map((_, index) => index + 1);

async function splitArrayIntoGroups(array, groupSize) {
  const result = [];

  for (let i = 0; i < array.length; i += groupSize) {
    result.push(array.slice(i, i + groupSize));
  }

  return result;
}

const originalArray = items;
const groupSize = 100;
const groupedArrays = await splitArrayIntoGroups(originalArray, groupSize);

const stats = { minted: 0, supply: originalArray.length };
const results = [];

async function processItem(index) {
  try {
    const pngPath = path.join(baseUrl, `${index}.png`);
    const gifPath = path.join(baseUrl, `${index}.gif`);

    let imagePath;
    let fileType;

    // Check if PNG file exists
    try {
      await fs.access(pngPath);
      imagePath = pngPath;
      fileType = "png";
    } catch (error) {
      // Check if GIF file exists if PNG doesn't
      try {
        await fs.access(gifPath);
        imagePath = gifPath;
        fileType = "gif";
      } catch (error) {
        // Neither PNG nor GIF file found
        console.error(`Error: Neither PNG nor GIF file found for ${index}`);
        return null;
      }
    }

    const imageBlob = await fs.readFile(imagePath);
    const arrBuffer = imageBlob.buffer;
    const buf = Buffer.from(arrBuffer);

    const dataURI = `data:image/${fileType};base64,${buf.toString("base64")}`;
    const sha = await sha256(dataURI);

    return { index, sha, dataURI };
  } catch (error) {
    // Handle file read error
    console.error(`Error reading file for ${index}: ${error.message}`);
    return null;
  }
}

await pMap(
  groupedArrays,
  async (items, idx) => {
    console.log("group:", idx + 1);
    const mapped = await pMap(
      items,
      async (index) => processItem(index),
      { concurrency: 50 }
    );

    // Filter out items where file not found
    const validMapped = mapped.filter(item => item !== null);

    const exists = await checkExists(validMapped);

    if (exists === null) {
      console.log("some error");
      return;
    }

    await pMap(
      exists,
      async (x) => {
        if (x.eth) {
          stats.minted += 1;
        }

        results.push({
          item_index: x.index,
          current_owner: x.eth ? x.eth.current_owner : null,
          // sha: x.sha,   // enable if you want this data
          // dataURI: x.dataURI,  //enable if you want this data
          existsInEthscriptions: Boolean(x.eth),
          transactionHash: x.eth ? x.eth.transaction_hash : null,
        });
      },
      { concurrency: 50 }
    );

    console.log("group end", idx + 1);
  },
  { concurrency: 5 }
).then(async () => {
  await fs.writeFile("./results.json", JSON.stringify(results, null, 2)); // results saved to this file
  await fs.writeFile("./status.json", JSON.stringify(stats));
});

function sha256(message) {
  const hash = crypto.createHash("sha256");
  hash.update(message);
  return hash.digest("hex");
}

async function checkExists(list) {
  const resp = await fetch(
    `https://api.ethscriptions.com/api/ethscriptions/exists_multi`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list.map((x) => x.sha)),
    }
  );

  if (!resp.ok) {
    console.log("some err", resp);
    return null;
  }

  const exists = await resp.json();

  return list.map((x) => ({ ...x, eth: exists[x.sha] }));
}
