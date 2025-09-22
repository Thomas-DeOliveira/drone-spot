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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        (token as any).id = (user as any).id;
        // inclure le rôle en JWT
        const dbUser = await prisma.user.findUnique({ where: { id: (user as any).id as string }, select: { role: true } });
        if (dbUser) (token as any).role = dbUser.role;
        // lors du login, synchroniser l'image si fournie
        if ((user as any)?.image) {
          (token as any).picture = (user as any).image as string;
        } else if ((token as any).id) {
          const img = await prisma.user.findUnique({ where: { id: (token as any).id as string }, select: { image: true } });
          if (img?.image != null) (token as any).picture = img.image;
        }
      } else if (token?.email && !(token as any).id) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email as string } });
        if (dbUser) {
          (token as any).id = dbUser.id;
          (token as any).role = dbUser.role;
          if (dbUser.image != null) (token as any).picture = dbUser.image;
        }
      }
      // Mise à jour manuelle du profil (via useSession().update)
      if (trigger === "update" && session) {
        // next-auth transmet les champs top-level: name, email, image
        const s: any = session;
        if (typeof s.image === "string") {
          (token as any).picture = s.image;
        }
        if (typeof s.name === "string") token.name = s.name;
        if (typeof s.email === "string") token.email = s.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && (token as any).id) {
        (session.user as any).id = (token as any).id as string;
        (session.user as any).role = (token as any).role as string | undefined;
      }
      // Propager l'image depuis le token (picture) si disponible
      if (session.user) {
        const picture = (token as any).picture as string | undefined;
        if (typeof picture === "string") session.user.image = picture;
      }
      return session;
    },
  },
};


