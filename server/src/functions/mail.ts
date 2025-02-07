import nodemailer from 'nodemailer';

import { RESET_TOKEN_EXPIRES_IN_HOURS } from '../config/auth';

type TSendEmailArgs = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

const emailUsr = process.env.NODEMAILER_USER;
const emailPwd = process.env.NODEMAILER_PASSWORD;
const appName = process.env.APP_NAME;

if (!emailUsr || !emailPwd || !appName) {
  throw new Error('Unable to get app env variables');
}

const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUsr,
    pass: emailPwd,
  },
});

const sendEmail = async (data: TSendEmailArgs): Promise<boolean> => {
  try {
    let info = await gmailTransporter.sendMail(data);
    return !!info?.messageId;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

export const sendPasswordResetEmail = async ({
  to,
  resetToken,
}: {
  to: string;
  resetToken: string;
}) => {
  // Configure message. See: https://nodemailer.com/message/
  const from = `${appName} <${emailUsr}>`;
  const subject = `Password Reset - ${appName}`;
  const html = `
    <div style="font-family:sans-serif;text-align:center;padding:2rem;">
      <h1 style="color:#151515;font-size:2rem;font-weight:bold;margin:0;">
        ${appName}
      </h1>
      <div style="font-size:1rem;line-height:1.75;text-align:center;">
        <p style="margin-top:2rem;color:#47484d;">
          Copy the code below to reset your password.
          <br />It will be valid for <b style="color:#151518;background-color:#fff3db;padding:0.25rem 0.5rem;border-radius:1rem;">${RESET_TOKEN_EXPIRES_IN_HOURS} hours</b>
        </p>
        <div style="margin-top:2.5rem;">
          <span style="font-size:2rem;font-weight:bold;line-height:1;color:#000000;background-color:#daffe2;padding:0.5rem 1rem;border-radius:2rem;">${resetToken}</span>
        </div>
      </div>
    </div>
  `;

  const success = await sendEmail({
    to,
    from,
    subject,
    html,
  });

  return { success };
};
