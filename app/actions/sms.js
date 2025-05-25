/** @format */

import axios from "axios";

/**
 * הפונקציה מקבלת רשימת מספרי פלאפון והודעה אשר רוצים לשלוח לכולם
 *
 * @format
 * @param {Array<String>} destinationPhones רשימת מספרי פלאפון
 * @param {String} message הודעה שתישלח לכל המספרים
 */
export async function sendSMS(destinationPhones, message) {
  const token = process.env.SMS_TOKEN;
  const username = process.env.SMS_USER;
  const source = process.env.SMS_SOURCE;
  const phoneObjects = destinationPhones?.map((phone, index) => ({
    $: {
      id: (index + 1).toString(), // Increment the id, starting from 1, and convert it to a string
    },
    _: phone, // Assign the phone number to "_"
  }));

  try {
    const response = await axios.post(
      "https://019sms.co.il/api",
      {
        sms: {
          user: { username },
          source: source,
          destinations: {
            phone: phoneObjects,
          },
          message: message,
          add_dynamic: "0", // Set to 0, meaning no dynamic fields
          add_unsubscribe: "0", // No unsubscribe option
          includes_international: "0", // No international messages
          campaign_name: "My Campaign", // You can modify this to your own campaign name
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending SMS:",
      error.response ? error.response.data : error.message
    );
  }
}
