import axios from "axios";
import { ApiError } from "../../../core/baseResponse";
import { sign } from "../../../lib/rsa";
import { catchAsync } from "./../../../core/catchAsync";

async function test() {
  // decoded
  const rawData = Buffer.from(
    JSON.stringify({
      accountNumber: "7403340318",
      expiredAt: new Date(Date.now() + 5 * 60 * 1000),
    })
  ).toString("base64");

  const signedData = await sign(rawData);

  const API_URL = "http://localhost:3000";

  const res = await axios.post(
    `${API_URL}/api/external/query-bank-number`,
    {
      data: rawData,
      signature: signedData,
    },
    {
      timeout: 20000,
      validateStatus: (status) => status < 500,
    }
  );

  console.table(res.data);

  return res.data;
  return "";
}

export default catchAsync(async function dangerouslyHandle(req, res) {
  switch (req.method) {
    case "POST": {
      const result = await test();

      return res.status(200).json({
        data: result,
      });
    }

    default: {
      throw new ApiError("Method not allowed", 405);
    }
  }
});
