import { notificationToMessage } from '../notificationToMessage';

const COMMON = { chatId: '1', idMessage: 'm1', text: 'hi', timestamp: 10 };

describe('notificationToMessage', () => {
  it('turns an incoming notification into an inbound message', () => {
    expect(notificationToMessage({ kind: 'incoming', ...COMMON, senderName: 'Arpi' })).toEqual({
      localId: 'in:m1',
      idMessage: 'm1',
      chatId: '1',
      direction: 'in',
      text: 'hi',
      timestamp: 10,
      status: 'read',
      senderName: 'Arpi',
    });
  });

  it('turns an unmatched echo into a sent outgoing message', () => {
    expect(notificationToMessage({ kind: 'outgoingEcho', ...COMMON })).toMatchObject({
      localId: 'out:m1',
      direction: 'out',
      status: 'sent',
    });
  });

  it('turns a message sent from the phone into an outgoing message', () => {
    expect(notificationToMessage({ kind: 'outgoingFromPhone', ...COMMON })).toMatchObject({
      localId: 'phone:m1',
      direction: 'out',
    });
  });

  it('returns null for status and state notifications', () => {
    expect(
      notificationToMessage({ kind: 'status', chatId: '1', idMessage: 'm1', status: 'read' }),
    ).toBeNull();
    expect(notificationToMessage({ kind: 'state', stateInstance: 'authorized' })).toBeNull();
  });
});
