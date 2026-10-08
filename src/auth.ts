import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';
import { connectDB } from '@/lib/db';
import { Admin } from '@/models/Admin';

class InactiveAccountError extends CredentialsSignin {
  code = 'inactive';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        if (!email || !password) return null;

        await connectDB();
        const admin = await Admin.findOne({ email }).select('+passwordHash');
        if (!admin) return null;

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) return null;
        if (admin.isActive === false) throw new InactiveAccountError();

        await Admin.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } });
        return { id: admin._id.toString(), name: admin.name, email: admin.email };
      },
    }),
  ],
});
