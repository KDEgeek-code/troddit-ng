/* eslint-disable import/no-anonymous-default-export */
import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";
import axios from "axios";

export default async (req, res) => {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.reddit?.accessToken) {
    return res.status(401).json({ status: "Unauthorized" });
  }
  try {
    return res.status(200).json({
      status: "Ok",
      data: {
        accessToken: token.reddit.accessToken,
        refreshToken: token.reddit.refreshToken,
        expires: token.expires,
      },
    });
  } catch (e) {
    return res.status(400).json({
      status: e.message,
    });
  }
};
