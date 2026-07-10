/** @pondoknusa/telegram — Telegram Bot API type definitions (Bot API 10.1) */

// ── Core types ────────────────────────────────────────────────

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: true;
  added_to_attachment_menu?: true;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_guest_queries?: boolean;
  supports_inline_queries?: boolean;
  can_connect_to_business?: boolean;
  has_main_web_app?: boolean;
  has_topics_enabled?: boolean;
  allows_users_to_create_topics?: boolean;
  can_manage_bots?: boolean;
  supports_join_request_queries?: boolean;
}

export interface Chat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_forum?: true;
  is_direct_messages?: true;
}

export interface ChatFullInfo extends Chat {
  accent_color_id: number;
  max_reaction_count: number;
  photo?: ChatPhoto;
  active_usernames?: string[];
  birthdate?: Birthdate;
  business_intro?: BusinessIntro;
  business_location?: BusinessLocation;
  business_opening_hours?: BusinessOpeningHours;
  personal_chat?: Chat;
  parent_chat?: Chat;
  available_reactions?: ReactionType[];
  background_custom_emoji_id?: string;
  profile_accent_color_id?: number;
  profile_background_custom_emoji_id?: string;
  emoji_status_custom_emoji_id?: string;
  emoji_status_expiration_date?: number;
  bio?: string;
  has_private_forwards?: boolean;
  has_restricted_voice_and_video_messages?: boolean;
  join_to_send_messages?: boolean;
  join_by_request?: boolean;
  description?: string;
  invite_link?: string;
  pinned_message?: Message;
  permissions?: ChatPermissions;
  can_send_paid_media?: boolean;
  slow_mode_delay?: number;
  unrestrict_boost_count?: number;
  message_auto_delete_time?: number;
  has_aggressive_anti_spam_enabled?: boolean;
  has_hidden_members?: boolean;
  has_protected_content?: boolean;
  has_visible_history?: boolean;
  sticker_set_name?: string;
  can_set_sticker_set?: boolean;
  custom_emoji_sticker_set_name?: string;
  linked_chat_id?: number;
  location?: ChatLocation;
  guard_bot?: boolean;
}

export interface Message {
  message_id: number;
  message_thread_id?: number;
  direct_messages_topic_id?: number;
  sender_boost_count?: number;
  sender_business_bot?: TelegramUser;
  sender_personal_chat?: Chat;
  date: number;
  business_connection_id?: string;
  chat: Chat;
  sender_origin?: SenderOrigin;
  sender_chat?: Chat;
  author_signature?: string;
  forward_origin?: ForwardOrigin;
  is_topic_message?: boolean;
  is_automatic_forward?: boolean;
  reply_to_message?: Message;
  reply_to_poll_option_id?: number;
  reply_to_story?: Story;
  via_bot?: TelegramUser;
  edit_date?: number;
  has_protected_content?: boolean;
  is_from_offline?: boolean;
  media_group_id?: string;
  author_signature_html?: string;
  text?: string;
  entities?: MessageEntity[];
  link_preview_options?: LinkPreviewOptions;
  effect_id?: string;
  show_caption_above_media?: boolean;
  has_media_spoiler?: boolean;
  rich_message?: RichMessage;
  animation?: Animation;
  audio?: Audio;
  document?: Document;
  paid_media?: PaidMediaInfo;
  photo?: PhotoSize[];
  sticker?: Sticker;
  story?: Story;
  video?: Video;
  video_note?: VideoNote;
  voice?: Voice;
  caption?: string;
  caption_entities?: MessageEntity[];
  live_photo?: LivePhoto;
  contact?: Contact;
  dice?: Dice;
  game?: Game;
  poll?: Poll;
  venue?: Venue;
  location?: Location;
  new_chat_members?: TelegramUser[];
  left_chat_member?: TelegramUser;
  new_chat_title?: string;
  new_chat_photo?: PhotoSize[];
  delete_chat_photo?: true;
  group_chat_created?: true;
  supergroup_chat_created?: true;
  channel_chat_created?: true;
  message_auto_delete_timer_changed?: MessageAutoDeleteTimerChanged;
  migrate_to_chat_id?: number;
  migrate_from_chat_id?: number;
  pinned_message?: Message;
  invoice?: Invoice;
  successful_payment?: SuccessfulPayment;
  refunded_payment?: RefundedPayment;
  users_shared?: UsersShared;
  chat_shared?: ChatShared;
  connected_website?: string;
  write_access_allowed?: WriteAccessAllowed;
  passport_data?: PassportData;
  proximity_alert_triggered?: ProximityAlertTriggered;
  boost_added?: ChatBoostAdded;
  chat_background_set?: ChatBackground;
  forum_topic_created?: ForumTopicCreated;
  forum_topic_edited?: ForumTopicEdited;
  forum_topic_closed?: ForumTopicClosed;
  forum_topic_reopened?: ForumTopicReopened;
  general_forum_topic_hidden?: GeneralForumTopicHidden;
  general_forum_topic_unhidden?: GeneralForumTopicUnhidden;
  giveaway_created?: GiveawayCreated;
  giveaway?: Giveaway;
  giveaway_winners?: GiveawayWinners;
  giveaway_completed?: GiveawayCompleted;
  video_chat_scheduled?: VideoChatScheduled;
  video_chat_started?: VideoChatStarted;
  video_chat_ended?: VideoChatEnded;
  video_chat_participants_invited?: VideoChatParticipantsInvited;
  web_app_data?: WebAppData;
  reply_markup?: InlineKeyboardMarkup;
  guest_bot_caller_user?: TelegramUser;
  guest_bot_caller_chat?: Chat;
  guest_query_id?: string;
  managed_bot_created?: ManagedBotCreated;
  poll_option_added?: PollOptionAdded;
  poll_option_deleted?: PollOptionDeleted;
}

export interface MessageEntity {
  type: MessageEntityType;
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
  language?: string;
  custom_emoji_id?: string;
}

export type MessageEntityType =
  | 'mention' | 'hashtag' | 'cashtag' | 'bot_command' | 'url' | 'email'
  | 'phone_number' | 'bold' | 'italic' | 'underline' | 'strikethrough'
  | 'spoiler' | 'blockquote' | 'expandable_blockquote' | 'code'
  | 'pre' | 'text_link' | 'text_mention' | 'custom_emoji'
  | 'date_time';

export interface LinkPreviewOptions {
  is_disabled?: boolean;
  url?: string;
  prefer_small_media?: boolean;
  prefer_large_media?: boolean;
  show_above_text?: boolean;
}

export interface PhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface Animation {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: PhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface Audio {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  thumbnail?: PhotoSize;
}

export interface Document {
  file_id: string;
  file_unique_id: string;
  thumbnail?: PhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
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
  premium_animation?: File;
  mask_position?: MaskPosition;
  custom_emoji_id?: string;
  needs_repainting?: boolean;
  file_size?: number;
}

export interface Story {
  chat: Chat;
  id: number;
}

export interface Video {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: PhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  cover?: PhotoSize[];
  start_timestamp?: number;
}

export interface VideoNote {
  file_id: string;
  file_unique_id: string;
  length: number;
  duration: number;
  thumbnail?: PhotoSize;
  file_size?: number;
}

export interface Voice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

export interface LivePhoto {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
  video?: Video;
}

export interface Contact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
  vcard?: string;
}

export interface Dice {
  emoji: string;
  value: number;
}

export interface PollOption {
  text: string;
  text_entities?: MessageEntity[];
  voter_count: number;
  persistent_id?: string;
  media?: PollMedia[];
  added_by_user?: TelegramUser;
  added_by_chat?: Chat;
  addition_date?: number;
}

export interface PollMedia {
  text: string;
  entities?: MessageEntity[];
  photo: PhotoSize[];
  link?: Link;
}

export interface PollAnswer {
  poll_id: string;
  voter_chat?: Chat;
  user?: TelegramUser;
  option_ids: number[];
  option_persistent_ids?: string[];
}

export interface Poll {
  id: string;
  question: string;
  question_entities?: MessageEntity[];
  description?: string;
  description_entities?: MessageEntity[];
  options: PollOption[];
  total_voter_count: number;
  is_closed: boolean;
  is_anonymous: boolean;
  type: 'regular' | 'quiz';
  allows_multiple_answers: boolean;
  correct_option_ids?: number[];
  explanation?: string;
  explanation_entities?: MessageEntity[];
  explanation_media?: PollMedia[];
  media?: PollMedia[];
  open_period?: number;
  close_date?: number;
  allows_revoting?: boolean;
  shuffle_options?: boolean;
  allow_adding_options?: boolean;
  hide_results_until_closes?: boolean;
  members_only?: boolean;
  country_codes?: string[];
}

export interface Location {
  latitude: number;
  longitude: number;
  horizontal_accuracy?: number;
  live_period?: number;
  heading?: number;
  proximity_alert_radius?: number;
}

export interface Venue {
  location: Location;
  title: string;
  address: string;
  foursquare_id?: string;
  foursquare_type?: string;
  google_place_id?: string;
  google_place_type?: string;
}

export interface WebAppData {
  data: string;
  button_text: string;
}

export interface ProximityAlertTriggered {
  traveler: TelegramUser;
  watcher: TelegramUser;
  distance: number;
}

export interface MessageAutoDeleteTimerChanged {
  message_auto_delete_time: number;
}

export interface ForumTopicCreated {
  name: string;
  icon_color: number;
  icon_custom_emoji_id?: string;
}

export interface ForumTopicClosed { }
export interface ForumTopicReopened { }
export interface ForumTopicEdited {
  name?: string;
  icon_custom_emoji_id?: string;
}

export interface GeneralForumTopicHidden { }
export interface GeneralForumTopicUnhidden { }

export interface WriteAccessAllowed {
  from_request?: boolean;
  web_app_name?: string;
  from_attachment_menu?: boolean;
}

export interface VideoChatScheduled {
  start_date: number;
}

export interface VideoChatStarted { }

export interface VideoChatEnded {
  duration: number;
}

export interface VideoChatParticipantsInvited {
  users: TelegramUser[];
}

export interface UsersShared {
  request_id: number;
  users: SharedUser[];
}

export interface SharedUser {
  user_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo?: PhotoSize[];
}

export interface ChatShared {
  request_id: number;
  chat_id: number;
  title?: string;
  username?: string;
  photo?: PhotoSize[];
}

export interface ChatBoostAdded {
  boost_count: number;
}

export interface ChatBackground {
  type: BackgroundType;
}

export interface BackgroundType {
  type: 'fill' | 'wallpaper' | 'pattern' | 'chat_theme';
}

export interface Invoice {
  title: string;
  description: string;
  start_parameter: string;
  currency: string;
  total_amount: number;
}

export interface SuccessfulPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  subscription_expiration_date?: number;
  is_recurring?: boolean;
  is_first_recurring?: boolean;
  shipping_option_id?: string;
  order_info?: OrderInfo;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
}

export interface OrderInfo {
  name?: string;
  phone_number?: string;
  email?: string;
  shipping_address?: ShippingAddress;
}

export interface ShippingAddress {
  country_code: string;
  state: string;
  city: string;
  street_line1: string;
  street_line2: string;
  post_code: string;
}

export interface RefundedPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  reason?: string;
  provider_payment_charge_id?: string;
}

export interface PassportData {
  data: EncryptedPassportElement[];
  credentials: EncryptedCredentials;
}

export interface EncryptedPassportElement {
  type: string;
  data?: string;
  phone_number?: string;
  email?: string;
  files?: PassportFile[];
  front_side?: PassportFile;
  reverse_side?: PassportFile;
  selfie?: PassportFile;
  translation?: PassportFile[];
  hash: string;
}

export interface PassportFile {
  file_id: string;
  file_unique_id: string;
  file_size: number;
  file_date: number;
}

export interface EncryptedCredentials {
  data: string;
  hash: string;
  secret: string;
}

export interface ManagedBotCreated {
  bot: TelegramUser;
}

export interface PollOptionAdded {
  poll: Poll;
  option: PollOption;
}

export interface PollOptionDeleted {
  poll: Poll;
  option: PollOption;
}

export interface ChatPhoto {
  small_file_id: string;
  small_file_unique_id: string;
  big_file_id: string;
  big_file_unique_id: string;
}

export interface Birthdate {
  day: number;
  month: number;
  year?: number;
}

export interface BusinessIntro {
  title?: string;
  message?: string;
  sticker?: Sticker;
}

export interface BusinessLocation {
  address: string;
  location?: Location;
}

export interface BusinessOpeningHours {
  time_zone_name: string;
  opening_hours: BusinessOpeningHoursInterval[];
}

export interface BusinessOpeningHoursInterval {
  opening_minute: number;
  closing_minute: number;
}

export interface ChatPermissions {
  can_send_messages?: boolean;
  can_send_audios?: boolean;
  can_send_documents?: boolean;
  can_send_photos?: boolean;
  can_send_videos?: boolean;
  can_send_video_notes?: boolean;
  can_send_voice_notes?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
  can_react_to_messages?: boolean;
}

export interface ChatLocation {
  location: Location;
  address: string;
}

export interface MaskPosition {
  point: 'forehead' | 'eyes' | 'mouth' | 'chin';
  x_shift: number;
  y_shift: number;
  scale: number;
}

// ── File ───────────────────────────────────────────────────────

export interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}

// ── Callback / Inline Query ───────────────────────────────────

export interface CallbackQuery {
  id: string;
  from: TelegramUser;
  message?: Message;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
  game_short_name?: string;
}

export interface InlineQuery {
  id: string;
  from: TelegramUser;
  query: string;
  offset: string;
  chat_type?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel';
  location?: Location;
}

export interface ChosenInlineResult {
  result_id: string;
  from: TelegramUser;
  location?: Location;
  inline_message_id?: string;
  query: string;
}

export interface ShippingQuery {
  id: string;
  from: TelegramUser;
  invoice_payload: string;
  shipping_address: ShippingAddress;
}

export interface PreCheckoutQuery {
  id: string;
  from: TelegramUser;
  currency: string;
  total_amount: number;
  invoice_payload: string;
  shipping_option_id?: string;
  order_info?: OrderInfo;
}

export interface PaidMediaPurchased {
  from: TelegramUser;
  paid_media_payload: string;
}

export interface PaidMediaInfo {
  star_count: number;
  paid_media: PaidMedia[];
}

export type PaidMedia = PaidMediaPreview | PaidMediaPhoto | PaidMediaVideo | PaidMediaLivePhoto | PaidMediaUnsupported;

export interface PaidMediaPreview {
  type: 'preview';
  width?: number;
  height?: number;
  duration?: number;
}

export interface PaidMediaPhoto {
  type: 'photo';
  photo: PhotoSize[];
}

export interface PaidMediaVideo {
  type: 'video';
  video: Video;
}

export interface PaidMediaLivePhoto {
  type: 'live_photo';
  live_photo: LivePhoto;
}

export interface PaidMediaUnsupported {
  type: 'unsupported';
}

// ── Giveaway / Boost ───────────────────────────────────────────

export interface Giveaway {
  chats: Chat[];
  winners_selection_date: number;
  winner_count: number;
  only_new_members?: boolean;
  has_public_winners?: boolean;
  prize_description?: string;
  country_codes?: string[];
  prize_star_count?: number;
  premium_subscription_month_count?: number;
}

export interface GiveawayCreated { }

export interface GiveawayWinners {
  chat: Chat;
  giveaway_message_id: number;
  winners_selection_date: number;
  winner_count: number;
  winners: TelegramUser[];
  additional_chat_count?: number;
  prize_star_count?: number;
  premium_subscription_month_count?: number;
  unclaimed_prize_count?: number;
  only_new_members?: boolean;
  was_refunded?: boolean;
  prize_description?: string;
}

export interface GiveawayCompleted {
  winner_count: number;
  unclaimed_prize_count?: number;
  giveaway_message?: Message;
  is_star_giveaway?: boolean;
}

export interface ChatBoostUpdated {
  chat: Chat;
  boost: ChatBoost;
}

export interface ChatBoostRemoved {
  chat: Chat;
  boost_id: string;
  remove_date: number;
  source: ChatBoostSource;
}

export interface ChatBoost {
  boost_id: string;
  add_date: number;
  expiration_date: number;
  source: ChatBoostSource;
}

export type ChatBoostSource =
  | ChatBoostSourcePremium
  | ChatBoostSourceGiftCode
  | ChatBoostSourceGiveaway;

export interface ChatBoostSourcePremium {
  source: 'premium';
  user: TelegramUser;
}

export interface ChatBoostSourceGiftCode {
  source: 'gift_code';
  user: TelegramUser;
}

export interface ChatBoostSourceGiveaway {
  source: 'giveaway';
  giveaway_message_id: number;
  user?: TelegramUser;
  is_unclaimed?: boolean;
}

// ── Business ───────────────────────────────────────────────────

export interface BusinessConnection {
  id: string;
  user: TelegramUser;
  user_chat_id: number;
  date: number;
  can_reply: boolean;
  is_enabled: boolean;
}

export interface BusinessMessagesDeleted {
  business_connection_id: string;
  chat: Chat;
  message_ids: number[];
}

// ── Chat member ────────────────────────────────────────────────

export interface ChatMemberUpdated {
  chat: Chat;
  from: TelegramUser;
  date: number;
  old_chat_member: ChatMember;
  new_chat_member: ChatMember;
  invite_link?: ChatInviteLink;
  via_join_request?: boolean;
  via_chat_folder_invite_link?: boolean;
}

export type ChatMember =
  | ChatMemberOwner
  | ChatMemberAdministrator
  | ChatMemberMember
  | ChatMemberRestricted
  | ChatMemberLeft
  | ChatMemberBanned;

export interface ChatMemberOwner {
  status: 'creator';
  user: TelegramUser;
  is_anonymous: boolean;
  custom_title?: string;
}

export interface ChatMemberAdministrator {
  status: 'administrator';
  user: TelegramUser;
  can_be_edited: boolean;
  is_anonymous: boolean;
  can_manage_chat: boolean;
  can_delete_messages: boolean;
  can_manage_video_chats: boolean;
  can_restrict_members: boolean;
  can_promote_members: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
  custom_title?: string;
}

export interface ChatMemberMember {
  status: 'member';
  user: TelegramUser;
  until_date?: number;
}

export interface ChatMemberRestricted {
  status: 'restricted';
  user: TelegramUser;
  is_member: boolean;
  can_send_messages: boolean;
  can_send_audios: boolean;
  can_send_documents: boolean;
  can_send_photos: boolean;
  can_send_videos: boolean;
  can_send_video_notes: boolean;
  can_send_voice_notes: boolean;
  can_send_polls: boolean;
  can_send_other_messages: boolean;
  can_add_web_page_previews: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  can_pin_messages: boolean;
  can_manage_topics: boolean;
  can_react_to_messages: boolean;
  until_date: number;
}

export interface ChatMemberLeft {
  status: 'left';
  user: TelegramUser;
}

export interface ChatMemberBanned {
  status: 'kicked';
  user: TelegramUser;
  until_date: number;
}

export interface ChatInviteLink {
  invite_link: string;
  creator: TelegramUser;
  creates_join_request: boolean;
  is_primary: boolean;
  is_revoked: boolean;
  name?: string;
  expire_date?: number;
  member_limit?: number;
  pending_join_request_count?: number;
  subscription_period?: number;
  subscription_price?: number;
}

export interface ChatJoinRequest {
  chat: Chat;
  from: TelegramUser;
  user_chat_id: number;
  date: number;
  bio?: string;
  invite_link?: ChatInviteLink;
  query_id?: number;
}

// ── Message reaction ───────────────────────────────────────────

export interface MessageReactionUpdated {
  chat: Chat;
  message_id: number;
  user?: TelegramUser;
  actor_chat?: Chat;
  date: number;
  old_reaction: ReactionType[];
  new_reaction: ReactionType[];
}

export interface MessageReactionCountUpdated {
  chat: Chat;
  message_id: number;
  date: number;
  reactions: ReactionCount[];
}

export interface ReactionCount {
  type: ReactionType;
  total_count: number;
}

export type ReactionType = ReactionTypeEmoji | ReactionTypeCustomEmoji | ReactionTypePaid;

export interface ReactionTypeEmoji {
  type: 'emoji';
  emoji: string;
}

export interface ReactionTypeCustomEmoji {
  type: 'custom_emoji';
  custom_emoji_id: string;
}

export interface ReactionTypePaid {
  type: 'paid';
}

// ── Bot access / managed bots ───────────────────────────────────

export interface BotAccessSettings {
  can_see_message_text: boolean;
  can_see_message_media: boolean;
  can_see_message_preview: boolean;
  can_see_message_entities: boolean;
  can_see_chat_members: boolean;
  can_see_chat_administrators: boolean;
  can_modify_chat_permissions: boolean;
  can_modify_chat_title: boolean;
  can_modify_chat_photo: boolean;
  can_modify_chat_description: boolean;
  can_modify_chat_invite_link: boolean;
  can_modify_chat_pinned_message: boolean;
  can_modify_chat_sticker_set: boolean;
  can_modify_chat_topic: boolean;
  can_close_chat: boolean;
  can_delete_chat: boolean;
  can_delete_messages: boolean;
  can_send_messages: boolean;
  can_send_media: boolean;
  can_send_polls: boolean;
  can_send_reactions: boolean;
  can_pin_messages: boolean;
  can_manage_video_chats: boolean;
  can_restrict_members: boolean;
  can_promote_members: boolean;
  can_invite_users: boolean;
}

export interface ManagedBotUpdated {
  managed_bot: ManagedBot;
}

export interface ManagedBot {
  id: number;
  token?: string;
  status: 'created' | 'connected' | 'disconnected';
  updated_at: number;
}

// ── Webhook info ────────────────────────────────────────────────

export interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
  last_synchronization_error_date?: number;
  max_connections?: number;
  allowed_updates?: string[];
}

// ── Keyboard / Reply Markup ────────────────────────────────────

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: WebAppInfo;
  login_url?: LoginUrl;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  switch_inline_query_chosen_chat?: SwitchInlineQueryChosenChat;
  copy_text?: CopyTextButton;
  callback_game?: Record<string, never>;
  pay?: boolean;
}

export interface LoginUrl {
  url: string;
  forward_text?: string;
  bot_username?: string;
  request_write_access?: boolean;
}

export interface SwitchInlineQueryChosenChat {
  query?: string;
  allow_user_chats?: boolean;
  allow_bot_chats?: boolean;
  allow_group_chats?: boolean;
  allow_channel_chats?: boolean;
}

export interface CopyTextButton {
  text: string;
}

export interface WebAppInfo {
  url: string;
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  is_persistent?: boolean;
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  input_field_placeholder?: string;
  selective?: boolean;
}

export interface KeyboardButton {
  text: string;
  request_users?: KeyboardButtonRequestUsers;
  request_chat?: KeyboardButtonRequestChat;
  request_contact?: boolean;
  request_location?: boolean;
  request_poll?: KeyboardButtonPollType;
  request_managed_bot?: KeyboardButtonRequestManagedBot;
  web_app?: WebAppInfo;
}

export interface KeyboardButtonRequestUsers {
  request_id: number;
  user_is_bot?: boolean;
  user_is_premium?: boolean;
  max_quantity?: number;
  request_name?: boolean;
  request_username?: boolean;
  request_photo?: boolean;
}

export interface KeyboardButtonRequestChat {
  request_id: number;
  chat_is_channel?: boolean;
  chat_is_forum?: boolean;
  chat_has_username?: boolean;
  chat_is_created?: boolean;
  user_administrator_rights?: ChatAdministratorRights;
  bot_administrator_rights?: ChatAdministratorRights;
  bot_is_member?: boolean;
  request_title?: boolean;
  request_username?: boolean;
  request_photo?: boolean;
}

export interface KeyboardButtonPollType {
  type?: 'quiz' | 'regular';
}

export interface KeyboardButtonRequestManagedBot {
  request_id: number;
  bot_username?: string;
}

export interface ReplyKeyboardRemove {
  remove_keyboard: true;
  selective?: boolean;
}

export interface ForceReply {
  force_reply: true;
  input_field_placeholder?: string;
  selective?: boolean;
}

export interface ChatAdministratorRights {
  is_anonymous: boolean;
  can_manage_chat: boolean;
  can_delete_messages: boolean;
  can_manage_video_chats: boolean;
  can_restrict_members: boolean;
  can_promote_members: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
}

// ── Prepared Keyboard Button ───────────────────────────────────

export interface PreparedKeyboardButton {
  id: string;
  button: InlineKeyboardButton | KeyboardButton;
}

// ── Input File ─────────────────────────────────────────────────

export type InputFile = { filename: string; content: Uint8Array };

// ── Update ──────────────────────────────────────────────────────

export interface Update {
  update_id: number;
  message?: Message;
  edited_message?: Message;
  channel_post?: Message;
  edited_channel_post?: Message;
  business_connection?: BusinessConnection;
  business_message?: Message;
  edited_business_message?: Message;
  deleted_business_messages?: BusinessMessagesDeleted;
  guest_message?: Message;
  message_reaction?: MessageReactionUpdated;
  message_reaction_count?: MessageReactionCountUpdated;
  inline_query?: InlineQuery;
  chosen_inline_result?: ChosenInlineResult;
  callback_query?: CallbackQuery;
  shipping_query?: ShippingQuery;
  pre_checkout_query?: PreCheckoutQuery;
  purchased_paid_media?: PaidMediaPurchased;
  poll?: Poll;
  poll_answer?: PollAnswer;
  my_chat_member?: ChatMemberUpdated;
  chat_member?: ChatMemberUpdated;
  chat_join_request?: ChatJoinRequest;
  chat_boost?: ChatBoostUpdated;
  removed_chat_boost?: ChatBoostRemoved;
  managed_bot?: ManagedBotUpdated;
}

// ── Rich Messages (Bot API 10.1) ───────────────────────────────

export interface RichMessage {
  blocks: RichBlock[];
  caption?: RichBlockCaption;
}

export type RichBlock =
  | RichBlockParagraph
  | RichBlockSectionHeading
  | RichBlockPreformatted
  | RichBlockFooter
  | RichBlockDivider
  | RichBlockMathematicalExpression
  | RichBlockAnchor
  | RichBlockList
  | RichBlockBlockQuotation
  | RichBlockPullQuotation
  | RichBlockCollage
  | RichBlockSlideshow
  | RichBlockTable
  | RichBlockDetails
  | RichBlockMap
  | RichBlockAnimation
  | RichBlockAudio
  | RichBlockPhoto
  | RichBlockVideo
  | RichBlockVoiceNote
  | RichBlockThinking;

export interface RichBlockParagraph {
  type: 'paragraph';
  text: RichText;
}

export interface RichBlockSectionHeading {
  type: 'section_heading';
  text: RichText;
  level?: number;
}

export interface RichBlockPreformatted {
  type: 'preformatted';
  text: string;
  language?: string;
}

export interface RichBlockFooter {
  type: 'footer';
  text: RichText;
}

export interface RichBlockDivider {
  type: 'divider';
}

export interface RichBlockMathematicalExpression {
  type: 'mathematical_expression';
  text: string;
}

export interface RichBlockAnchor {
  type: 'anchor';
  text: string;
  id: string;
}

export interface RichBlockList {
  type: 'list';
  items: RichBlockListItem[];
}

export interface RichBlockListItem {
  text: RichText;
}

export interface RichBlockBlockQuotation {
  type: 'block_quotation';
  text: RichText;
}

export interface RichBlockPullQuotation {
  type: 'pull_quotation';
  text: RichText;
}

export interface RichBlockCollage {
  type: 'collage';
  blocks: RichBlockPhoto[];
}

export interface RichBlockSlideshow {
  type: 'slideshow';
  blocks: RichBlockPhoto[];
}

export interface RichBlockTable {
  type: 'table';
  rows: RichBlockTableCell[][];
  column_count: number;
}

export interface RichBlockTableCell {
  text: RichText;
  colspan: number;
  rowspan: number;
  header: boolean;
}

export interface RichBlockDetails {
  type: 'details';
  summary: RichText;
  details: RichText[];
}

export interface RichBlockMap {
  type: 'map';
  latitude: number;
  longitude: number;
  heading: number;
  zoom: number;
}

export interface RichBlockAnimation {
  type: 'animation';
  animation: InputFile | string;
}

export interface RichBlockPhoto {
  type: 'photo';
  photo: InputFile | string;
}

export interface RichBlockVideo {
  type: 'video';
  video: InputFile | string;
}

export interface RichBlockAudio {
  type: 'audio';
  audio: InputFile | string;
}

export interface RichBlockVoiceNote {
  type: 'voice_note';
  voice: InputFile | string;
}

export interface RichBlockThinking {
  type: 'thinking';
  text: string;
}

export interface RichBlockCaption {
  text: RichText;
}

export type RichText =
  | string
  | RichTextBold
  | RichTextItalic
  | RichTextUnderline
  | RichTextStrikethrough
  | RichTextSpoiler
  | RichTextCode
  | RichTextUrl
  | RichTextEmailAddress
  | RichTextPhoneNumber
  | RichTextMention
  | RichTextHashtag
  | RichTextCashtag
  | RichTextBotCommand
  | RichTextBankCardNumber
  | RichTextCustomEmoji
  | RichTextTextMention
  | RichTextDateTime
  | RichTextSubscript
  | RichTextSuperscript
  | RichTextMarked
  | RichTextMathematicalExpression
  | RichTextAnchor
  | RichTextAnchorLink
  | RichTextReference
  | RichTextReferenceLink;

export type RichTextEntity = { children: RichText[] } & Record<string, unknown>;

export interface RichTextBold { type: 'bold'; children: RichText[] }
export interface RichTextItalic { type: 'italic'; children: RichText[] }
export interface RichTextUnderline { type: 'underline'; children: RichText[] }
export interface RichTextStrikethrough { type: 'strikethrough'; children: RichText[] }
export interface RichTextSpoiler { type: 'spoiler'; children: RichText[] }
export interface RichTextCode { type: 'code'; text: string }
export interface RichTextUrl { type: 'url'; text: string; url: string }
export interface RichTextEmailAddress { type: 'email_address'; text: string; email_address: string }
export interface RichTextPhoneNumber { type: 'phone_number'; text: string; phone_number: string }
export interface RichTextMention { type: 'mention'; text: string }
export interface RichTextHashtag { type: 'hashtag'; text: string }
export interface RichTextCashtag { type: 'cashtag'; text: string }
export interface RichTextBotCommand { type: 'bot_command'; text: string }
export interface RichTextBankCardNumber { type: 'bank_card_number'; text: string; bank_card_number: string }
export interface RichTextCustomEmoji { type: 'custom_emoji'; text: string; custom_emoji_id: string }
export interface RichTextTextMention { type: 'text_mention'; text: string; user: TelegramUser }
export interface RichTextDateTime { type: 'date_time'; text: string; unix: number; format?: string }
export interface RichTextSubscript { type: 'subscript'; children: RichText[] }
export interface RichTextSuperscript { type: 'superscript'; children: RichText[] }
export interface RichTextMarked { type: 'marked'; children: RichText[] }
export interface RichTextMathematicalExpression { type: 'mathematical_expression'; text: string }
export interface RichTextAnchor { type: 'anchor'; text: string; id: string }
export interface RichTextAnchorLink { type: 'anchor_link'; text: string; anchor_id: string }
export interface RichTextReference { type: 'reference'; text: string; message_id?: number; chat_id?: number }
export interface RichTextReferenceLink { type: 'reference_link'; text: string; link: string }

export interface InputRichMessage {
  blocks: InputRichBlock[];
  caption?: RichBlockCaption;
}

export type InputRichBlock =
  | InputRichBlockParagraph
  | InputRichBlockSectionHeading
  | InputRichBlockPreformatted
  | InputRichBlockFooter
  | InputRichBlockDivider
  | InputRichBlockMathematicalExpression
  | InputRichBlockAnchor
  | InputRichBlockList
  | InputRichBlockBlockQuotation
  | InputRichBlockPullQuotation
  | InputRichBlockCollage
  | InputRichBlockSlideshow
  | InputRichBlockTable
  | InputRichBlockDetails
  | InputRichBlockMap
  | InputRichBlockAnimation
  | InputRichBlockAudio
  | InputRichBlockPhoto
  | InputRichBlockVideo
  | InputRichBlockVoiceNote
  | InputRichBlockThinking;

export interface InputRichBlockParagraph { type: 'paragraph'; text: RichText }
export interface InputRichBlockSectionHeading { type: 'section_heading'; text: RichText; level?: number }
export interface InputRichBlockPreformatted { type: 'preformatted'; text: string; language?: string }
export interface InputRichBlockFooter { type: 'footer'; text: RichText }
export interface InputRichBlockDivider { type: 'divider' }
export interface InputRichBlockMathematicalExpression { type: 'mathematical_expression'; text: string }
export interface InputRichBlockAnchor { type: 'anchor'; text: string; id: string }
export interface InputRichBlockList { type: 'list'; items: RichBlockListItem[] }
export interface InputRichBlockBlockQuotation { type: 'block_quotation'; text: RichText }
export interface InputRichBlockPullQuotation { type: 'pull_quotation'; text: RichText }
export interface InputRichBlockCollage { type: 'collage'; blocks: InputRichBlockPhoto[] }
export interface InputRichBlockSlideshow { type: 'slideshow'; blocks: InputRichBlockPhoto[] }
export interface InputRichBlockTable { type: 'table'; rows: RichBlockTableCell[][]; column_count: number }
export interface InputRichBlockDetails { type: 'details'; summary: RichText; details: RichText[] }
export interface InputRichBlockMap { type: 'map'; latitude: number; longitude: number; heading: number; zoom: number }
export interface InputRichBlockAnimation { type: 'animation'; animation: InputFile | string }
export interface InputRichBlockPhoto { type: 'photo'; photo: InputFile | string }
export interface InputRichBlockVideo { type: 'video'; video: InputFile | string }
export interface InputRichBlockAudio { type: 'audio'; audio: InputFile | string }
export interface InputRichBlockVoiceNote { type: 'voice_note'; voice: InputFile | string }
export interface InputRichBlockThinking { type: 'thinking'; text: string }

// ── Inline query result types ──────────────────────────────────

export type InlineQueryResult =
  | InlineQueryResultArticle
  | InlineQueryResultPhoto
  | InlineQueryResultGif
  | InlineQueryResultMpeg4Gif
  | InlineQueryResultVideo
  | InlineQueryResultAudio
  | InlineQueryResultVoice
  | InlineQueryResultDocument
  | InlineQueryResultLocation
  | InlineQueryResultVenue
  | InlineQueryResultContact
  | InlineQueryResultGame
  | InlineQueryResultCachedPhoto
  | InlineQueryResultCachedGif
  | InlineQueryResultCachedMpeg4Gif
  | InlineQueryResultCachedSticker
  | InlineQueryResultCachedDocument
  | InlineQueryResultCachedVideo
  | InlineQueryResultCachedVoice
  | InlineQueryResultCachedAudio;

export interface InlineQueryResultArticle {
  type: 'article';
  id: string;
  title: string;
  input_message_content: InputMessageContent;
  reply_markup?: InlineKeyboardMarkup;
  url?: string;
  hide_url?: boolean;
  description?: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
}

export interface InlineQueryResultPhoto {
  type: 'photo';
  id: string;
  photo_url: string;
  thumbnail_url: string;
  photo_width?: number;
  photo_height?: number;
  title?: string;
  description?: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultGif {
  type: 'gif';
  id: string;
  gif_url: string;
  gif_thumbnail_url: string;
  gif_width?: number;
  gif_height?: number;
  gif_duration?: number;
  thumbnail_mime_type?: string;
  title?: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultMpeg4Gif {
  type: 'mpeg4_gif';
  id: string;
  mpeg4_url: string;
  mpeg4_thumbnail_url: string;
  mpeg4_width?: number;
  mpeg4_height?: number;
  mpeg4_duration?: number;
  thumbnail_mime_type?: string;
  title?: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultVideo {
  type: 'video';
  id: string;
  video_url: string;
  mime_type: string;
  thumbnail_url: string;
  title: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  video_width?: number;
  video_height?: number;
  video_duration?: number;
  description?: string;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultAudio {
  type: 'audio';
  id: string;
  audio_url: string;
  title: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  performer?: string;
  audio_duration?: number;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultVoice {
  type: 'voice';
  id: string;
  voice_url: string;
  title: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  voice_duration?: number;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultDocument {
  type: 'document';
  id: string;
  title: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  document_url: string;
  mime_type: string;
  description?: string;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
}

export interface InlineQueryResultLocation {
  type: 'location';
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  horizontal_accuracy?: number;
  live_period?: number;
  heading?: number;
  proximity_alert_radius?: number;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
}

export interface InlineQueryResultVenue {
  type: 'venue';
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  address: string;
  foursquare_id?: string;
  foursquare_type?: string;
  google_place_id?: string;
  google_place_type?: string;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
}

export interface InlineQueryResultContact {
  type: 'contact';
  id: string;
  phone_number: string;
  first_name: string;
  last_name?: string;
  vcard?: string;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
}

export interface InlineQueryResultGame {
  type: 'game';
  id: string;
  game_short_name: string;
  reply_markup?: InlineKeyboardMarkup;
}

export interface InlineQueryResultCachedPhoto {
  type: 'photo';
  id: string;
  photo_file_id: string;
  title?: string;
  description?: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultCachedGif {
  type: 'gif';
  id: string;
  gif_file_id: string;
  title?: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultCachedMpeg4Gif {
  type: 'mpeg4_gif';
  id: string;
  mpeg4_file_id: string;
  title?: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultCachedSticker {
  type: 'sticker';
  id: string;
  sticker_file_id: string;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultCachedDocument {
  type: 'document';
  id: string;
  title: string;
  document_file_id: string;
  description?: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultCachedVideo {
  type: 'video';
  id: string;
  video_file_id: string;
  title: string;
  description?: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultCachedVoice {
  type: 'voice';
  id: string;
  voice_file_id: string;
  title: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export interface InlineQueryResultCachedAudio {
  type: 'audio';
  id: string;
  audio_file_id: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  reply_markup?: InlineKeyboardMarkup;
  input_message_content?: InputMessageContent;
}

export type InputMessageContent =
  | InputTextMessageContent
  | InputLocationMessageContent
  | InputVenueMessageContent
  | InputContactMessageContent
  | InputInvoiceMessageContent
  | InputRichMessageContent;

export interface InputTextMessageContent {
  message_text: string;
  parse_mode?: ParseMode;
  entities?: MessageEntity[];
  link_preview_options?: LinkPreviewOptions;
}

export interface InputLocationMessageContent {
  latitude: number;
  longitude: number;
  horizontal_accuracy?: number;
  live_period?: number;
  heading?: number;
  proximity_alert_radius?: number;
}

export interface InputVenueMessageContent {
  latitude: number;
  longitude: number;
  title: string;
  address: string;
  foursquare_id?: string;
  foursquare_type?: string;
  google_place_id?: string;
  google_place_type?: string;
}

export interface InputContactMessageContent {
  phone_number: string;
  first_name: string;
  last_name?: string;
  vcard?: string;
}

export interface InputInvoiceMessageContent {
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
}

export interface InputRichMessageContent {
  rich_message: InputRichMessage;
}

export interface LabeledPrice {
  label: string;
  amount: number;
}

// ── Input media (sendMediaGroup, editMessageMedia) ────────────

export type InputMedia =
  | InputMediaPhoto
  | InputMediaVideo
  | InputMediaAnimation
  | InputMediaAudio
  | InputMediaDocument
  | InputMediaLivePhoto
  | InputMediaLink
  | InputMediaSticker
  | InputMediaLocation
  | InputMediaVenue;

export interface InputMediaPhoto {
  type: 'photo';
  media: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  has_spoiler?: boolean;
}

export interface InputMediaVideo {
  type: 'video';
  media: string;
  thumbnail?: InputFile | string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  width?: number;
  height?: number;
  duration?: number;
  supports_streaming?: boolean;
  has_spoiler?: boolean;
  cover?: InputFile | string;
  start_timestamp?: number;
}

export interface InputMediaAnimation {
  type: 'animation';
  media: string;
  thumbnail?: InputFile | string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  width?: number;
  height?: number;
  duration?: number;
  has_spoiler?: boolean;
}

export interface InputMediaAudio {
  type: 'audio';
  media: string;
  thumbnail?: InputFile | string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  duration?: number;
  performer?: string;
  title?: string;
}

export interface InputMediaDocument {
  type: 'document';
  media: string;
  thumbnail?: InputFile | string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  disable_content_type_detection?: boolean;
}

export interface InputMediaLivePhoto {
  type: 'live_photo';
  media: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
}

export interface InputMediaLink {
  type: 'link';
  media: string;
  caption?: string;
  parse_mode?: ParseMode;
  caption_entities?: MessageEntity[];
}

export interface InputMediaSticker {
  type: 'sticker';
  media: string;
}

export interface InputMediaLocation {
  type: 'location';
  media: string;
}

export interface InputMediaVenue {
  type: 'venue';
  media: string;
}

// ── Sticker sets ──────────────────────────────────────────────

export interface StickerSet {
  name: string;
  title: string;
  sticker_type: 'regular' | 'mask' | 'custom_emoji';
  stickers: Sticker[];
  thumbnail?: PhotoSize;
}

// ── MessageId (for copyMessage) ───────────────────────────────

export interface MessageId {
  message_id: number;
}

// ── SentGuestMessage (Bot API 10.0) ──────────────────────────

export interface SentGuestMessage {
  message?: Message;
  status: 'sent' | 'pending';
}

// ── Game ─────────────────────────────────────────────────────

export interface Game {
  title: string;
  description: string;
  photo: PhotoSize[];
  text?: string;
  text_entities?: MessageEntity[];
  animation?: Animation;
}

// ── Menu button ──────────────────────────────────────────────

export type MenuButton =
  | MenuButtonCommands
  | MenuButtonWebApp
  | MenuButtonDefault;

export interface MenuButtonCommands {
  type: 'commands';
}

export interface MenuButtonWebApp {
  type: 'web_app';
  text: string;
  web_app: WebAppInfo;
}

export interface MenuButtonDefault {
  type: 'default';
}

// ── Chat full info (getMy*.setMy*) ───────────────────────────

export interface BotName {
  name: string;
}

export interface BotDescription {
  description: string;
}

export interface BotShortDescription {
  short_description: string;
}

export interface BotCommand {
  command: string;
  description: string;
}

export interface BotCommandScope {
  type: BotCommandScopeType;
  chat_id?: number | string;
  user_id?: number;
}

export type BotCommandScopeType =
  | 'default'
  | 'all_private_chats'
  | 'all_group_chats'
  | 'all_chat_administrators'
  | 'chat'
  | 'chat_administrators'
  | 'chat_member';

// ── Inline mode ───────────────────────────────────────────────

export interface SentWebAppMessage {
  inline_message_id?: string;
}

// ── General types ──────────────────────────────────────────────

export type ParseMode = 'MarkdownV2' | 'HTML' | 'Markdown';

export type UpdateType =
  | 'message' | 'edited_message' | 'channel_post' | 'edited_channel_post'
  | 'business_connection' | 'business_message' | 'edited_business_message'
  | 'deleted_business_messages' | 'guest_message'
  | 'message_reaction' | 'message_reaction_count'
  | 'inline_query' | 'chosen_inline_result' | 'callback_query'
  | 'shipping_query' | 'pre_checkout_query' | 'purchased_paid_media'
  | 'poll' | 'poll_answer'
  | 'my_chat_member' | 'chat_member' | 'chat_join_request'
  | 'chat_boost' | 'removed_chat_boost' | 'managed_bot';

export interface MessageOriginUser {
  type: 'user';
  date: number;
  sender_user: TelegramUser;
}

export interface MessageOriginHiddenUser {
  type: 'hidden_user';
  date: number;
  sender_user_name: string;
}

export interface MessageOriginChat {
  type: 'chat';
  date: number;
  sender_chat: Chat;
  author_signature?: string;
}

export interface MessageOriginChannel {
  type: 'channel';
  date: number;
  chat: Chat;
  message_id: number;
  author_signature?: string;
}

export type ForwardOrigin =
  | MessageOriginUser
  | MessageOriginHiddenUser
  | MessageOriginChat
  | MessageOriginChannel;

export type SenderOrigin =
  | SenderOriginUser
  | SenderOriginChat;

export interface SenderOriginUser {
  type: 'user';
  user: TelegramUser;
}

export interface SenderOriginChat {
  type: 'chat';
  chat: Chat;
  author_signature?: string;
}

// ── Link ────────────────────────────────────────────────────────

export interface Link {
  url: string;
  entities?: MessageEntity[];
}
