import passport from "passport";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import jwt from "jsonwebtoken";

passport.use(
    new LinkedInStrategy(
        {
            clientID: process.env.LINKEDIN_CLIENT_ID as string,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
            callbackURL: "https://strengthholdings.com/api/auth/linkedin/callback", // set same server URL in LinkedIn app settings
            scope: ["openid", "profile", "email"],
            // state: true,
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
                // let user: UserDocument | null = await User.findOne({ linkedinId: profile.id });
                // if (!user) {
                //     user = await User.create({
                //         linkedinId: profile.id,
                //         name: profile.displayName,
                //         email: profile.emails?.[0]?.value || "",
                //         profilePicture: profile.photos?.[0]?.value || "",
                //     });
                // }


                // Generate JWT Token
                // const token = jwt.sign(
                //     { id: user._id, name: user.name },
                //     process.env.JWT_SECRET as string,
                //     { expiresIn: "1h" }
                // );

                return done(null, { message: "Login Successful" });
                // return done(null, { user, token });

            } catch (err) {
                return done(err, null);
            }
        }
    )
);

export default passport;