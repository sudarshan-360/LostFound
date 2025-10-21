import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/db";
import User from "@/models/User";

// Ensure Node.js runtime; NextAuth is not supported on the Edge runtime
export const runtime = "nodejs";
// Mark as dynamic to avoid any static optimizing of the auth route
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ((process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)).length > 0
  ? (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  : ["lostfound0744@gmail.com"]; // fallback based on current admin

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow Google OAuth
      if (account?.provider !== "google") {
        console.log("Non-Google provider attempted:", account?.provider);
        return false;
      }

      // Check if email is from any VIT domain or is a configured admin
      const email = user.email?.toLowerCase();
      if (!email) {
        console.log("No email provided");
        return false;
      }

      // List of valid VIT email domains
      const validVitDomains = [
        "@vit.ac.in",
        "@vitstudent.ac.in",
        "@vitbhopal.ac.in",
        "@vitap.ac.in",
        "@vitchennai.ac.in",
        "@vitmumbai.ac.in",
        "@vitpune.ac.in",
        "@vitbhopal.ac.in",
        "@vitap.ac.in",
      ];

      const isValidVitEmail = validVitDomains.some((domain) =>
        email.endsWith(domain)
      );
      const isAdminEmail = ADMIN_EMAILS.includes(email);

      if (!(isValidVitEmail || isAdminEmail)) {
        console.log(
          "Email validation failed - not a VIT domain or admin email:",
          email
        );
        return false;
      }

      console.log("Sign in successful:", email);
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "google") {
        try {
          await connectDB();

          // Find or create user in database
          let dbUser = await User.findOne({ email: user.email });

          if (!dbUser) {
            // Create new user for first-time Google sign-in
            console.log("Creating new user for:", user.email);
            dbUser = new User({
              name: user.name,
              email: user.email,
              avatarUrl: user.image,
              isAdmin: ADMIN_EMAILS.includes((user.email || "").toLowerCase()),
            });
            await dbUser.save();
            console.log("New user created successfully");
          } else {
            console.log("Existing user found:", user.email);
          }

          // Ensure admin flag aligns with configured admin emails
          const emailLower = (dbUser.email || "").toLowerCase();
          if (ADMIN_EMAILS.includes(emailLower) && !dbUser.isAdmin) {
            dbUser.isAdmin = true;
            await dbUser.save();
          }

          token.id = dbUser._id.toString();
          token.isAdmin = !!dbUser.isAdmin;
          token.image = user.image;
        } catch (error) {
          console.error("JWT callback error:", error);
          // Don't throw error, just log it
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          (
            session.user as { id?: string; isAdmin?: boolean; image?: string }
          ).id = token.id as string;
          (
            session.user as { id?: string; isAdmin?: boolean; image?: string }
          ).isAdmin = (token as { isAdmin?: boolean }).isAdmin ?? false;
          (
            session.user as { id?: string; isAdmin?: boolean; image?: string }
          ).image =
            (token as { image?: string }).image ??
            session.user.image ??
            undefined;
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };