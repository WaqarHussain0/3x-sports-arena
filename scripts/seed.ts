/* Idempotent seed: admins (upsert by email) + default courts (only if none exist). */
import { config } from "dotenv";
config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { seedAdmins, seedCourts } from "./seed-data";
import { Admin } from "../src/models/Admin";
import { Court } from "../src/models/Court";
import { Customer } from "../src/models/Customer";
import { ExpenseCategory } from "../src/models/ExpenseCategory";
import { Expense } from "../src/models/Expense";
import { Booking } from "../src/models/Booking";
import { Counter } from "../src/models/Counter";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (expected in .env.local)");

  await mongoose.connect(uri);

  console.log("Connected to MongoDB");

  // Collections must exist before they're used inside transactions, and indexes should be built.
  for (const model of [
    Admin,
    Court,
    Customer,
    ExpenseCategory,
    Expense,
    Booking,
    Counter,
  ]) {
    await model.createCollection().catch(() => undefined);
    await model.syncIndexes();
  }

  console.log("Collections and indexes ready");

  for (const entry of seedAdmins) {
    const email = entry.email.trim().toLowerCase();
    const existing = await Admin.findOne({ email });

    if (!existing) {
      if (!entry.password) {
        console.warn(
          `! Skipped admin ${email}: no password provided (set its SEED_ADMIN_*_PASSWORD env var)`,
        );
        continue;
      }
      await Admin.create({
        name: entry.name,
        email,
        passwordHash: await bcrypt.hash(entry.password, 12),
        isActive: entry.isActive ?? true,
      });
      console.log(`+ Created admin ${email}`);
      continue;
    }

    const update: Record<string, unknown> = { name: entry.name };
    if (entry.isActive !== undefined) update.isActive = entry.isActive;
    if (entry.resetPassword) {
      if (!entry.password) {
        console.warn(
          `! Cannot reset password for ${email}: no password provided`,
        );
      } else {
        update.passwordHash = await bcrypt.hash(entry.password, 12);
      }
    }
    await Admin.updateOne({ _id: existing._id }, { $set: update });
    console.log(
      `= Admin ${email} exists${update.passwordHash ? " (password reset)" : " (password unchanged)"}`,
    );
  }

  const courtCount = await Court.countDocuments();
  if (courtCount === 0) {
    await Court.insertMany(seedCourts);
    console.log(`+ Created ${seedCourts.length} default courts`);
  } else {
    console.log(`= Skipped courts: ${courtCount} already exist`);
  }

  await mongoose.disconnect();
  console.log("Seed complete");
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
