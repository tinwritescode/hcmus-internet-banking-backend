import axios from "axios";
import { ApiError } from "../../../core/baseResponse";
import { sign } from "../../../lib/rsa";
import { catchAsync } from "./../../../core/catchAsync";

async function test() {
  // decoded
  const rawData = Buffer.from(
    JSON.stringify({
      fromAccountNumber: "8768330872",
      toAccountNumber: "7403340318",
      amount: 49999,
      message: "hello",
      payer: "receiver",
      expiredAt: new Date(Date.now() + 5 * 60 * 1000),
    })
  ).toString("base64");

  // await rawDataSchema.parseAsync(rawData);

  const signedData = await sign(rawData);

  //   const API_URL = "https://hcmus-internet-banking-backend.vercel.app";
  const API_URL = "http://localhost:3000";

  const res = await axios.post(
    `${API_URL}/api/external/deposit`,
    {
      data: rawData,
      signature: signedData,
    },
    {
      timeout: 20000,
    }
  );

  console.table(res.data);
}

export default catchAsync(async function dangerouslyHandle(req, res) {
  switch (req.method) {
    case "POST": {
      const result = await test().catch((err) => {
        console.log(err.response.data);
        console.log("hi");
      });

      res.status(200).json({
        data: result,
      });
      break;
    }

    default: {
      throw new ApiError("Method not allowed", 405);
    }
  }
});
