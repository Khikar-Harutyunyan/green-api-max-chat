export const CHAT_ID = '462217484';
export const SENT_ID = '1790860382147';
export const PHONE = '37441201890';

export function json(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

export function respond(body: unknown, init?: RequestInit, status = 200): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (init?.signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      init?.signal?.removeEventListener('abort', onAbort);
      resolve(json(body, status));
    }, 0);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }
    init?.signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export interface Api {
  holdSend: () => void;
  stateInstance: string;
  methodCalls: string[];
  avatarLookups: string[];
  releaseSend: () => void;
  contactInfoLookups: string[];
  emit: (body: unknown) => void;
  avatars: Record<string, string>;
  settings: Record<string, string>;
  historyByChat: Record<string, unknown[]>;
  sent: Array<{ chatId: string; message: string }>;
  chats: Array<{ chatId: string; name: string; type: string; phoneNumber: number }>;
}

export function installApiMock(): Api {
  const sent: Array<{ chatId: string; message: string }> = [];
  const queue: unknown[] = [];
  let receiptId = 0;
  let waiting: ((response: Response) => void) | null = null;
  let holdingSend = false;
  let releaseHeldSend: (() => void) | null = null;

  const settings: Record<string, string> = {
    stateWebhook: 'yes',
    incomingWebhook: 'yes',
    outgoingWebhook: 'yes',
    outgoingMessageWebhook: 'yes',
    outgoingAPIMessageWebhook: 'yes',
  };
  const chats: Array<{ chatId: string; name: string; type: string; phoneNumber: number }> = [];
  const historyByChat: Record<string, unknown[]> = {};
  const avatars: Record<string, string> = {};
  const avatarLookups: string[] = [];
  const contactInfoLookups: string[] = [];
  const methodCalls: string[] = [];

  function flush() {
    if (!waiting || queue.length === 0) return;
    const resolve = waiting;
    waiting = null;
    receiptId += 1;
    resolve(json({ receiptId, body: queue.shift() }));
  }

  globalThis.fetch = jest.fn((input: unknown, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    methodCalls.push(url.split('/waInstance310022752991/')[1]?.split('/')[0] ?? url);

    if (url.includes('/getStateInstance/')) return respond({ stateInstance: api.stateInstance }, init);
    if (url.includes('/getSettings/')) return respond({ wid: 'x@c.us', ...settings }, init);
    if (url.includes('/setSettings/')) {
      Object.assign(settings, JSON.parse(String(init?.body)));
      return respond({ saveSettings: true }, init);
    }
    if (url.includes('/getChats/')) return respond(chats, init);
    if (url.includes('/getAvatar/')) {
      const { chatId } = JSON.parse(String(init?.body)) as { chatId: string };
      avatarLookups.push(chatId);
      return respond({ urlAvatar: avatars[chatId] ?? '' }, init);
    }
    if (url.includes('/getContactInfo/')) {
      const { chatId } = JSON.parse(String(init?.body)) as { chatId: string };
      contactInfoLookups.push(chatId);
      return respond({ chatId, name: chatId, avatar: avatars[chatId] ?? '' }, init);
    }
    if (url.includes('/getChatHistory/')) {
      const { chatId } = JSON.parse(String(init?.body)) as { chatId: string };
      return respond(historyByChat[chatId] ?? [], init);
    }
    if (url.includes('/checkAccount/')) {
      return respond({ exist: true, chatId: CHAT_ID, fromCache: false }, init);
    }
    if (url.includes('/sendMessage/')) {
      sent.push(JSON.parse(String(init?.body)));
      if (holdingSend) {
        return new Promise<Response>((resolve) => {
          releaseHeldSend = () => resolve(json({ idMessage: SENT_ID }));
        });
      }
      return respond({ idMessage: SENT_ID }, init);
    }
    if (url.includes('/deleteNotification/')) {
      return respond({ result: true, reason: '' }, init);
    }
    if (url.includes('/receiveNotification/')) {
      return new Promise<Response>((resolve, reject) => {
        waiting = resolve;
        init?.signal?.addEventListener(
          'abort',
          () => {
            waiting = null;
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true },
        );
        flush();
      });
    }
    throw new Error(`unexpected request: ${url}`);
  }) as unknown as typeof fetch;

  const api: Api = {
    sent,
    chats,
    avatars,
    settings,
    methodCalls,
    historyByChat,
    avatarLookups,
    contactInfoLookups,
    holdSend: () => {
      holdingSend = true;
    },
    releaseSend: () => {
      holdingSend = false;
      releaseHeldSend?.();
      releaseHeldSend = null;
    },
    emit: (body) => {
      queue.push(body);
      flush();
    },
    stateInstance: 'authorized',
  };
  return api;
}
