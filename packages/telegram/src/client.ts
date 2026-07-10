/**
 * @pondoknusa/telegram — Typed Bot API client.
 *
 * Wraps every Telegram Bot API method (Bot API 10.1) with full TypeScript types.
 * Supports JSON body, multipart file upload, and custom API base URL.
 */

import type {
  // Input
  InputFile, InputMedia, InputRichMessage, InlineQueryResult, InputMessageContent,
  // Core types
  TelegramUser, Message, MessageId, SentGuestMessage, WebhookInfo,
  ChatFullInfo, TelegramFile, StickerSet, BotCommand, BotCommandScope,
  BotName, BotDescription, BotShortDescription, MenuButton,
  ChatAdministratorRights, ChatPermissions, ChatInviteLink,
  ChatMember, InlineKeyboardMarkup, ReplyKeyboardMarkup,
  ReplyKeyboardRemove, ForceReply, Update, Poll, MessageEntity,
  LinkPreviewOptions, ParseMode, LabeledPrice, BusinessConnection,
  SentWebAppMessage, PreparedKeyboardButton, BotAccessSettings,
  PollOption, PollOptionAdded, PollOptionDeleted, ManagedBot,
  ManagedBotUpdated, Link, ReactionType, Birthdate, Chat,
  RichMessage, CallbackQuery, ChatMemberUpdated, ChatJoinRequest,
  ChatBoostUpdated, ChatBoostRemoved, MessageReactionUpdated,
  MessageReactionCountUpdated, GiveawayWinners, InlineQuery,
  ChosenInlineResult, ShippingQuery, PreCheckoutQuery,
  PaidMediaPurchased, PollAnswer, BusinessMessagesDeleted,
} from './types.js';

// ── API response wrapper ─────────────────────────────────────

export interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
  parameters?: ResponseParameters;
}

export interface ResponseParameters {
  migrate_to_chat_id?: number;
  retry_after?: number;
}

// ── Client options ───────────────────────────────────────────

export interface TelegramBotConfig {
  /** Bot token from BotFather */
  token: string;
  /** Custom API base URL (e.g. for local Bot API server) */
  apiBaseUrl?: string;
  /** Default parse mode for message formatting */
  defaultParseMode?: ParseMode;
  /** Whether to disable file size limit warning */
  disableFileSizeWarning?: boolean;
}

// ── Helpers for building multipart requests ──────────────────

function isInputFile(value: unknown): value is InputFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'filename' in value &&
    'content' in value
  );
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function isFileId(value: string): boolean {
  return /^[a-zA-Z0-9_\-]+$/.test(value) && value.length > 10;
}

function isAttachFile(value: string): boolean {
  return value.startsWith('attach://');
}

function hasFileParams(params: Record<string, unknown>): boolean {
  for (const val of Object.values(params)) {
    if (isInputFile(val)) return true;
    if (Array.isArray(val)) {
      for (const item of val) {
        if (isInputFile(item)) return true;
        if (typeof item === 'object' && item !== null) {
          for (const prop of Object.values(item as Record<string, unknown>)) {
            if (isInputFile(prop)) return true;
          }
        }
      }
    }
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      for (const prop of Object.values(val as Record<string, unknown>)) {
        if (isInputFile(prop)) return true;
      }
    }
  }
  return false;
}

function buildFormData(params: Record<string, unknown>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (isInputFile(value)) {
      const blob = new Blob([value.content as unknown as globalThis.Blob]);
      form.append(key, blob, value.filename);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (isInputFile(item)) {
          const blob = new Blob([item.content as unknown as globalThis.Blob]);
          const fileKey = `${key}_${value.indexOf(item)}`;
          form.append(fileKey, blob, item.filename);
        }
      }
      form.append(key, JSON.stringify(value.map((v) => {
        if (isInputFile(v)) return `attach://${key}_${value.indexOf(v)}`;
        return v;
      })));
    } else if (typeof value === 'object') {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, String(value));
    }
  }
  return form;
}

// ── Client class ─────────────────────────────────────────────

export class TelegramBot {
  private readonly token: string;
  private readonly apiBase: string;
  private readonly defaultParseMode?: ParseMode;

  constructor(config: TelegramBotConfig) {
    this.token = config.token;
    this.apiBase = config.apiBaseUrl ?? 'https://api.telegram.org';
    this.defaultParseMode = config.defaultParseMode;
  }

  private url(method: string): string {
    return `${this.apiBase}/bot${this.token}/${method}`;
  }

  async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    // Inject default parse mode if not explicitly set
    if (this.defaultParseMode && params['parse_mode'] === undefined) {
      if (params['text'] !== undefined || params['caption'] !== undefined) {
        params = { ...params, parse_mode: this.defaultParseMode };
      }
    }

    const hasFiles = hasFileParams(params);

    if (hasFiles) {
      const form = buildFormData(params);
      const response = await fetch(this.url(method), {
        method: 'POST',
        body: form,
      });
      const json = await response.json() as TelegramApiResponse<T>;
      if (!json.ok) {
        throw new TelegramApiError(method, json as TelegramApiResponse<unknown>);
      }
      return json.result as T;
    }

    const response = await fetch(this.url(method), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(params, (_, value) => value === undefined ? undefined : value),
    });
    const json = await response.json() as TelegramApiResponse<T>;
    if (!json.ok) {
      throw new TelegramApiError(method, json as TelegramApiResponse<unknown>);
    }
    return json.result as T;
  }

  // ── Getting updates ──────────────────────────────────────────

  getUpdates(params?: {
    offset?: number;
    limit?: number;
    timeout?: number;
    allowed_updates?: string[];
  }): Promise<Update[]> {
    return this.call('getUpdates', params ?? {});
  }

  setWebhook(params: {
    url: string;
    certificate?: InputFile;
    ip_address?: string;
    max_connections?: number;
    allowed_updates?: string[];
    drop_pending_updates?: boolean;
    secret_token?: string;
  }): Promise<true> {
    return this.call('setWebhook', params);
  }

  deleteWebhook(params?: { drop_pending_updates?: boolean }): Promise<true> {
    return this.call('deleteWebhook', params ?? {});
  }

  getWebhookInfo(): Promise<WebhookInfo> {
    return this.call('getWebhookInfo');
  }

  // ── Base methods ─────────────────────────────────────────────

  getMe(): Promise<TelegramUser> {
    return this.call('getMe');
  }

  logOut(): Promise<true> {
    return this.call('logOut');
  }

  close(): Promise<true> {
    return this.call('close');
  }

  // ── Send methods ─────────────────────────────────────────────

  sendMessage(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    text: string;
    parse_mode?: ParseMode;
    entities?: MessageEntity[];
    link_preview_options?: LinkPreviewOptions;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendMessage', params);
  }

  sendRichMessage(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    rich_message: InputRichMessage;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendRichMessage', params);
  }

  sendRichMessageDraft(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    rich_message: InputRichMessage;
    last?: boolean;
    reply_parameters?: ReplyParameters;
  }): Promise<true> {
    return this.call('sendRichMessageDraft', params);
  }

  forwardMessage(params: {
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    from_chat_id: number | string;
    video_start_timestamp?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    message_id: number;
  }): Promise<Message> {
    return this.call('forwardMessage', params);
  }

  forwardMessages(params: {
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    from_chat_id: number | string;
    message_ids: number[];
    disable_notification?: boolean;
    protect_content?: boolean;
  }): Promise<MessageId[]> {
    return this.call('forwardMessages', params);
  }

  copyMessage(params: {
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    from_chat_id: number | string;
    message_id: number;
    video_start_timestamp?: number;
    caption?: string;
    parse_mode?: ParseMode;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<MessageId> {
    return this.call('copyMessage', params);
  }

  copyMessages(params: {
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    from_chat_id: number | string;
    message_ids: number[];
    disable_notification?: boolean;
    protect_content?: boolean;
    remove_caption?: boolean;
  }): Promise<MessageId[]> {
    return this.call('copyMessages', params);
  }

  sendPhoto(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    photo: InputFile | string;
    caption?: string;
    parse_mode?: ParseMode;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    has_spoiler?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendPhoto', params);
  }

  sendAudio(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    audio: InputFile | string;
    caption?: string;
    parse_mode?: ParseMode;
    caption_entities?: MessageEntity[];
    duration?: number;
    performer?: string;
    title?: string;
    thumbnail?: InputFile | string;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendAudio', params);
  }

  sendDocument(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    document: InputFile | string;
    thumbnail?: InputFile | string;
    caption?: string;
    parse_mode?: ParseMode;
    caption_entities?: MessageEntity[];
    disable_content_type_detection?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendDocument', params);
  }

  sendVideo(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    video: InputFile | string;
    duration?: number;
    width?: number;
    height?: number;
    thumbnail?: InputFile | string;
    caption?: string;
    parse_mode?: ParseMode;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    has_spoiler?: boolean;
    supports_streaming?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
    cover?: InputFile | string;
    start_timestamp?: number;
  }): Promise<Message> {
    return this.call('sendVideo', params);
  }

  sendAnimation(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    animation: InputFile | string;
    duration?: number;
    width?: number;
    height?: number;
    thumbnail?: InputFile | string;
    caption?: string;
    parse_mode?: ParseMode;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    has_spoiler?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendAnimation', params);
  }

  sendVoice(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    voice: InputFile | string;
    caption?: string;
    parse_mode?: ParseMode;
    caption_entities?: MessageEntity[];
    duration?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendVoice', params);
  }

  sendVideoNote(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    video_note: InputFile | string;
    duration?: number;
    length?: number;
    thumbnail?: InputFile | string;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendVideoNote', params);
  }

  sendPaidMedia(params: {
    chat_id: number | string;
    star_count: number;
    media: InputPaidMedia[];
    payload?: string;
    caption?: string;
    parse_mode?: ParseMode;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendPaidMedia', params);
  }

  sendLivePhoto(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    live_photo: InputFile | string;
    caption?: string;
    parse_mode?: ParseMode;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendLivePhoto', params);
  }

  sendMediaGroup(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    media: InputMedia[];
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
  }): Promise<Message[]> {
    return this.call('sendMediaGroup', params);
  }

  sendLocation(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    latitude: number;
    longitude: number;
    horizontal_accuracy?: number;
    live_period?: number;
    heading?: number;
    proximity_alert_radius?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendLocation', params);
  }

  sendVenue(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    latitude: number;
    longitude: number;
    title: string;
    address: string;
    foursquare_id?: string;
    foursquare_type?: string;
    google_place_id?: string;
    google_place_type?: string;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendVenue', params);
  }

  sendContact(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    phone_number: string;
    first_name: string;
    last_name?: string;
    vcard?: string;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendContact', params);
  }

  sendPoll(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    question: string;
    question_entities?: MessageEntity[];
    description?: string;
    description_parse_mode?: ParseMode;
    description_entities?: MessageEntity[];
    options: InputPollOption[];
    media?: InputPollMedia;
    explanation_media?: InputPollMedia;
    is_anonymous?: boolean;
    type?: 'regular' | 'quiz';
    allows_multiple_answers?: boolean;
    correct_option_ids?: number[];
    explanation?: string;
    explanation_parse_mode?: ParseMode;
    explanation_entities?: MessageEntity[];
    open_period?: number;
    close_date?: number;
    is_closed?: boolean;
    allows_revoting?: boolean;
    shuffle_options?: boolean;
    allow_adding_options?: boolean;
    hide_results_until_closes?: boolean;
    members_only?: boolean;
    country_codes?: string[];
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendPoll', params);
  }

  sendDice(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    emoji?: string;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendDice', params);
  }

  sendChatAction(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    action: ChatAction;
  }): Promise<true> {
    return this.call('sendChatAction', params);
  }

  sendMessageDraft(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    text?: string;
    parse_mode?: ParseMode;
    entities?: MessageEntity[];
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message> {
    return this.call('sendMessageDraft', params);
  }

  sendGift(params: {
    user_id: number;
    chat_id?: number | string;
    gift_id: string;
    text?: string;
    text_parse_mode?: ParseMode;
    text_entities?: MessageEntity[];
    pay_for_upgraded_gift?: boolean;
  }): Promise<true> {
    return this.call('sendGift', params);
  }

  answerGuestQuery(params: {
    guest_query_id: string;
    text: string;
    parse_mode?: ParseMode;
    entities?: MessageEntity[];
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<SentGuestMessage> {
    return this.call('answerGuestQuery', params);
  }

  // ── User personal chat ───────────────────────────────────────

  getUserPersonalChatMessages(params: {
    user_id: number;
    offset?: number;
    limit?: number;
  }): Promise<Message[]> {
    return this.call('getUserPersonalChatMessages', params);
  }

  // ── Chat join request query ──────────────────────────────────

  answerChatJoinRequestQuery(params: {
    query_id: number;
    chat_id: number | string;
    text?: string;
    parse_mode?: ParseMode;
    entities?: MessageEntity[];
  }): Promise<Message> {
    return this.call('answerChatJoinRequestQuery', params);
  }

  sendChatJoinRequestWebApp(params: {
    query_id: number;
    chat_id: number | string;
    web_app: WebAppInfo;
  }): Promise<Message> {
    return this.call('sendChatJoinRequestWebApp', params);
  }

  // ── Message editing ──────────────────────────────────────────

  editMessageText(params: {
    business_connection_id?: string;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    text: string;
    parse_mode?: ParseMode;
    entities?: MessageEntity[];
    link_preview_options?: LinkPreviewOptions;
    rich_message?: InputRichMessage;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | true> {
    return this.call('editMessageText', params);
  }

  editMessageCaption(params: {
    business_connection_id?: string;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    caption?: string;
    parse_mode?: ParseMode;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | true> {
    return this.call('editMessageCaption', params);
  }

  editMessageMedia(params: {
    business_connection_id?: string;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    media: InputMedia;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | true> {
    return this.call('editMessageMedia', params);
  }

  editMessageLiveLocation(params: {
    business_connection_id?: string;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    latitude: number;
    longitude: number;
    horizontal_accuracy?: number;
    heading?: number;
    proximity_alert_radius?: number;
    live_period?: number;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | true> {
    return this.call('editMessageLiveLocation', params);
  }

  stopMessageLiveLocation(params: {
    business_connection_id?: string;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | true> {
    return this.call('stopMessageLiveLocation', params);
  }

  editMessageReplyMarkup(params: {
    business_connection_id?: string;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | true> {
    return this.call('editMessageReplyMarkup', params);
  }

  stopPoll(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_id: number;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Poll> {
    return this.call('stopPoll', params);
  }

  deleteMessage(params: {
    chat_id: number | string;
    message_id: number;
  }): Promise<true> {
    return this.call('deleteMessage', params);
  }

  deleteMessages(params: {
    chat_id: number | string;
    message_ids: number[];
  }): Promise<true> {
    return this.call('deleteMessages', params);
  }

  deleteMessageReaction(params: {
    chat_id: number | string;
    message_id: number;
    user_id?: number;
  }): Promise<true> {
    return this.call('deleteMessageReaction', params);
  }

  deleteAllMessageReactions(params: {
    chat_id: number | string;
    message_id: number;
  }): Promise<true> {
    return this.call('deleteAllMessageReactions', params);
  }

  // ── Reactions ────────────────────────────────────────────────

  setMessageReaction(params: {
    chat_id: number | string;
    message_id: number;
    reaction?: ReactionType[];
    is_big?: boolean;
  }): Promise<true> {
    return this.call('setMessageReaction', params);
  }

  // ── Callback / Inline ────────────────────────────────────────

  answerCallbackQuery(params: {
    callback_query_id: string;
    text?: string;
    show_alert?: boolean;
    url?: string;
    cache_time?: number;
  }): Promise<true> {
    return this.call('answerCallbackQuery', params);
  }

  answerInlineQuery(params: {
    inline_query_id: string;
    results: InlineQueryResult[];
    cache_time?: number;
    is_personal?: boolean;
    next_offset?: string;
    button?: InlineQueryResultsButton;
  }): Promise<true> {
    return this.call('answerInlineQuery', params);
  }

  answerWebAppQuery(params: {
    web_app_query_id: string;
    result: InlineQueryResult;
  }): Promise<SentWebAppMessage> {
    return this.call('answerWebAppQuery', params);
  }

  savePreparedKeyboardButton(params: {
    button: PreparedKeyboardButton;
  }): Promise<PreparedKeyboardButton> {
    return this.call('savePreparedKeyboardButton', params);
  }

  // ── Shipping / Payment ───────────────────────────────────────

  answerShippingQuery(params: {
    shipping_query_id: string;
    ok: boolean;
    shipping_options?: ShippingOption[];
    error_message?: string;
  }): Promise<true> {
    return this.call('answerShippingQuery', params);
  }

  answerPreCheckoutQuery(params: {
    pre_checkout_query_id: string;
    ok: boolean;
    error_message?: string;
  }): Promise<true> {
    return this.call('answerPreCheckoutQuery', params);
  }

  createInvoiceLink(params: {
    title: string;
    description: string;
    payload: string;
    provider_token?: string;
    currency: string;
    prices: LabeledPrice[];
    max_tip_amount?: number;
    suggested_tip_amounts?: number[];
    provider_data?: string;
    photo_url?: string;
    photo_size?: number;
    photo_width?: number;
    photo_height?: number;
    need_name?: boolean;
    need_phone_number?: boolean;
    need_email?: boolean;
    need_shipping_address?: boolean;
    send_phone_number_to_provider?: boolean;
    send_email_to_provider?: boolean;
    is_flexible?: boolean;
    subscription_period?: number;
  }): Promise<string> {
    return this.call('createInvoiceLink', params);
  }

  refundStarPayment(params: {
    user_id: number;
    telegram_payment_charge_id: string;
  }): Promise<true> {
    return this.call('refundStarPayment', params);
  }

  // ── Passport ─────────────────────────────────────────────────

  setPassportDataErrors(params: {
    user_id: number;
    errors: PassportElementError[];
  }): Promise<true> {
    return this.call('setPassportDataErrors', params);
  }

  // ── Games ────────────────────────────────────────────────────

  sendGame(params: {
    business_connection_id?: string;
    chat_id: number;
    message_thread_id?: number;
    game_short_name: string;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message> {
    return this.call('sendGame', params);
  }

  setGameScore(params: {
    user_id: number;
    score: number;
    force?: boolean;
    disable_edit_message?: boolean;
    chat_id?: number;
    message_id?: number;
    inline_message_id?: string;
  }): Promise<Message | true> {
    return this.call('setGameScore', params);
  }

  getGameHighScores(params: {
    user_id: number;
    chat_id?: number;
    message_id?: number;
    inline_message_id?: string;
  }): Promise<GameHighScore[]> {
    return this.call('getGameHighScores', params);
  }

  // ── Stickers ─────────────────────────────────────────────────

  getStickerSet(params: { name: string }): Promise<StickerSet> {
    return this.call('getStickerSet', params);
  }

  getCustomEmojiStickers(params: { custom_emoji_ids: string[] }): Promise<Sticker[]> {
    return this.call('getCustomEmojiStickers', params);
  }

  uploadStickerFile(params: {
    user_id: number;
    sticker: InputFile;
    sticker_format: 'static' | 'animated' | 'video';
  }): Promise<TelegramFile> {
    return this.call('uploadStickerFile', params);
  }

  createNewStickerSet(params: {
    user_id: number;
    name: string;
    title: string;
    stickers: InputSticker[];
    sticker_type?: 'regular' | 'mask' | 'custom_emoji';
    needs_repainting?: boolean;
  }): Promise<true> {
    return this.call('createNewStickerSet', params);
  }

  addStickerToSet(params: {
    user_id: number;
    name: string;
    sticker: InputSticker;
  }): Promise<true> {
    return this.call('addStickerToSet', params);
  }

  setStickerPositionInSet(params: {
    sticker: string;
    position: number;
  }): Promise<true> {
    return this.call('setStickerPositionInSet', params);
  }

  deleteStickerFromSet(params: { sticker: string }): Promise<true> {
    return this.call('deleteStickerFromSet', params);
  }

  replaceStickerInSet(params: {
    user_id: number;
    name: string;
    old_sticker: string;
    sticker: InputSticker;
  }): Promise<true> {
    return this.call('replaceStickerInSet', params);
  }

  setStickerEmojiList(params: {
    sticker: string;
    emoji_list: string[];
  }): Promise<true> {
    return this.call('setStickerEmojiList', params);
  }

  setStickerKeywords(params: {
    sticker: string;
    keywords: string[];
  }): Promise<true> {
    return this.call('setStickerKeywords', params);
  }

  setStickerMaskPosition(params: {
    sticker: string;
    mask_position?: MaskPosition;
  }): Promise<true> {
    return this.call('setStickerMaskPosition', params);
  }

  setStickerSetTitle(params: {
    name: string;
    title: string;
  }): Promise<true> {
    return this.call('setStickerSetTitle', params);
  }

  setStickerSetThumbnail(params: {
    name: string;
    user_id: number;
    thumbnail?: InputFile | string;
    format: string;
  }): Promise<true> {
    return this.call('setStickerSetThumbnail', params);
  }

  setCustomEmojiStickerSetThumbnail(params: {
    name: string;
    custom_emoji_id?: string;
  }): Promise<true> {
    return this.call('setCustomEmojiStickerSetThumbnail', params);
  }

  deleteStickerSet(params: { name: string }): Promise<true> {
    return this.call('deleteStickerSet', params);
  }

  // ── Inline mode ──────────────────────────────────────────────

  setStickerSetStickerSetThumbnail(params: {
    name: string;
    user_id: number;
    thumbnail?: InputFile | string;
  }): Promise<true> {
    return this.call('setStickerSetStickerSetThumbnail', params);
  }

  // ── Chat management ──────────────────────────────────────────

  getChat(params: { chat_id: number | string }): Promise<ChatFullInfo> {
    return this.call('getChat', params);
  }

  getChatAdministrators(params: {
    chat_id: number | string;
    return_bots?: boolean;
  }): Promise<ChatMember[]> {
    return this.call('getChatAdministrators', params);
  }

  getChatMemberCount(params: { chat_id: number | string }): Promise<number> {
    return this.call('getChatMemberCount', params);
  }

  getChatMember(params: {
    chat_id: number | string;
    user_id: number;
  }): Promise<ChatMember> {
    return this.call('getChatMember', params);
  }

  setChatTitle(params: {
    chat_id: number | string;
    title: string;
  }): Promise<true> {
    return this.call('setChatTitle', params);
  }

  setChatDescription(params: {
    chat_id: number | string;
    description?: string;
  }): Promise<true> {
    return this.call('setChatDescription', params);
  }

  setChatPhoto(params: {
    chat_id: number | string;
    photo: InputFile;
  }): Promise<true> {
    return this.call('setChatPhoto', params);
  }

  deleteChatPhoto(params: { chat_id: number | string }): Promise<true> {
    return this.call('deleteChatPhoto', params);
  }

  setChatPermissions(params: {
    chat_id: number | string;
    permissions: ChatPermissions;
    use_independent_chat_permissions?: boolean;
  }): Promise<true> {
    return this.call('setChatPermissions', params);
  }

  exportChatInviteLink(params: { chat_id: number | string }): Promise<string> {
    return this.call('exportChatInviteLink', params);
  }

  createChatInviteLink(params: {
    chat_id: number | string;
    name?: string;
    expire_date?: number;
    member_limit?: number;
    creates_join_request?: boolean;
    subscription_period?: number;
    subscription_price?: number;
  }): Promise<ChatInviteLink> {
    return this.call('createChatInviteLink', params);
  }

  editChatInviteLink(params: {
    chat_id: number | string;
    invite_link: string;
    name?: string;
    expire_date?: number;
    member_limit?: number;
    creates_join_request?: boolean;
    subscription_period?: number;
    subscription_price?: number;
  }): Promise<ChatInviteLink> {
    return this.call('editChatInviteLink', params);
  }

  revokeChatInviteLink(params: {
    chat_id: number | string;
    invite_link: string;
  }): Promise<ChatInviteLink> {
    return this.call('revokeChatInviteLink', params);
  }

  approveChatJoinRequest(params: {
    chat_id: number | string;
    user_id: number;
  }): Promise<true> {
    return this.call('approveChatJoinRequest', params);
  }

  declineChatJoinRequest(params: {
    chat_id: number | string;
    user_id: number;
  }): Promise<true> {
    return this.call('declineChatJoinRequest', params);
  }

  setChatStickerSet(params: {
    chat_id: number | string;
    sticker_set_name: string;
  }): Promise<true> {
    return this.call('setChatStickerSet', params);
  }

  deleteChatStickerSet(params: { chat_id: number | string }): Promise<true> {
    return this.call('deleteChatStickerSet', params);
  }

  getChatAvailableGifts(params: { chat_id: number | string }): Promise<Gifts> {
    return this.call('getChatAvailableGifts', params);
  }

  sendChatGift(params: {
    chat_id: number | string;
    gift_id: string;
    text?: string;
    text_parse_mode?: ParseMode;
    text_entities?: MessageEntity[];
    pay_for_upgraded_gift?: boolean;
  }): Promise<true> {
    return this.call('sendChatGift', params);
  }

  // ── Forum topics ─────────────────────────────────────────────

  createForumTopic(params: {
    chat_id: number | string;
    name: string;
    icon_color?: number;
    icon_custom_emoji_id?: string;
  }): Promise<ForumTopic> {
    return this.call('createForumTopic', params);
  }

  editForumTopic(params: {
    chat_id: number | string;
    message_thread_id: number;
    name?: string;
    icon_custom_emoji_id?: string;
  }): Promise<true> {
    return this.call('editForumTopic', params);
  }

  closeForumTopic(params: {
    chat_id: number | string;
    message_thread_id: number;
  }): Promise<true> {
    return this.call('closeForumTopic', params);
  }

  reopenForumTopic(params: {
    chat_id: number | string;
    message_thread_id: number;
  }): Promise<true> {
    return this.call('reopenForumTopic', params);
  }

  deleteForumTopic(params: {
    chat_id: number | string;
    message_thread_id: number;
  }): Promise<true> {
    return this.call('deleteForumTopic', params);
  }

  unpinAllForumTopicMessages(params: {
    chat_id: number | string;
    message_thread_id: number;
  }): Promise<true> {
    return this.call('unpinAllForumTopicMessages', params);
  }

  editGeneralForumTopic(params: {
    chat_id: number | string;
    name: string;
  }): Promise<true> {
    return this.call('editGeneralForumTopic', params);
  }

  closeGeneralForumTopic(params: { chat_id: number | string }): Promise<true> {
    return this.call('closeGeneralForumTopic', params);
  }

  reopenGeneralForumTopic(params: { chat_id: number | string }): Promise<true> {
    return this.call('reopenGeneralForumTopic', params);
  }

  hideGeneralForumTopic(params: { chat_id: number | string }): Promise<true> {
    return this.call('hideGeneralForumTopic', params);
  }

  unhideGeneralForumTopic(params: { chat_id: number | string }): Promise<true> {
    return this.call('unhideGeneralForumTopic', params);
  }

  unpinAllGeneralForumTopicMessages(params: { chat_id: number | string }): Promise<true> {
    return this.call('unpinAllGeneralForumTopicMessages', params);
  }

  // ── Ban / restrict / promote ─────────────────────────────────

  banChatMember(params: {
    chat_id: number | string;
    user_id: number;
    until_date?: number;
    revoke_messages?: boolean;
  }): Promise<true> {
    return this.call('banChatMember', params);
  }

  unbanChatMember(params: {
    chat_id: number | string;
    user_id: number;
    only_if_banned?: boolean;
  }): Promise<true> {
    return this.call('unbanChatMember', params);
  }

  restrictChatMember(params: {
    chat_id: number | string;
    user_id: number;
    permissions: ChatPermissions;
    use_independent_chat_permissions?: boolean;
    until_date?: number;
  }): Promise<true> {
    return this.call('restrictChatMember', params);
  }

  promoteChatMember(params: {
    chat_id: number | string;
    user_id: number;
    is_anonymous?: boolean;
    can_manage_chat?: boolean;
    can_delete_messages?: boolean;
    can_manage_video_chats?: boolean;
    can_restrict_members?: boolean;
    can_promote_members?: boolean;
    can_change_info?: boolean;
    can_invite_users?: boolean;
    can_post_messages?: boolean;
    can_edit_messages?: boolean;
    can_pin_messages?: boolean;
    can_manage_topics?: boolean;
  }): Promise<true> {
    return this.call('promoteChatMember', params);
  }

  setChatAdministratorCustomTitle(params: {
    chat_id: number | string;
    user_id: number;
    custom_title: string;
  }): Promise<true> {
    return this.call('setChatAdministratorCustomTitle', params);
  }

  banChatSenderChat(params: {
    chat_id: number | string;
    sender_chat_id: number;
  }): Promise<true> {
    return this.call('banChatSenderChat', params);
  }

  unbanChatSenderChat(params: {
    chat_id: number | string;
    sender_chat_id: number;
  }): Promise<true> {
    return this.call('unbanChatSenderChat', params);
  }

  // ── Pinned messages ──────────────────────────────────────────

  pinChatMessage(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_id: number;
    disable_notification?: boolean;
  }): Promise<true> {
    return this.call('pinChatMessage', params);
  }

  unpinChatMessage(params: {
    business_connection_id?: string;
    chat_id: number | string;
    message_id?: number;
  }): Promise<true> {
    return this.call('unpinChatMessage', params);
  }

  unpinAllChatMessages(params: {
    chat_id: number | string;
  }): Promise<true> {
    return this.call('unpinAllChatMessages', params);
  }

  // ── Leave / close ────────────────────────────────────────────

  leaveChat(params: { chat_id: number | string }): Promise<true> {
    return this.call('leaveChat', params);
  }

  // ── Business connection ──────────────────────────────────────

  getBusinessConnection(params: {
    business_connection_id: string;
  }): Promise<BusinessConnection> {
    return this.call('getBusinessConnection', params);
  }

  // ── Managed bots ─────────────────────────────────────────────

  getManagedBotToken(params: { bot_id: number }): Promise<string> {
    return this.call('getManagedBotToken', params);
  }

  replaceManagedBotToken(params: {
    bot_id: number;
    token: string;
  }): Promise<true> {
    return this.call('replaceManagedBotToken', params);
  }

  getManagedBotAccessSettings(params: {
    bot_id: number;
  }): Promise<BotAccessSettings> {
    return this.call('getManagedBotAccessSettings', params);
  }

  setManagedBotAccessSettings(params: {
    bot_id: number;
    access_settings: BotAccessSettings;
  }): Promise<true> {
    return this.call('setManagedBotAccessSettings', params);
  }

  // ── Bot profile / settings ──────────────────────────────────

  setMyName(params: {
    name?: string;
    language_code?: string;
  }): Promise<true> {
    return this.call('setMyName', params);
  }

  getMyName(params?: { language_code?: string }): Promise<BotName> {
    return this.call('getMyName', params ?? {});
  }

  setMyDescription(params: {
    description?: string;
    language_code?: string;
  }): Promise<true> {
    return this.call('setMyDescription', params);
  }

  getMyDescription(params?: { language_code?: string }): Promise<BotDescription> {
    return this.call('getMyDescription', params ?? {});
  }

  setMyShortDescription(params: {
    short_description?: string;
    language_code?: string;
  }): Promise<true> {
    return this.call('setMyShortDescription', params);
  }

  getMyShortDescription(params?: { language_code?: string }): Promise<BotShortDescription> {
    return this.call('getMyShortDescription', params ?? {});
  }

  setMyCommands(params: {
    commands: BotCommand[];
    scope?: BotCommandScope;
    language_code?: string;
  }): Promise<true> {
    return this.call('setMyCommands', params);
  }

  deleteMyCommands(params?: {
    scope?: BotCommandScope;
    language_code?: string;
  }): Promise<true> {
    return this.call('deleteMyCommands', params ?? {});
  }

  getMyCommands(params?: {
    scope?: BotCommandScope;
    language_code?: string;
  }): Promise<BotCommand[]> {
    return this.call('getMyCommands', params ?? {});
  }

  setMyMenuButton(params?: {
    menu_button?: MenuButton;
  }): Promise<true> {
    return this.call('setMyMenuButton', params ?? {});
  }

  getMyMenuButton(params?: {
    chat_id?: number | string;
  }): Promise<MenuButton> {
    return this.call('getMyMenuButton', params ?? {});
  }

  setMyDefaultAdministratorRights(params?: {
    rights?: ChatAdministratorRights;
    for_channels?: boolean;
  }): Promise<true> {
    return this.call('setMyDefaultAdministratorRights', params ?? {});
  }

  getMyDefaultAdministratorRights(params?: {
    for_channels?: boolean;
  }): Promise<ChatAdministratorRights> {
    return this.call('getMyDefaultAdministratorRights', params ?? {});
  }

  // ── File operations ──────────────────────────────────────────

  getFile(params: { file_id: string }): Promise<TelegramFile> {
    return this.call('getFile', params);
  }

  getFileUrl(filePath: string): string {
    return `${this.apiBase}/file/bot${this.token}/${filePath}`;
  }

  getFileLink(fileId: string): Promise<string> {
    return this.getFile({ file_id: fileId }).then(
      (file) => this.getFileUrl(file.file_path!),
    );
  }

  downloadFile(fileId: string): Promise<Uint8Array> {
    return this.getFileLink(fileId).then(async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    });
  }

  // ── Star transaction ─────────────────────────────────────────

  getStarTransactions(params?: {
    offset?: number;
    limit?: number;
  }): Promise<StarTransactions> {
    return this.call('getStarTransactions', params ?? {});
  }

  // ── Gifts ────────────────────────────────────────────────────

  getAvailableGifts(): Promise<Gifts> {
    return this.call('getAvailableGifts');
  }

  // ── Backgrounds ──────────────────────────────────────────────

  getAvailableBackgrounds(): Promise<BackgroundFill[]> {
    return this.call('getAvailableBackgrounds');
  }

  setChatBackground(params: {
    chat_id: number | string;
    background?: BackgroundFill;
  }): Promise<true> {
    return this.call('setChatBackground', params);
  }

  deleteChatBackground(params: { chat_id: number | string }): Promise<true> {
    return this.call('deleteChatBackground', params);
  }
}

// ── Error class ────────────────────────────────────────────────

export class TelegramApiError extends Error {
  readonly method: string;
  readonly errorCode?: number;
  readonly parameters?: ResponseParameters;

  constructor(method: string, response: TelegramApiResponse<unknown>) {
    super(
      `Telegram API error [${response.error_code ?? '??'}] on ${method}: ${response.description ?? 'Unknown error'}`,
    );
    this.name = 'TelegramApiError';
    this.method = method;
    this.errorCode = response.error_code;
    this.parameters = response.parameters;
  }
}

// ── Additional types not in types.ts (used by methods) ────────

export type ChatAction =
  | 'typing' | 'upload_photo' | 'record_video' | 'upload_video'
  | 'record_voice' | 'upload_voice' | 'upload_document' | 'choose_sticker'
  | 'find_location' | 'record_video_note' | 'upload_video_note';

export interface InputPaidMedia {
  type: 'photo' | 'video' | 'live_photo';
  media: InputFile | string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface InputSticker {
  sticker: InputFile | string;
  emoji_list: string[];
  mask_position?: MaskPosition;
  keywords?: string[];
}

export interface MaskPosition {
  point: 'forehead' | 'eyes' | 'mouth' | 'chin';
  x_shift: number;
  y_shift: number;
  scale: number;
}

export interface ShippingOption {
  id: string;
  title: string;
  prices: LabeledPrice[];
}

export interface GameHighScore {
  position: number;
  user: TelegramUser;
  score: number;
}

export interface PassportElementError {
  type: string;
  field_name: string;
  data_hash?: string;
  file_hash?: string;
  message: string;
}

export interface InlineQueryResultsButton {
  text: string;
  web_app?: WebAppInfo;
  start_parameter?: string;
}

export interface WebAppInfo {
  url: string;
}

export interface InputPollOption {
  text: string;
  text_entities?: MessageEntity[];
  media?: InputPollOptionMedia;
}

export interface InputPollMedia {
  photo?: InputFile | string;
  video?: InputFile | string;
  audio?: InputFile | string;
  link?: InputFile | string;
  document?: InputFile | string;
}

export interface InputPollOptionMedia {
  text: string;
  text_entities?: MessageEntity[];
  photo?: InputFile | string;
  video?: InputFile | string;
  audio?: InputFile | string;
  link?: InputFile | string;
  document?: InputFile | string;
}

export interface ForumTopic {
  message_thread_id: number;
  name: string;
  icon_color: number;
  icon_custom_emoji_id?: string;
}

export interface Gifts {
  gifts: Gift[];
}

export interface Gift {
  id: string;
  sticker: Sticker;
  star_count: number;
  upgrade_star_count?: number;
  remaining_count?: number;
  total_count?: number;
  is_limited?: boolean;
  is_upgraded?: boolean;
}

export interface StarTransactions {
  transactions: StarTransaction[];
}

export interface StarTransaction {
  id: string;
  amount: number;
  date: number;
  source?: StarTransactionSource;
  receiver?: StarTransactionReceiver;
}

export interface StarTransactionSource {
  user?: TelegramUser;
  invoice?: string;
}

export interface StarTransactionReceiver {
  user?: TelegramUser;
}

export interface BackgroundFill {
  type: 'solid' | 'gradient' | 'freeform_gradient';
  color?: number;
  colors?: number[];
  rotation_angle?: number;
}

export interface Sticker {
  file_id: string;
  file_unique_id: string;
  type: 'regular' | 'mask' | 'custom_emoji';
  width: number;
  height: number;
  is_animated: boolean;
  is_video: boolean;
  thumbnail?: PhotoSize;
  emoji?: string;
  set_name?: string;
  premium_animation?: TelegramFile;
  mask_position?: MaskPosition;
  custom_emoji_id?: string;
  needs_repainting?: boolean;
  file_size?: number;
}

export interface PhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface ReplyParameters {
  message_id: number;
  chat_id?: number | string;
  allow_sending_without_reply?: boolean;
  quote?: string;
  quote_parse_mode?: ParseMode;
  quote_entities?: MessageEntity[];
  quote_position?: number;
  poll_option_id?: number;
}

export interface SuggestedPostParameters {
  title?: string;
  reply_parameters?: ReplyParameters;
  show_above_media?: boolean;
  remove_caption?: boolean;
  remove_reply_markup?: boolean;
}