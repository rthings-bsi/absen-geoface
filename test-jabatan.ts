import { db } from "./src/db/index";
import { jabatan } from "./src/db/schema";

async function main() {
  try {
    console.log("Trying jabatan.findMany()...");
    const data = await db.query.jabatan.findMany();
    console.log("Success! Data:", data);
  } catch (err: any) {
    console.error("Error:", err);
  }
  process.exit(0);
}
main();
