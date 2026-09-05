# RIZO BUG MD

WhatsApp bot with a Telegram owner control panel. The Telegram panel manages
premium numbers, free/public mode, and WhatsApp pairing. Owners see the full
admin panel; regular users see only the channel gate and pairing command.

## Setup

1. Install Node.js 18.18 or newer.
2. Run `pnpm install` (or `npm install`) in this folder.
3. Open `telegram-config.json` and fill:
   - `botToken`: token from BotFather.
   - `ownerId`: your numeric Telegram user ID.
   - The URL and chat ID for **GROUP 1**, **GROUP 2**, **CHANNEL 1**, and
     **CHANNEL 2**.
4. Open `config.json` and fill `ownerNumber` with the WhatsApp number that
   should be paired, without `+` or spaces.
5. Add the Telegram bot as an administrator in all configured channels and
   groups. This is required for membership checks.
6. Add the bot as an administrator in both configured channels so membership
   checks can read Telegram member status.
7. Start the bot:

```bash
pnpm start
```

When WhatsApp is not paired, the pairing code is printed in the terminal.
The owner can also request it from Telegram with `/pair <number>`.

## Telegram owner commands

```text
/status
/premium add <whatsapp number>
/premium del <whatsapp number>
/premium list
/free on
/free off
/pair <whatsapp number>
/pair mode on
/pair mode off
/pair status
/membership
```

Only the Telegram ID in `telegram-config.json` can use owner commands.
Regular users receive the join screen first and must join both configured
channels before access is granted. After verification, users can only use:

```text
/pair <whatsapp number>
```

The user panel also includes a contact-owner button for `@rizohacker1`.

## Configuration slots

`telegram-config.json` contains the configured channel slots:

- SR KING TEAM: `@srkingteam001`
- SR LEADER: `@srleader5646`

The bot checks membership using each channel's `chatId` and displays the
corresponding `url` as a Telegram button. The owner panel includes the
`database/menu.jpg` bot image and admin-only controls.

## Notes

- `free mode ON` makes the WhatsApp bot public; `free mode OFF` returns it to
  the configured sudo/premium access rules.
- Premium data is stored in `db.json`.
- WhatsApp auth is stored in `sessionData/` after the first successful pairing.
- Do not share `telegram-config.json` after adding the bot token.