export interface Credentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export type ChatId = string;

export type MessageId = string;

export interface StateInstanceResponse {
  stateInstance: 'authorized' | 'notAuthorized' | 'blocked' | 'sleepMode' | 'starting';
}

export type InstanceState = StateInstanceResponse['stateInstance'];

export interface SettingsResponse {
  wid: string;
  webhookUrl: string;
  stateWebhook: string;
  [key: string]: unknown;
  webhookUrlToken: string;
  incomingWebhook: string;
  outgoingWebhook: string;
  outgoingMessageWebhook: string;
  outgoingAPIMessageWebhook: string;
  incomingMessageStatusWebhook: string;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId?: ChatId;
  fromCache?: boolean;
}

export interface SendMessageResponse {
  idMessage: MessageId;
}

export interface AvatarResponse {
  reason?: string;
  urlAvatar: string;
  available?: boolean;
}

export interface ContactInfoResponse {
  name: string;
  chatId: ChatId;
  avatar: string;
}

export interface QuotaDetails {
  used: number;
  total: number;
  method: string;
  status: string;
  description?: string;
}

export interface QuotaExceededResponse {
  quotaData?: QuotaDetails;
  invokeStatus?: QuotaDetails;
}

export interface ChatHistoryItem {
  chatId: ChatId;
  timestamp: number;
  senderId?: string;
  senderName?: string;
  sendByApi?: boolean;
  typeMessage?: string;
  textMessage?: string;
  idMessage: MessageId;
  type: 'incoming' | 'outgoing';
  statusMessage?: OutgoingStatus;
  extendedTextMessage?: { text?: string };
}

export interface ChatSummary {
  name: string;
  type: string;
  chatId: ChatId;
  phoneNumber: number;
  unreadCount?: number;
}

export type OutgoingStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'noAccount' | 'notInGroup';

export interface SenderData {
  chatId: ChatId;
  sender: string;
  chatName?: string;
  chatType?: string;
  senderName?: string;
  senderType?: string;
  senderContactName?: string;
  senderPhoneNumber?: number;
}

export interface MessageData {
  typeMessage?: string;
  textMessageData?: {
    textMessage: string;
    isForwarded?: boolean;
    forwardingScore?: number;
  };
  extendedTextMessageData?: {
    text: string;
    title?: string;
    description?: string;
    previewType?: string;
    isForwarded?: boolean;
    jpegThumbnail?: string;
    forwardingScore?: number;
  };
}

export interface InstanceData {
  wid: string;
  idInstance: number;
  typeInstance: string;
}

interface MessageWebhookBase {
  timestamp: number;
  idMessage: MessageId;
  senderData: SenderData;
  messageData: MessageData;
  instanceData?: InstanceData;
}

export interface IncomingMessageWebhook extends MessageWebhookBase {
  typeWebhook: 'incomingMessageReceived';
}

export interface OutgoingApiMessageWebhook extends MessageWebhookBase {
  typeWebhook: 'outgoingAPIMessageReceived';
}

export interface OutgoingMessageWebhook extends MessageWebhookBase {
  typeWebhook: 'outgoingMessageReceived';
}

export interface OutgoingStatusWebhook {
  chatId: ChatId;
  timestamp: number;
  idMessage: MessageId;
  status: OutgoingStatus;
  instanceData?: InstanceData;
  typeWebhook: 'outgoingMessageStatus';
}

export interface StateInstanceWebhook {
  instanceData?: InstanceData;
  typeWebhook: 'stateInstanceChanged';
  stateInstance: StateInstanceResponse['stateInstance'];
}

export type NotificationBody =
  | IncomingMessageWebhook
  | OutgoingApiMessageWebhook
  | OutgoingMessageWebhook
  | OutgoingStatusWebhook
  | StateInstanceWebhook;

export interface Notification {
  receiptId: number;
  body: NotificationBody;
}

export type ParsedNotification =
  | { kind: 'incoming'; chatId: ChatId; idMessage: MessageId; text: string; timestamp: number; senderName?: string }
  | { kind: 'outgoingEcho'; chatId: ChatId; idMessage: MessageId; text: string; timestamp: number }
  | { kind: 'outgoingFromPhone'; chatId: ChatId; idMessage: MessageId; text: string; timestamp: number }
  | { kind: 'status'; chatId: ChatId; idMessage: MessageId; status: OutgoingStatus }
  | { kind: 'state'; stateInstance: string };

export type MessageNotification = Extract<ParsedNotification, { kind: 'incoming' | 'outgoingEcho' | 'outgoingFromPhone' }>;

export type StatusNotification = Extract<ParsedNotification, { kind: 'status' }>;
