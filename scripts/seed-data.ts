/*
 * Admins and default courts for `npm run seed`.
 * Passwords come from env vars (.env.local) — never commit real passwords.
 *
 * To add an admin: append an entry below, add its password env var to .env.local, run `npm run seed`.
 * To reset an existing admin's password: set `resetPassword: true`, run the seed, then remove the flag.
 */

export interface SeedAdmin {
  name: string;
  email: string;
  password: string | undefined;
  resetPassword?: boolean;
  isActive?: boolean;
}

export interface SeedCourt {
  name: string;
  pricePerHour: number;
  description?: string;
  color: string;
}

export const seedAdmins: SeedAdmin[] = [
  {
    name: "Arena Admin",
    email: "admin@3xsportsarena.pk",
    password: "12345678",
  },
];

// Created only when no courts exist. Prices are placeholders — edit them in the UI.
export const seedCourts: SeedCourt[] = [
  {
    name: "Natural Grass Court",
    pricePerHour: 2000,
    description: "Natural grass surface",
    color: "#16a34a",
  },
  {
    name: "Artificial Grass Court",
    pricePerHour: 2500,
    description: "Artificial turf surface",
    color: "#0ea5e9",
  },
];
