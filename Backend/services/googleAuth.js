import { google } from "googleapis";
import "dotenv/config";

/**
 * Returns a configured Google OAuth2 Client instance.
 * Using "postmessage" as redirect URI for Google authorization-code popup flow.
 */
export const getOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "postmessage"
    );
};

export const oauth2Client = getOAuth2Client();
