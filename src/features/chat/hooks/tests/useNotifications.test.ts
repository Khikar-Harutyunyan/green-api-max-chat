import { act, waitFor, renderHook, CREDENTIALS, renderHookStrict } from '@app/test-utils';

import { useNotifications } from '@features/chat/hooks/useNotifications';

import type { ParsedNotification } from '@app/api/types';

/**
 * Drives the receive/handle/delete loop against a fake transport so the
 * properties that matter can be asserted rather than assumed: one request in
 * flight, delete after the handler, and exactly one poller under StrictMode.
 */

const CREDS = CREDENTIALS;

const INCOMING = {
  receiptId: 7,
  body: {
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1790860689,
    idMessage: '117365846173366795',
    senderData: { chatId: '462217484', sender: '462217484', senderName: 'Arpi' },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'msg' } },
  },
};

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === null ? '' : JSON.stringify(body)),
  } as Response;
}

interface PendingReceive {
  settle: (body: unknown, status?: number) => void;
}

function installFetchMock() {
  /** Interleaved record of what the loop did, in order. */
  const log: string[] = [];
  const pending: PendingReceive[] = [];
  const deletedReceipts: string[] = [];
  let inflight = 0;
  let maxInflight = 0;

  const fetchMock = jest.fn((input: unknown, init?: RequestInit): Promise<Response> => {
    const url = String(input);

    if (url.includes('/receiveNotification/')) {
      log.push('receive');
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);

      return new Promise<Response>((resolve, reject) => {
        const entry: PendingReceive = {
          settle: (body, status = 200) => {
            inflight -= 1;
            drop();
            resolve(makeResponse(body, status));
          },
        };
        const drop = () => {
          const index = pending.indexOf(entry);
          if (index >= 0) pending.splice(index, 1);
        };
        // Mirror real fetch: aborting rejects the in-flight request.
        init?.signal?.addEventListener(
          'abort',
          () => {
            inflight -= 1;
            drop();
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true },
        );
        pending.push(entry);
      });
    }

    if (url.includes('/deleteNotification/')) {
      log.push('delete');
      deletedReceipts.push(url.split('/').pop() as string);
      return Promise.resolve(makeResponse({ result: true, reason: '' }));
    }

    throw new Error(`unexpected request: ${url}`);
  });

  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return { log, pending, deletedReceipts, maxInflight: () => maxInflight };
}

type Mock = ReturnType<typeof installFetchMock>;

let mock: Mock;
let handled: ParsedNotification[];

beforeEach(() => {
  mock = installFetchMock();
  handled = [];
});

function handler(notification: ParsedNotification) {
  mock.log.push('handle');
  handled.push(notification);
}

/** Settles the one in-flight receive and lets the loop run on. */
async function deliver(body: unknown, status = 200) {
  await act(async () => {
    mock.pending[0].settle(body, status);
  });
}

describe('useNotifications', () => {
  it('runs exactly one poller under StrictMode', async () => {
    renderHookStrict(() => useNotifications(CREDS, handler));

    // A "hasStarted" ref guard would survive StrictMode's synthetic unmount and
    // leave zero pollers; this waitFor would then time out.
    await waitFor(() => expect(mock.pending).toHaveLength(1));
    expect(mock.maxInflight()).toBe(1);

    await deliver(INCOMING);

    // Two pollers would produce two deletes for the same receipt.
    await waitFor(() => expect(mock.deletedReceipts).toEqual(['7']));
    expect(handled).toHaveLength(1);
  });

  it('handles the notification before deleting it', async () => {
    renderHook(() => useNotifications(CREDS, handler));
    await waitFor(() => expect(mock.pending).toHaveLength(1));

    await deliver(INCOMING);
    await waitFor(() => expect(mock.log).toContain('delete'));

    // Delete-then-render would lose the message permanently on failure.
    expect(mock.log.slice(0, 3)).toEqual(['receive', 'handle', 'delete']);
  });

  it('keeps one request in flight and drains sequentially', async () => {
    renderHook(() => useNotifications(CREDS, handler));
    await waitFor(() => expect(mock.pending).toHaveLength(1));

    await deliver(INCOMING);
    await waitFor(() => expect(mock.pending).toHaveLength(1));
    await deliver({ ...INCOMING, receiptId: 8 });
    await waitFor(() => expect(mock.deletedReceipts).toEqual(['7', '8']));

    expect(mock.maxInflight()).toBe(1);
    expect(mock.log).toEqual([
      'receive', 'handle', 'delete',
      'receive', 'handle', 'delete',
      'receive',
    ]);
  });

  it('treats HTTP 408 as idle, not an error', async () => {
    const { result } = renderHook(() => useNotifications(CREDS, handler));
    await waitFor(() => expect(mock.pending).toHaveLength(1));

    await deliver(null, 408);
    await waitFor(() => expect(mock.log.filter((e) => e === 'receive')).toHaveLength(2));

    expect(mock.log).not.toContain('delete');
    expect(handled).toHaveLength(0);
    expect(result.current.online).toBe(true);
    expect(result.current.lastError).toBeNull();
  });

  it('treats an empty body as idle', async () => {
    const { result } = renderHook(() => useNotifications(CREDS, handler));
    await waitFor(() => expect(mock.pending).toHaveLength(1));

    await deliver(null, 200);
    await waitFor(() => expect(mock.log.filter((e) => e === 'receive')).toHaveLength(2));

    expect(mock.log).not.toContain('delete');
    expect(result.current.online).toBe(true);
  });

  it('deletes unknown webhook types instead of stalling on them', async () => {
    renderHook(() => useNotifications(CREDS, handler));
    await waitFor(() => expect(mock.pending).toHaveLength(1));

    // Not parseable, but it must still leave the head of the queue — otherwise the
    // app goes permanently deaf behind it.
    await deliver({ receiptId: 99, body: { typeWebhook: 'somethingNewFromGreenApi' } });

    await waitFor(() => expect(mock.deletedReceipts).toEqual(['99']));
    expect(handled).toHaveLength(0);
  });

  it('skips non-text messages but still deletes them', async () => {
    renderHook(() => useNotifications(CREDS, handler));
    await waitFor(() => expect(mock.pending).toHaveLength(1));

    await deliver({
      receiptId: 12,
      body: {
        typeWebhook: 'incomingMessageReceived',
        timestamp: 1,
        idMessage: 'img-1',
        senderData: { chatId: '462217484', sender: '462217484' },
        messageData: { typeMessage: 'imageMessage', fileMessageData: { downloadUrl: 'http://x' } },
      },
    });

    await waitFor(() => expect(mock.deletedReceipts).toEqual(['12']));
    expect(handled).toHaveLength(0);
  });

  it('reports offline after a failed receive', async () => {
    const { result } = renderHook(() => useNotifications(CREDS, handler));
    await waitFor(() => expect(mock.pending).toHaveLength(1));

    await deliver({ message: 'boom' }, 500);

    await waitFor(() => expect(result.current.online).toBe(false));
    expect(result.current.lastError?.status).toBe(500);
  });

  it('stops polling on unmount', async () => {
    const { unmount } = renderHook(() => useNotifications(CREDS, handler));
    await waitFor(() => expect(mock.pending).toHaveLength(1));

    const receivesBefore = mock.log.filter((e) => e === 'receive').length;
    await act(async () => {
      unmount();
    });

    expect(mock.pending).toHaveLength(0);
    expect(mock.log.filter((e) => e === 'receive')).toHaveLength(receivesBefore);
  });

  it('does not poll without credentials', async () => {
    renderHook(() => useNotifications(null, handler));
    await act(async () => {});
    expect(mock.log).toHaveLength(0);
  });

  it('does not restart when the credentials object identity changes', async () => {
    const { rerender } = renderHook(
      // A fresh object every render — the common accidental-restart trigger.
      () => useNotifications({ ...CREDS }, handler),
    );
    await waitFor(() => expect(mock.pending).toHaveLength(1));

    rerender();
    rerender();
    await act(async () => {});

    expect(mock.log.filter((e) => e === 'receive')).toHaveLength(1);
    expect(mock.pending).toHaveLength(1);
  });
});
