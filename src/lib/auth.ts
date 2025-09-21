import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";

const providers = [] as any[];

// Provider Google
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Provider Email via Resend (pas de SMTP requis)
if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          const token = url.split('token=')[1]?.split('&')[0];
          if (token) {
            await sendVerificationEmail(email, token);
          }
        } catch (error) {
          console.error("Erreur lors de l'envoi de l'email de vérification:", error);
          throw error;
        }
      },
    })
  );
}

providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Mot de passe", type: "password" },
    },
    authorize: async (credentials) => {
      const email = (credentials?.email || "").toString().toLowerCase().trim();
      const password = (credentials?.password || "").toString();
      if (!email || !password) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      
      // Vérifier que l'email est vérifié
      if (!user.emailVerified) {
        throw new Error("Veuillez vérifier votre adresse email avant de vous connecter. Consultez votre boîte de réception.");
      }
      
      return {
        id: user.id,
        name: user.name || null,
        email: user.email || null,
        image: user.image || null,
      } as any;
    },
  })
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  theme: { colorScheme: "auto" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id;
        // inclure le rôle en JWT
        const dbUser = await prisma.user.findUnique({ where: { id: (user as any).id as string }, select: { role: true } });
        if (dbUser) (token as any).role = dbUser.role;
      } else if (token?.email && !(token as any).id) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email as string } });
        if (dbUser) {
          (token as any).id = dbUser.id;
          (token as any).role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && (token as any).id) {
        (session.user as any).id = (token as any).id as string;
        (session.user as any).role = (token as any).role as string | undefined;
      }
      return session;
    },
  },
};


