import nodemailer from "nodemailer";
//import google from "googleapis";
import { google } from "googleapis";
import SMTPTransport from "nodemailer/lib/smtp-transport";
require("dotenv").config();

const OAuth2 = google.auth.OAuth2;
const emailAddress = process.env.EMAIL;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const refreshToken = process.env.REFRESH_TOKEN;

const oauth2Client = new OAuth2(clientId, clientSecret);
oauth2Client.setCredentials({
	refresh_token: refreshToken
});

async function backup() {
	const accessToken = await oauth2Client.getAccessToken();
	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
  		secure: true,
  		auth: {
    		type: "OAuth2",
    		user: emailAddress,
    		clientId: clientId,
    		clientSecret: clientSecret,
    		refreshToken: refreshToken,
    		accessToken: accessToken
  		}
	} as SMTPTransport.Options);

	await transporter.sendMail({
		from: emailAddress,
		to: "gamelauncher0210@gmail.com",
		subject: "TEST MESSAGE FROM BOT",
		text: "Hello from backup bot"
	});
	console.log("Backup Email sent.");
}

backup().catch((err) => {
	console.log(err);
})
