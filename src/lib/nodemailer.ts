import nodemailer from "nodemailer";
import { env } from "../base/env/server.mjs";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USERNAME,
    pass: env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const mailOptions = {
    from: env.EMAIL_USERNAME,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
