import fs from "node:fs";
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
	const configFilePath = "./prod/config.json";
	if(!fs.existsSync(configFilePath)) {
		console.log("config.json doesn't exist.");
		return;
	}
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

	const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
	Object.entries(config).forEach(async ([addr, email]: [string, any]) => {
		const attachments = [];
		const files = email.files;
		for(const file of files) {
			if(fs.existsSync(file.path as string)) {
				attachments.push({
					filename: file.name as string,
					content: file.path as string
				});
			}
		}
		await transporter.sendMail({
			from: `Backup bot ${emailAddress}`,
			to: addr,
			subject: `${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')} Backup`,
			text: Date(),
			attachments: attachments
		});
		console.log(`Backup Email sent to ${addr}`);
	});
}

backup().catch((err) => {
	console.log(err);
})
