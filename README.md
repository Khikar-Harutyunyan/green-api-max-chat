# MAX Chat on GREEN-API

A minimal web client for sending and receiving text messages in the [MAX](https://max.ru/) messenger through [GREEN-API](https://green-api.com/max). The interface follows [web.max.ru](https://web.max.ru/).

Built as a test task. The browser talks to GREEN-API directly; there is no backend.

**Live demo: https://green-api-max-chat.vercel.app**. Sign in with your own GREEN-API instance (see [What you need from GREEN-API](#what-you-need-from-green-api)).

## Features

- **Sign in** with your GREEN-API `idInstance` and `apiTokenInstance`. `apiUrl` is filled in from the `idInstance` and can be edited.
- **New chat by phone number.** The number is checked with `checkAccount` before the chat is created.
- **Send text messages** with [`SendMessage`](https://green-api.com/v3/docs/api/sending/SendMessage/). The message appears at once and is confirmed when GREEN-API accepts it.
- **Receive messages** with the [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/) (`receiveNotification` + `deleteNotification`). Replies appear in the chat without a reload.
- **Messages you send from the MAX app on your phone** show up too.
- **Chat list and history** are loaded from the account (`getChats`, `getChatHistory`).
- **Delivery ticks**: sent, delivered, read.
- **Contact photos**, with initials as a fallback.
- **Mobile layout**: the chat list and the open chat switch places on narrow screens.

## Quick start

Requires **Node.js 20.19+ or 22.12+**.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173) and sign in.

### What you need from GREEN-API

1. An instance in the [GREEN-API console](https://console.green-api.com/) linked to your MAX account (status **authorized**).
2. Its `idInstance` and `apiTokenInstance`, from the instance page in the console.
3. Notifications turned on for the instance. If they are off, a yellow banner lists the missing settings; click **Включить** and the app turns them on. These are needed:

   | Setting | Gives the app |
   |---|---|
   | `incomingWebhook` | incoming messages |
   | `outgoingAPIMessageWebhook` | confirmation of messages sent from this app |
   | `outgoingMessageWebhook` | messages sent from the MAX app on your phone |
   | `outgoingWebhook` | delivery and read status |
   | `stateWebhook` | instance status changes |

   GREEN-API can take a few minutes to apply new settings.

### Phone number format

Enter the number in international format, with the country code and without the leading local `0`:

| Input | Result |
|---|---|
| `+37499251890` | ✅ |
| `+374 99 25-18-90` | ✅ spaces, dashes and `+` are ignored |
| `099251890` | ❌ local format, no country code |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the tests (Jest + Testing Library) |
| `npm run lint` | Lint with oxlint |

## How it works

### Sending

`sendText` adds the message to the chat straight away marked "Отправляется" (◌), then calls `sendMessage`. When GREEN-API returns the `idMessage`, the message becomes "sent". If the request fails, it is marked as failed.

GREEN-API also sends a notification for each message sent through the API. The app matches it to the message already shown, so nothing appears twice.

### Receiving

`useNotifications` runs one long-polling loop while you are signed in:

1. `receiveNotification` waits up to 30 s for the next notification.
2. The notification is handled: a new message, a message sent from the phone, a delivery status or an instance status.
3. `deleteNotification` removes it from the queue, so the next one can arrive.

Every message is de-duplicated by `idMessage`, because a notification whose delete failed comes back with a new receipt id. Network errors are retried with an increasing delay, and a banner shows while GREEN-API cannot be reached.

### Rate limits and quotas

- Several GREEN-API methods allow about one request per second. A `429` is retried up to twice, after 1 s and 2 s.
- The instance state is cached right after sign-in, so the chat page does not ask for it again straight away.
- A number that is already in the chat list is not checked with `checkAccount` again. Repeated checks can pause the instance for hours.
- `getAvatar` is limited to 100 calls a month on the free plan. Photos are cached: a found photo is checked again after 7 days, a missing one after 1 day. At most 20 lookups run at once. When `getAvatar`'s quota is spent, `getContactInfo` is used instead.

### Storage

Everything is kept in `localStorage`, under keys that start with `max-chat.`:

- the credentials;
- per instance: the chat list, the last 50 messages of each chat and the open chat.

Signing out removes the credentials. The chats and messages stay, so signing in to the same instance again restores them.

## Security

- The API token is entered at sign-in and stored only in this browser's `localStorage`. It is never in the code, in `.env` files or in the repository.
- API requests go only to the `apiUrl` you enter. Contact photos load from the URLs GREEN-API returns.
- Log messages never include the token, phone numbers or chat ids.

## Project structure

```
src/
├── api/          GREEN-API client (greenApi.ts), RTK Query service, types, errors
├── features/
│   ├── sign-in/  sign-in page, form, validation, auth slice
│   └── chat/     chat page, sidebar, chat window, notifications, chats/messages slices
├── router/       routes and guards (signed-in only / signed-out only)
├── services/     localStorage and logging
├── store/        Redux store and root reducer
├── ui-kit/       Avatar, Button, Input, Tooltip
├── utils/        small shared helpers
├── hooks/        typed Redux hooks
├── types/        shared domain types (Chat, Message)
└── test-utils/   render helpers, fixtures, GREEN-API mock
```

Each feature folder groups its own `components`, `hooks`, `reducers`, `utils` and `constants`. Tests live next to the code in `tests/` folders.

## Tech stack

- React 19, TypeScript, Vite
- Redux Toolkit and RTK Query
- React Router
- React Hook Form for the sign-in form
- CSS Modules
- Jest, Testing Library, oxlint

## Expected console errors: `408` on `receiveNotification`

With DevTools open you will see a red `GET …/receiveNotification/… 408 (Request Timeout)` about every 35 seconds while no messages arrive. This is expected and nothing is broken.

Incoming messages are read by long-polling: the app asks GREEN-API to hold `receiveNotification` open for up to `receiveTimeout` seconds and answer as soon as a notification is queued. When nothing arrives in that window, GREEN-API answers `408` with an empty body. Measured on a live MAX instance:

| `receiveTimeout` | Answer | Held for |
|---|---|---|
| 5–45 s | `408`, empty | the timeout + ~5 s, at every value |
| 60 s | `504` Gateway Timeout | ~195 s |

So `408` is GREEN-API's normal "no notifications" answer at every timeout, not a failure:

- The app treats it as idle and polls again immediately: no backoff, no "Нет связи с GREEN-API" banner, and no message is lost or delayed (a queued notification ends the wait instantly).
- The app uses 30 s, well below the 60 s that ends in a real `504` failure.
- The red line is the browser logging a non-2xx response, which JavaScript cannot suppress. To hide it, untick **Network messages** in the Console settings, or filter with `-url:receiveNotification`.

Getting rid of it would take GREEN-API webhooks delivered to a server of our own, which this app deliberately does not have: the browser talks to GREEN-API directly.
