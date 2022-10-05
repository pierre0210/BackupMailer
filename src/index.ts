import fs from "node:fs";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import schedule from "node-schedule";
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
const configFilePath = "./prod/config.json";
const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
const interval = config.interval;

async function backup() {
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

	Object.entries(config).forEach(async ([addr, email]: [string, any]) => {
		if(addr == "interval") return;
		let text: string = Date() + "\n";
		let attachments = [];
		const files = email.files;
		for(const file of files) {
			if(fs.existsSync(file.path as string)) {
				attachments.push({
					filename: file.name as string,
					content: file.path as string
				});
			}
			else {
				text += `File ${file.path} not found.`;
			}
		}
		await transporter.sendMail({
			from: `Backup bot ${emailAddress}`,
			to: addr,
			subject: `${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')} Backup`,
			text: Date(),
			attachments: attachments
		});
		console.log(`${Date()} Backup Email sent to ${addr}`);
	});
}

console.log(`Backup files every ${interval} days.`);
backup().catch((err) => {
	console.log(err);
});
schedule.scheduleJob(`0 0 12 */${interval} * *`, function() {
	backup().catch((err) => {
		console.log(err);
	});
});