// ── Types ────────────────────────────────────────────────────
export type {
  // Core types
  TelegramUser, Chat, ChatFullInfo, Message, MessageEntity, MessageEntityType,
  PhotoSize, Animation, Audio, Document, Sticker, Story, Video, VideoNote,
  Voice, LivePhoto, Contact, Dice, Poll, PollOption, PollAnswer, PollMedia,
  Location, Venue, WebAppData, Link,
  // Updates
  Update, UpdateType, WebhookInfo,
  // Messages
  MessageId, MessageOriginUser, MessageOriginHiddenUser, MessageOriginChat,
  MessageOriginChannel, ForwardOrigin, SenderOrigin, SenderOriginUser,
  SenderOriginChat, MessageAutoDeleteTimerChanged,
  ForumTopicCreated, ForumTopicClosed, ForumTopicReopened, ForumTopicEdited,
  GeneralForumTopicHidden, GeneralForumTopicUnhidden,
  WriteAccessAllowed, UsersShared, SharedUser, ChatShared,
  ChatBoostAdded, ChatBackground, BackgroundType,
  Invoice, SuccessfulPayment, OrderInfo, ShippingAddress, RefundedPayment,
  PassportData, EncryptedPassportElement, PassportFile, EncryptedCredentials,
  // Reactions
  ReactionType, ReactionTypeEmoji, ReactionTypeCustomEmoji, ReactionTypePaid,
  MessageReactionUpdated, MessageReactionCountUpdated, ReactionCount,
  // Chat members
  ChatMember, ChatMemberOwner, ChatMemberAdministrator, ChatMemberMember,
  ChatMemberRestricted, ChatMemberLeft, ChatMemberBanned,
  ChatMemberUpdated, ChatInviteLink, ChatJoinRequest,
  // Callback & inline
  CallbackQuery, InlineQuery, ChosenInlineResult,
  ShippingQuery, PreCheckoutQuery, PaidMediaPurchased,
  // Giveaway & boost
  Giveaway, GiveawayCreated, GiveawayWinners, GiveawayCompleted,
  ChatBoostUpdated, ChatBoostRemoved, ChatBoost,
  ChatBoostSource, ChatBoostSourcePremium, ChatBoostSourceGiftCode,
  ChatBoostSourceGiveaway,
  // Business
  BusinessConnection, BusinessMessagesDeleted,
  // Managed bots
  BotAccessSettings, ManagedBotUpdated, ManagedBot, ManagedBotCreated,
  PollOptionAdded, PollOptionDeleted,
  // Rich messages (Bot API 10.1)
  RichMessage, RichBlock, RichBlockCaption, RichBlockParagraph,
  RichBlockSectionHeading, RichBlockPreformatted, RichBlockFooter,
  RichBlockDivider, RichBlockMathematicalExpression, RichBlockAnchor,
  RichBlockList, RichBlockListItem, RichBlockBlockQuotation,
  RichBlockPullQuotation, RichBlockCollage, RichBlockSlideshow,
  RichBlockTable, RichBlockTableCell, RichBlockDetails, RichBlockMap,
  RichBlockAnimation, RichBlockAudio, RichBlockPhoto, RichBlockVideo,
  RichBlockVoiceNote, RichBlockThinking,
  RichText, InputRichMessage, InputRichBlock,
  // Inline results
  InlineQueryResult, InlineQueryResultArticle, InlineQueryResultPhoto,
  InlineQueryResultGif, InlineQueryResultMpeg4Gif, InlineQueryResultVideo,
  InlineQueryResultAudio, InlineQueryResultVoice, InlineQueryResultDocument,
  InlineQueryResultLocation, InlineQueryResultVenue, InlineQueryResultContact,
  InlineQueryResultGame,
  InlineQueryResultCachedPhoto, InlineQueryResultCachedGif,
  InlineQueryResultCachedMpeg4Gif, InlineQueryResultCachedSticker,
  InlineQueryResultCachedDocument, InlineQueryResultCachedVideo,
  InlineQueryResultCachedVoice, InlineQueryResultCachedAudio,
  InputMessageContent, InputTextMessageContent, InputLocationMessageContent,
  InputVenueMessageContent, InputContactMessageContent,
  InputInvoiceMessageContent, InputRichMessageContent,
  // Input media
  InputMedia, InputMediaPhoto, InputMediaVideo, InputMediaAnimation,
  InputMediaAudio, InputMediaDocument, InputMediaLivePhoto, InputMediaLink,
  InputMediaSticker, InputMediaLocation, InputMediaVenue,
  // Markup
  InlineKeyboardMarkup, InlineKeyboardButton, LoginUrl,
  SwitchInlineQueryChosenChat, CopyTextButton, WebAppInfo,
  ReplyKeyboardMarkup, KeyboardButton, KeyboardButtonRequestUsers,
  KeyboardButtonRequestChat, KeyboardButtonPollType,
  KeyboardButtonRequestManagedBot,
  ReplyKeyboardRemove, ForceReply, ChatAdministratorRights,
  // Stickers
  StickerSet, MaskPosition,
  // Bot profile
  BotName, BotDescription, BotShortDescription, BotCommand, BotCommandScope,
  BotCommandScopeType, MenuButton, MenuButtonCommands, MenuButtonWebApp,
  MenuButtonDefault,
  // Misc
  Game, LabeledPrice, SentWebAppMessage,
  ChatPermissions, ChatLocation, ChatPhoto, Birthdate,
  BusinessIntro, BusinessLocation, BusinessOpeningHours,
  BusinessOpeningHoursInterval,
  LinkPreviewOptions,
} from './types.js';

// ── Client ───────────────────────────────────────────────────
export { TelegramBot, TelegramApiError } from './client.js';
export type {
  TelegramBotConfig, TelegramApiResponse, ResponseParameters,
  ChatAction, InputPaidMedia, InputSticker, ShippingOption,
  PassportElementError, InlineQueryResultsButton,
  InputPollOption, InputPollMedia, InputPollOptionMedia,
  ForumTopic, Gifts, Gift, StarTransactions, StarTransaction,
  StarTransactionSource, StarTransactionReceiver, BackgroundFill,
  ReplyParameters, SuggestedPostParameters,
} from './client.js';

// ── Webhook ──────────────────────────────────────────────────
export {
  TelegramWebhook, TelegramWebhookController, TelegramWebhookResponse,
  TelegramWebhookError,
} from './webhook.js';
export type { TelegramWebhookHandler } from './webhook.js';

// ── Polling ──────────────────────────────────────────────────
export { TelegramPolling } from './polling.js';
export type { UpdateHandler, TelegramPollingOptions } from './polling.js';

// ── Notification channel ─────────────────────────────────────
export { TelegramChannel } from './telegram-channel.js';
export type { TelegramMessage, TelegramNotificationConfig } from './telegram-channel.js';

// ── Service provider ─────────────────────────────────────────
export { TelegramServiceProvider, TELEGRAM_BOT, TELEGRAM_CONFIG, TELEGRAM_CHANNEL } from './telegram-service-provider.js';
export type { TelegramServiceConfig } from './telegram-service-provider.js';

// ── Facade ───────────────────────────────────────────────────
export { Telegram } from './facade.js';