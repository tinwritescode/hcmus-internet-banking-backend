export class GoogleRecaptchaService {
  static validateRecaptcha = async (token: string): Promise<boolean> => {
    const secret = process.env.RECAPTCHA_SECRET_KEY || "";

    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
      {
        method: "POST",

        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        },

        body: JSON.stringify({
          secret,
          response: token,
        }),
      }
    );

    const data = await response.json();
    const isVerified = data.success;

    return isVerified;
  };
}
