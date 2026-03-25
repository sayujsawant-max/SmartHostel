import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, Globe } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

// ---------------------------------------------------------------------------
// Supported languages
// ---------------------------------------------------------------------------

interface LangMeta {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: LangMeta[] = [
  { code: 'en', name: 'English', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { code: 'hi', name: '\u0939\u093F\u0928\u094D\u0926\u0940', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'ta', name: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'te', name: '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'bn', name: '\u09AC\u09BE\u0982\u09B2\u09BE', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
];

// ---------------------------------------------------------------------------
// Translation dictionaries
// ---------------------------------------------------------------------------

type Dict = Record<string, string>;

const en: Dict = {
  // Navigation
  dashboard: 'Dashboard',
  actions: 'Actions',
  menu: 'Menu',
  laundry: 'Laundry',
  help: 'Help',
  settings: 'Settings',
  profile: 'Profile',
  logout: 'Logout',
  notifications: 'Notifications',
  // Actions
  submit: 'Submit',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  search: 'Search',
  filter: 'Filter',
  clear: 'Clear',
  send: 'Send',
  upload: 'Upload',
  download: 'Download',
  // Status
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  in_progress: 'In Progress',
  // Common
  loading: 'Loading',
  no_results: 'No results',
  error_occurred: 'Error occurred',
  success: 'Success',
  confirm: 'Confirm',
  welcome: 'Welcome',
  today: 'Today',
  rooms: 'Rooms',
  complaints: 'Complaints',
  notices: 'Notices',
  visitors: 'Visitors',
  students: 'Students',
  lost_found: 'Lost & Found',
  mess_menu: 'Mess Menu',
  room_change: 'Room Change',
};

const hi: Dict = {
  dashboard: '\u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921',
  actions: '\u0915\u093E\u0930\u094D\u092F',
  menu: '\u092E\u0947\u0928\u094D\u092F\u0942',
  laundry: '\u0932\u0949\u0928\u094D\u0921\u094D\u0930\u0940',
  help: '\u0938\u0939\u093E\u092F\u0924\u093E',
  settings: '\u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938',
  profile: '\u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932',
  logout: '\u0932\u0949\u0917 \u0906\u0909\u091F',
  notifications: '\u0938\u0942\u091A\u0928\u093E\u090F\u0901',
  submit: '\u091C\u092E\u093E \u0915\u0930\u0947\u0902',
  cancel: '\u0930\u0926\u094D\u0926 \u0915\u0930\u0947\u0902',
  save: '\u0938\u0939\u0947\u091C\u0947\u0902',
  delete: '\u0939\u091F\u093E\u090F\u0902',
  edit: '\u0938\u0902\u092A\u093E\u0926\u093F\u0924 \u0915\u0930\u0947\u0902',
  search: '\u0916\u094B\u091C\u0947\u0902',
  filter: '\u092B\u093C\u093F\u0932\u094D\u091F\u0930',
  clear: '\u0938\u093E\u092B\u093C \u0915\u0930\u0947\u0902',
  send: '\u092D\u0947\u091C\u0947\u0902',
  upload: '\u0905\u092A\u0932\u094B\u0921',
  download: '\u0921\u093E\u0909\u0928\u0932\u094B\u0921',
  active: '\u0938\u0915\u094D\u0930\u093F\u092F',
  inactive: '\u0928\u093F\u0937\u094D\u0915\u094D\u0930\u093F\u092F',
  pending: '\u0932\u0902\u092C\u093F\u0924',
  approved: '\u0938\u094D\u0935\u0940\u0915\u0943\u0924',
  rejected: '\u0905\u0938\u094D\u0935\u0940\u0915\u0943\u0924',
  completed: '\u092A\u0942\u0930\u094D\u0923',
  in_progress: '\u092A\u094D\u0930\u0917\u0924\u093F \u092E\u0947\u0902',
  loading: '\u0932\u094B\u0921 \u0939\u094B \u0930\u0939\u093E \u0939\u0948',
  no_results: '\u0915\u094B\u0908 \u092A\u0930\u093F\u0923\u093E\u092E \u0928\u0939\u0940\u0902',
  error_occurred: '\u0924\u094D\u0930\u0941\u091F\u093F \u0939\u0941\u0908',
  success: '\u0938\u092B\u0932',
  confirm: '\u092A\u0941\u0937\u094D\u091F\u093F \u0915\u0930\u0947\u0902',
  welcome: '\u0938\u094D\u0935\u093E\u0917\u0924',
  today: '\u0906\u091C',
  rooms: '\u0915\u092E\u0930\u0947',
  complaints: '\u0936\u093F\u0915\u093E\u092F\u0924\u0947\u0902',
  notices: '\u0938\u0942\u091A\u0928\u093E\u090F\u0901',
  visitors: '\u0906\u0917\u0902\u0924\u0941\u0915',
  students: '\u091B\u093E\u0924\u094D\u0930',
  lost_found: '\u0916\u094B\u092F\u093E \u0914\u0930 \u092A\u093E\u092F\u093E',
  mess_menu: '\u092E\u0947\u0938 \u092E\u0947\u0928\u094D\u092F\u0942',
  room_change: '\u0915\u092E\u0930\u093E \u092C\u0926\u0932\u0947\u0902',
};

const ta: Dict = {
  dashboard: '\u0B95\u0B9F\u0BCD\u0B9F\u0BC1\u0BAA\u0BCD\u0BAA\u0BB2\u0B95\u0BC8',
  actions: '\u0B9A\u0BC6\u0BAF\u0BB2\u0BCD\u0B95\u0BB3\u0BCD',
  menu: '\u0BAA\u0B9F\u0BCD\u0B9F\u0BBF\u0BAF\u0BB2\u0BCD',
  laundry: '\u0B9A\u0BB2\u0BB5\u0BC8',
  help: '\u0B89\u0BA4\u0BB5\u0BBF',
  settings: '\u0B85\u0BAE\u0BC8\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD',
  profile: '\u0BAA\u0BCD\u0BB0\u0BCA\u0BAA\u0BC8\u0BB2\u0BCD',
  logout: '\u0BB5\u0BC6\u0BB3\u0BBF\u0BAF\u0BC7\u0BB1\u0BC1',
  notifications: '\u0B85\u0BB1\u0BBF\u0BB5\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD',
  submit: '\u0B9A\u0BAE\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BBF',
  cancel: '\u0BB0\u0BA4\u0BCD\u0BA4\u0BC1',
  save: '\u0B9A\u0BC7\u0BAE\u0BBF',
  delete: '\u0B85\u0BB4\u0BBF',
  edit: '\u0BA4\u0BBF\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1',
  search: '\u0BA4\u0BC7\u0B9F\u0BC1',
  filter: '\u0BB5\u0B9F\u0BBF\u0B95\u0B9F\u0BCD\u0B9F\u0BBF',
  clear: '\u0BA4\u0BC6\u0BB3\u0BBF\u0BB5\u0BC1',
  send: '\u0B85\u0BA9\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1',
  upload: '\u0BAA\u0BA4\u0BBF\u0BB5\u0BC7\u0BB1\u0BCD\u0BB1\u0BC1',
  download: '\u0BAA\u0BA4\u0BBF\u0BB5\u0BBF\u0BB1\u0B95\u0BCD\u0B95\u0BC1',
  active: '\u0B9A\u0BC6\u0BAF\u0BB2\u0BCD\u0BAA\u0B9F\u0BC1',
  inactive: '\u0B9A\u0BC6\u0BAF\u0BB2\u0BCD\u0BAA\u0B9F\u0BA4\u0BCD\u0BA4',
  pending: '\u0BA8\u0BBF\u0BB2\u0BC1\u0BB5\u0BC8\u0BAF\u0BBF\u0BB2\u0BCD',
  approved: '\u0B85\u0B99\u0BCD\u0B95\u0BC0\u0B95\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1',
  rejected: '\u0BA8\u0BBF\u0BB0\u0BBE\u0B95\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1',
  completed: '\u0BAE\u0BC1\u0B9F\u0BBF\u0BA8\u0BCD\u0BA4\u0BA4\u0BC1',
  in_progress: '\u0BA8\u0B9F\u0BAA\u0BCD\u0BAA\u0BBF\u0BB2\u0BCD',
  loading: '\u0B8F\u0BB1\u0BCD\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0B95\u0BBF\u0BB1\u0BA4\u0BC1',
  no_results: '\u0BAE\u0BC1\u0B9F\u0BBF\u0BB5\u0BC1\u0B95\u0BB3\u0BCD \u0B87\u0BB2\u0BCD\u0BB2\u0BC8',
  error_occurred: '\u0BAA\u0BBF\u0BB4\u0BC8 \u0B8F\u0BB1\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1',
  success: '\u0BB5\u0BC6\u0BB1\u0BCD\u0BB1\u0BBF',
  confirm: '\u0B89\u0BB1\u0BC1\u0BA4\u0BBF\u0BAA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1',
  welcome: '\u0BB5\u0BB0\u0BB5\u0BC7\u0BB1\u0BCD\u0BAA\u0BC1',
  today: '\u0B87\u0BA9\u0BCD\u0BB1\u0BC1',
  rooms: '\u0B85\u0BB1\u0BC8\u0B95\u0BB3\u0BCD',
  complaints: '\u0BAA\u0BC1\u0B95\u0BBE\u0BB0\u0BCD\u0B95\u0BB3\u0BCD',
  notices: '\u0B85\u0BB1\u0BBF\u0BB5\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD',
  visitors: '\u0BAA\u0BBE\u0BB0\u0BCD\u0BB5\u0BC8\u0BAF\u0BBE\u0BB3\u0BB0\u0BCD\u0B95\u0BB3\u0BCD',
  students: '\u0BAE\u0BBE\u0BA3\u0BB5\u0BB0\u0BCD\u0B95\u0BB3\u0BCD',
  lost_found: '\u0BA4\u0BCA\u0BB2\u0BC8\u0BA8\u0BCD\u0BA4\u0BA4\u0BC1 \u0B95\u0BBF\u0B9F\u0BC8\u0BA4\u0BCD\u0BA4\u0BA4\u0BC1',
  mess_menu: '\u0BAE\u0BC6\u0BB8\u0BCD \u0BAA\u0B9F\u0BCD\u0B9F\u0BBF\u0BAF\u0BB2\u0BCD',
  room_change: '\u0B85\u0BB1\u0BC8 \u0BAE\u0BBE\u0BB1\u0BCD\u0BB1\u0BAE\u0BCD',
};

const te: Dict = {
  dashboard: '\u0C21\u0C3E\u0C37\u0C4D\u200C\u0C2C\u0C4B\u0C30\u0C4D\u0C21\u0C4D',
  actions: '\u0C1A\u0C30\u0C4D\u0C2F\u0C32\u0C41',
  menu: '\u0C2E\u0C46\u0C28\u0C42',
  laundry: '\u0C32\u0C3E\u0C02\u0C21\u0C4D\u0C30\u0C40',
  help: '\u0C38\u0C39\u0C3E\u0C2F\u0C02',
  settings: '\u0C38\u0C46\u0C1F\u0C4D\u0C1F\u0C3F\u0C02\u0C17\u0C4D\u0C38\u0C4D',
  profile: '\u0C2A\u0C4D\u0C30\u0C4A\u0C2B\u0C48\u0C32\u0C4D',
  logout: '\u0C32\u0C3E\u0C17\u0C4D \u0C05\u0C35\u0C41\u0C1F\u0C4D',
  notifications: '\u0C28\u0C4B\u0C1F\u0C3F\u0C2B\u0C3F\u0C15\u0C47\u0C37\u0C28\u0C4D\u0C32\u0C41',
  submit: '\u0C38\u0C2E\u0C30\u0C4D\u0C2A\u0C3F\u0C02\u0C1A\u0C41',
  cancel: '\u0C30\u0C26\u0C4D\u0C26\u0C41 \u0C1A\u0C47\u0C2F\u0C3F',
  save: '\u0C38\u0C47\u0C35\u0C4D \u0C1A\u0C47\u0C2F\u0C3F',
  delete: '\u0C24\u0C4A\u0C32\u0C17\u0C3F\u0C02\u0C1A\u0C41',
  edit: '\u0C0E\u0C21\u0C3F\u0C1F\u0C4D \u0C1A\u0C47\u0C2F\u0C3F',
  search: '\u0C35\u0C46\u0C24\u0C15\u0C41',
  filter: '\u0C2B\u0C3F\u0C32\u0C4D\u0C1F\u0C30\u0C4D',
  clear: '\u0C15\u0C4D\u0C32\u0C3F\u0C2F\u0C30\u0C4D',
  send: '\u0C2A\u0C02\u0C2A\u0C41',
  upload: '\u0C05\u0C2A\u0C4D\u200C\u0C32\u0C4B\u0C21\u0C4D',
  download: '\u0C21\u0C4C\u0C28\u0C4D\u200C\u0C32\u0C4B\u0C21\u0C4D',
  active: '\u0C2F\u0C3E\u0C15\u0C4D\u0C1F\u0C3F\u0C35\u0C4D',
  inactive: '\u0C28\u0C3F\u0C37\u0C4D\u0C15\u0C4D\u0C30\u0C3F\u0C2F',
  pending: '\u0C2A\u0C46\u0C02\u0C21\u0C3F\u0C02\u0C17\u0C4D',
  approved: '\u0C06\u0C2E\u0C4B\u0C26\u0C3F\u0C02\u0C1A\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F',
  rejected: '\u0C24\u0C3F\u0C30\u0C38\u0C4D\u0C15\u0C30\u0C3F\u0C02\u0C1A\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F',
  completed: '\u0C2A\u0C42\u0C30\u0C4D\u0C24\u0C2F\u0C3F\u0C02\u0C26\u0C3F',
  in_progress: '\u0C2A\u0C4D\u0C30\u0C17\u0C24\u0C3F\u0C32\u0C4B',
  loading: '\u0C32\u0C4B\u0C21\u0C4D \u0C05\u0C35\u0C41\u0C24\u0C4B\u0C02\u0C26\u0C3F',
  no_results: '\u0C2B\u0C32\u0C3F\u0C24\u0C3E\u0C32\u0C41 \u0C32\u0C47\u0C35\u0C41',
  error_occurred: '\u0C32\u0C4B\u0C2A\u0C02 \u0C38\u0C02\u0C2D\u0C35\u0C3F\u0C02\u0C1A\u0C3F\u0C02\u0C26\u0C3F',
  success: '\u0C35\u0C3F\u0C1C\u0C2F\u0C02',
  confirm: '\u0C28\u0C3F\u0C30\u0C4D\u0C27\u0C3E\u0C30\u0C3F\u0C02\u0C1A\u0C41',
  welcome: '\u0C38\u0C4D\u0C35\u0C3E\u0C17\u0C24\u0C02',
  today: '\u0C08 \u0C30\u0C4B\u0C1C\u0C41',
  rooms: '\u0C17\u0C26\u0C41\u0C32\u0C41',
  complaints: '\u0C2B\u0C3F\u0C30\u0C4D\u0C2F\u0C3E\u0C26\u0C41\u0C32\u0C41',
  notices: '\u0C28\u0C4B\u0C1F\u0C40\u0C38\u0C41\u0C32\u0C41',
  visitors: '\u0C38\u0C02\u0C26\u0C30\u0C4D\u0C36\u0C15\u0C41\u0C32\u0C41',
  students: '\u0C35\u0C3F\u0C26\u0C4D\u0C2F\u0C3E\u0C30\u0C4D\u0C25\u0C41\u0C32\u0C41',
  lost_found: '\u0C2A\u0C4B\u0C17\u0C4A\u0C1F\u0C4D\u0C1F\u0C3F\u0C28\u0C35\u0C3F \u0C26\u0C4A\u0C30\u0C3F\u0C15\u0C3F\u0C28\u0C35\u0C3F',
  mess_menu: '\u0C2E\u0C46\u0C38\u0C4D \u0C2E\u0C46\u0C28\u0C42',
  room_change: '\u0C17\u0C26\u0C3F \u0C2E\u0C3E\u0C30\u0C4D\u0C2A\u0C41',
};

const bn: Dict = {
  dashboard: '\u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1',
  actions: '\u0995\u09BE\u09B0\u09CD\u09AF\u0995\u09B2\u09BE\u09AA',
  menu: '\u09AE\u09C7\u09A8\u09C1',
  laundry: '\u09B2\u09A8\u09CD\u09A1\u09CD\u09B0\u09BF',
  help: '\u09B8\u09BE\u09B9\u09BE\u09AF\u09CD\u09AF',
  settings: '\u09B8\u09C7\u099F\u09BF\u0982\u09B8',
  profile: '\u09AA\u09CD\u09B0\u09CB\u09AB\u09BE\u0987\u09B2',
  logout: '\u09B2\u0997 \u0986\u0989\u099F',
  notifications: '\u09AC\u09BF\u099C\u09CD\u099E\u09AA\u09CD\u09A4\u09BF',
  submit: '\u099C\u09AE\u09BE \u09A6\u09BF\u09A8',
  cancel: '\u09AC\u09BE\u09A4\u09BF\u09B2',
  save: '\u09B8\u09C7\u09AD',
  delete: '\u09AE\u09C1\u099B\u09C1\u09A8',
  edit: '\u09B8\u09AE\u09CD\u09AA\u09BE\u09A6\u09A8\u09BE',
  search: '\u0985\u09A8\u09C1\u09B8\u09A8\u09CD\u09A7\u09BE\u09A8',
  filter: '\u09AB\u09BF\u09B2\u09CD\u099F\u09BE\u09B0',
  clear: '\u09AE\u09C1\u099B\u09C1\u09A8',
  send: '\u09AA\u09BE\u09A0\u09BE\u09A8',
  upload: '\u0986\u09AA\u09B2\u09CB\u09A1',
  download: '\u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1',
  active: '\u09B8\u0995\u09CD\u09B0\u09BF\u09AF\u09BC',
  inactive: '\u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09AF\u09BC',
  pending: '\u09AE\u09C1\u09B2\u09A4\u09C1\u09AC\u09BF',
  approved: '\u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4',
  rejected: '\u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09BE\u0996\u09CD\u09AF\u09BE\u09A4',
  completed: '\u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8',
  in_progress: '\u099A\u09B2\u09AE\u09BE\u09A8',
  loading: '\u09B2\u09CB\u09A1 \u09B9\u099A\u09CD\u099B\u09C7',
  no_results: '\u0995\u09CB\u09A8\u09CB \u09AB\u09B2\u09BE\u09AB\u09B2 \u09A8\u09C7\u0987',
  error_occurred: '\u09A4\u09CD\u09B0\u09C1\u099F\u09BF \u0998\u099F\u09C7\u099B\u09C7',
  success: '\u09B8\u09AB\u09B2',
  confirm: '\u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09C1\u09A8',
  welcome: '\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE',
  today: '\u0986\u099C',
  rooms: '\u0995\u0995\u09CD\u09B7',
  complaints: '\u0985\u09AD\u09BF\u09AF\u09CB\u0997',
  notices: '\u09AC\u09BF\u099C\u09CD\u099E\u09AA\u09CD\u09A4\u09BF',
  visitors: '\u09A6\u09B0\u09CD\u09B6\u09A8\u09BE\u09B0\u09CD\u09A5\u09C0',
  students: '\u099B\u09BE\u09A4\u09CD\u09B0',
  lost_found: '\u09B9\u09BE\u09B0\u09BE\u09A8\u09CB \u098F\u09AC\u0982 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE',
  mess_menu: '\u09AE\u09C7\u09B8 \u09AE\u09C7\u09A8\u09C1',
  room_change: '\u0998\u09B0 \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8',
};

const translations: Record<string, Dict> = { en, hi, ta, te, bn };

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface I18nContextValue {
  locale: string;
  setLocale: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'smarthostel-lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  const setLocale = useCallback((lang: string) => {
    setLocaleState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = translations[locale] || translations.en;
      return dict[key] ?? translations.en[key] ?? fallback ?? key;
    },
    [locale],
  );

  // All supported languages are LTR
  const dir: 'ltr' | 'rtl' = 'ltr';

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// LanguageSelector component
// ---------------------------------------------------------------------------

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm font-medium text-[hsl(var(--card-foreground))] transition-colors hover:bg-[hsl(var(--accent))]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={spring}
      >
        <Globe className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <span>
          {current.flag} {current.name}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop to close */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-lg"
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={spring}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[hsl(var(--card-foreground))] transition-colors hover:bg-[hsl(var(--accent))]"
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.name}</span>
                  {lang.code === locale && (
                    <Check className="h-4 w-4 text-[hsl(var(--primary))]" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
