export const eventRegistrationEmail = (
  eventId: string,
  eventName: string,
  eventTime: string,
  eventLocation: string,
  eventDescription: string,
  fullName: string,
  accessCode: string,
  eventUrl: string,
): string => {
  const styles = `<style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: #4CAF50;
            color: white;
            text-align: center;
            padding: 15px 0;
            font-size: 20px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 20px;
            color: #333;
            text-align: center;
        }
        .event-details {
            text-align: left;
            margin-top: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-left: 5px solid #4CAF50;
            border-radius: 5px;
        }
        .event-details p {
            margin: 8px 0;
            font-size: 16px;
        }
        .cta-button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 20px;
            background: #4CAF50;
            color: white;
            text-decoration: none;
            font-size: 16px;
            border-radius: 5px;
            font-weight: bold;
        }
        .cta-button:hover {
            background: #388E3C;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #777;
            margin-top: 20px;
            padding: 10px;
            border-top: 1px solid #ddd;
        }
        @media (max-width: 600px) {
            .container {
                width: 90%;
            }
        }
    </style>`;

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Successful</title>
    ${styles}
</head>
<body>
    <div class="container">
        <div class="header">🎉 Registration Successful!</div>
        <div class="content">
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Thank you for registering for <strong>${eventName}</strong>! 🎊</p>
            
            <div class="event-details">
                <p><strong>📅 Date & Time:</strong> ${eventTime}</p>
                <p><strong>📍 Location:</strong> ${eventLocation}</p>
                <p><strong>💬 Description:</strong> ${eventDescription}</p>
                <p><strong>🎟 Access Code:</strong> ${accessCode}</p>
            </div>
            
            <a href="${eventUrl}" class="cta-button">View Event Details</a>
            <p>Or scan the attached QR code</p>
            <p>If you have any questions, feel free to contact us.</p>
        </div>
        <div class="footer">© 2025 TicXpress | All rights reserved.</div>
    </div>
</body>
</html>
`;
};
