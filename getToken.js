/** @format */

import axios from "axios";

async function oneTimeTokenFetch() {
  const url = "https://019sms.co.il/api";

  const data = {
    getApiToken: {
      user: {
        username: "korkevado",
        password: "PCf!SWj7wYYt7iQ",
      },
      username: "korkevado",
      action: "new",
    },
  };

  try {
    const response = await axios.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("Token Response:", response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error:", error.response?.data || error.message);
    } else {
      console.error("Error:", error);
    }
  }
}

// Execute the function
oneTimeTokenFetch();
